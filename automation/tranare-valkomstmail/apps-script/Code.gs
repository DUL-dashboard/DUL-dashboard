/**
 * Google Apps Script - webhook-mottagare för TESTFORMULÄRET.
 *
 * VIKTIGT - LÄS INNAN DU DEPLOYAR:
 * Detta skript är byggt för att köras i en helt separat, isolerad testmiljö.
 * Det ska INTE kopplas till "DUL anmälan tränare" eller något annat
 * live-formulär. CONFIG.testMode ska stå kvar på true och
 * CONFIG.allowedFormIds ska bara innehålla test-formulärets ID tills ni
 * medvetet bestämmer er för att gå live (se README.md, avsnittet
 * "Gå live - manuella steg").
 *
 * Filen `Logic.gs` i samma Apps Script-projekt ska vara en exakt kopia av
 * ../shared-logic.js (den delade, testade logiken). Skapa den filen först.
 *
 * Deploy: Extensions > Apps Script i ett NYTT, fristående Google-konto/
 * projekt -> Deploy > New deployment > Web app -> Execute as: Me,
 * Who has access: Anyone. Kopiera Web App-URL:en och använd den som
 * webhook-mål i TESTFORMULÄRET i Tally (aldrig i "DUL anmälan tränare").
 */

var CONFIG = {
  // Säkerhetsspärr #1: tvinga alla mejl till din egen adress så länge vi
  // testar. Ändra ALDRIG detta till false utan att ha läst README.md.
  testMode: true,
  testRecipientEmail: "DIN-EGEN-EPOST@example.com", // <- byt till din riktiga adress

  // Säkerhetsspärr #2: bara webhooks från dessa formulär-ID:n hanteras.
  // Lägg till testformulärets ID (hittas i Tally under Share > i URL:en,
  // t.ex. https://tally.so/forms/AbCdEf -> ID:t är "AbCdEf") när du skapat
  // det. Lägg ALDRIG till "DUL anmälan tränare" eller 68ED6O här.
  allowedFormIds: ["BYT_UT_MOT_TESTFORMULARETS_ID"],

  // I test-läge: bas-URL till en enkel testenkät (kan t.ex. vara samma
  // testformulär igen, eller en enkel "tack"-sida) - ALDRIG 68ED6O.
  dulSurveyBaseUrl: "https://tally.so/r/BYT_UT_MOT_TESTENKATENS_ID",

  // Vilka fält-etiketter i Tally-formuläret som motsvarar namn/e-post/
  // coach-id. Justera till exakt de rubriker ni sätter i testformuläret.
  fieldLabels: {
    name: ["Namn", "Name"],
    email: ["E-post", "Email", "E-mail"],
    coachId: ["Coach ID", "Coach_ID", "CoachID"],
  },

  // Mejlets ämnesrad och brödtext - redigera fritt. Tillgängliga
  // platshållare: {{namn}} och {{lank}} (den personliga DUL-länken).
  // I testläge läggs [TEST] och en varningsbanderoll till automatiskt
  // (se formatWelcomeEmail i Logic.gs) - det går inte att skriva bort
  // dem härifrån, så det är ofarligt att experimentera med texten.
  emailTemplate: {
    subject: "Välkommen till DUL - din personliga länk",
    body: [
      "Hej {{namn}}!",
      "",
      "Tack för din anmälan. Här är din personliga länk till DUL-enkäten:",
      "",
      "{{lank}}",
      "",
      "Länken är unik för dig - dela den inte vidare.",
      "",
      "Vänliga hälsningar",
    ].join("\n"),
  },

  // Delad hemlighet som måste matcha query-parametern `?secret=...` i
  // webhook-URL:en. Sätts INTE här i koden (för att inte hamna i historik/
  // delningar av skriptet) utan i Project Settings > Script Properties,
  // med nyckeln WEBHOOK_SECRET. Se README.md för hur du genererar en.
};

/**
 * Tar emot webhook-POST från Tally.
 */
function doPost(e) {
  try {
    verifyWebhookSecret_(e);

    var payload = JSON.parse(e.postData.contents);
    var formId = payload && payload.data && payload.data.formId;

    if (!isAllowedForm(CONFIG, formId)) {
      Logger.log(
        "Avvisar webhook - formId '" +
          formId +
          "' finns inte i CONFIG.allowedFormIds."
      );
      return ContentService.createTextOutput(
        "ignored: form not allowlisted"
      );
    }

    var parsed = parseTallyPayload(payload, CONFIG.fieldLabels);
    var link = buildPersonalDulLink(CONFIG, parsed.coachId);
    var email = formatWelcomeEmail({
      name: parsed.name,
      personalLink: link,
      testMode: CONFIG.testMode,
      originalEmail: parsed.email,
      template: CONFIG.emailTemplate,
    });
    var recipient = resolveRecipient(CONFIG, parsed.email);

    sendWelcomeEmail_(recipient, email.subject, email.body);

    Logger.log(
      "Skickade välkomstmejl (testMode=" +
        CONFIG.testMode +
        ") till " +
        recipient +
        " för anmälan " +
        parsed.submissionId
    );
    return ContentService.createTextOutput("ok");
  } catch (err) {
    Logger.log("Fel i doPost: " + err);
    return ContentService.createTextOutput("error: " + err.message);
  }
}

/**
 * Kontrollerar den delade hemligheten i query-strängen
 * (Web App-URL?secret=xxx). Kastar fel om den saknas eller inte stämmer.
 *
 * Apps Script Web Apps exponerar inte inkommande HTTP-headers till doPost,
 * så vi kan inte verifiera en HMAC-signaturheader - därför används istället
 * en hemlig query-parameter som del av webhook-URL:en.
 */
function verifyWebhookSecret_(e) {
  var expected = PropertiesService.getScriptProperties().getProperty(
    "WEBHOOK_SECRET"
  );
  if (!expected) {
    throw new Error(
      "WEBHOOK_SECRET är inte satt i Script Properties - vägrar ta emot webhooks tills den är konfigurerad."
    );
  }
  var provided = e && e.parameter && e.parameter.secret;
  if (provided !== expected) {
    throw new Error("Ogiltig eller saknad secret-parameter i webhook-URL:en.");
  }
}

/** Wrapper runt GmailApp så själva sändningen ligger på ett ställe. */
function sendWelcomeEmail_(recipient, subject, body) {
  GmailApp.sendEmail(recipient, subject, body);
}

/**
 * Kör manuellt från Apps Script-editorn (Run > selfTest) för att testa hela
 * kedjan UTAN att röra Tally alls. Säker att köra hur många gånger som
 * helst: CONFIG.testMode=true tvingar mottagaren till
 * CONFIG.testRecipientEmail oavsett vad exempel-payloaden innehåller.
 */
function selfTest() {
  var sample = {
    eventId: "self-test-event",
    eventType: "FORM_RESPONSE",
    createdAt: new Date().toISOString(),
    data: {
      responseId: "self-test-response",
      submissionId: "self-test-submission",
      respondentId: "self-test-respondent",
      formId: CONFIG.allowedFormIds[0],
      formName: "Självtest",
      fields: [
        { key: "q1", label: "Namn", type: "INPUT_TEXT", value: "Test Testsson" },
        {
          key: "q2",
          label: "E-post",
          type: "INPUT_EMAIL",
          value: "detta-ska-ALDRIG-fa-mejl@example.com",
        },
        { key: "q3", label: "Coach ID", type: "INPUT_TEXT", value: "SJALVTEST-123" },
      ],
    },
  };

  var fakeSecret = PropertiesService.getScriptProperties().getProperty(
    "WEBHOOK_SECRET"
  );
  var result = doPost({
    postData: { contents: JSON.stringify(sample) },
    parameter: { secret: fakeSecret },
  });
  Logger.log(result.getContent());
}
