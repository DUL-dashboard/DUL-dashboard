/**
 * Delad, ren logik för "tränare fyller i anmälningsformulär -> välkomstmejl
 * med personlig DUL-länk". Inga sidoeffekter här (inga nätverksanrop, inget
 * GmailApp) - allt sådant ligger i apps-script/Code.gs så att den här filen
 * kan köras och testas med vanlig Node (se ../tests/logic.test.js) INNAN den
 * klistras in i Google Apps Script.
 *
 * OBS: Filen är avsiktligt skriven utan import/export-syntax (bara
 * function-deklarationer) eftersom Google Apps Script inte förstår ES-moduler.
 * Blocket längst ner (`if (typeof module !== "undefined")`) gör ingenting när
 * filen klistras in i Apps Script (där `module` inte finns) - det finns
 * bara så att Node kan importera funktionerna för testerna.
 */

/**
 * Plockar ut { formId, submissionId, name, email, coachId } ur en rå
 * Tally-webhook-payload (FORM_RESPONSE-eventet).
 *
 * fieldLabels = { name: [...möjliga fältetiketter...], email: [...], coachId: [...] }
 * Matchning sker på trimmad, gemener-normaliserad etikett så att mindre
 * skillnader i formulärtexten (stor bokstav, mellanslag) inte spräcker allt.
 */
function parseTallyPayload(payload, fieldLabels) {
  if (!payload || payload.eventType !== "FORM_RESPONSE") {
    throw new Error(
      "Okänt eventType (väntade FORM_RESPONSE): " +
        (payload && payload.eventType)
    );
  }

  var data = payload.data || {};
  var fields = Array.isArray(data.fields) ? data.fields : [];

  var byLabel = {};
  fields.forEach(function (field) {
    var label = String(field.label || "")
      .trim()
      .toLowerCase();
    if (label) byLabel[label] = field.value;
  });

  function firstMatch(candidateLabels) {
    for (var i = 0; i < candidateLabels.length; i++) {
      var key = candidateLabels[i].trim().toLowerCase();
      if (Object.prototype.hasOwnProperty.call(byLabel, key)) {
        var value = byLabel[key];
        if (value !== null && value !== undefined && value !== "") {
          return value;
        }
      }
    }
    return null;
  }

  var name = firstMatch(fieldLabels.name);
  var email = firstMatch(fieldLabels.email);
  var coachId = firstMatch(fieldLabels.coachId);

  var missing = [];
  if (!name) missing.push("namn");
  if (!email) missing.push("e-post");
  if (!coachId) missing.push("coach-id");
  if (missing.length > 0) {
    throw new Error(
      "Saknar obligatoriska fält i formulärsvaret: " + missing.join(", ")
    );
  }

  return {
    formId: data.formId || null,
    submissionId: data.submissionId || data.responseId || null,
    name: String(name).trim(),
    email: String(email).trim(),
    coachId: String(coachId).trim(),
  };
}

/** Sant om formId finns med i den uttryckliga allowlistan i config. */
function isAllowedForm(config, formId) {
  var allowed = config.allowedFormIds || [];
  return !!formId && allowed.indexOf(formId) !== -1;
}

/**
 * Bygger den personliga DUL-länken. I test-läge pekar
 * config.dulSurveyBaseUrl mot testformuläret, ALDRIG mot 68ED6O.
 */
function buildPersonalDulLink(config, coachId) {
  if (!config.dulSurveyBaseUrl) {
    throw new Error("config.dulSurveyBaseUrl saknas");
  }
  var separator = config.dulSurveyBaseUrl.indexOf("?") === -1 ? "?" : "&";
  return (
    config.dulSurveyBaseUrl +
    separator +
    "Coach_ID=" +
    encodeURIComponent(coachId)
  );
}

/**
 * Säkerhetsspärren: i test-läge skickas mejlet ALLTID till
 * config.testRecipientEmail, oavsett vad som stod i formuläret. Detta är
 * det viktigaste stället att ha korrekt - testas extra noga.
 */
function resolveRecipient(config, submittedEmail) {
  if (config.testMode) {
    if (!config.testRecipientEmail) {
      throw new Error(
        "testMode är true men config.testRecipientEmail saknas - vägrar gissa mottagare"
      );
    }
    return config.testRecipientEmail;
  }
  return submittedEmail;
}

/** Bygger ämnesrad + brödtext för välkomstmejlet. */
function formatWelcomeEmail(options) {
  var name = options.name;
  var personalLink = options.personalLink;
  var testMode = !!options.testMode;
  var originalEmail = options.originalEmail;

  var subjectPrefix = testMode ? "[TEST] " : "";
  var subject = subjectPrefix + "Välkommen till DUL - din personliga länk";

  var lines = [];
  if (testMode) {
    lines.push(
      "*** TESTMEJL - detta hade i skarpt läge gått till: " +
        (originalEmail || "(okänd adress)") +
        " ***",
      ""
    );
  }
  lines.push(
    "Hej " + name + "!",
    "",
    "Tack för din anmälan. Här är din personliga länk till DUL-enkäten:",
    "",
    personalLink,
    "",
    "Länken är unik för dig - dela den inte vidare.",
    "",
    "Vänliga hälsningar"
  );

  return { subject: subject, body: lines.join("\n") };
}

if (typeof module !== "undefined") {
  module.exports = {
    parseTallyPayload: parseTallyPayload,
    isAllowedForm: isAllowedForm,
    buildPersonalDulLink: buildPersonalDulLink,
    resolveRecipient: resolveRecipient,
    formatWelcomeEmail: formatWelcomeEmail,
  };
}
