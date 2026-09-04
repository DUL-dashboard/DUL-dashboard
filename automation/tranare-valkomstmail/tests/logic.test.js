/**
 * Automatiserade tester för shared-logic.js. Kör helt lokalt, inga
 * nätverksanrop, ingen Tally, ingen Google, ingen Airtable.
 *
 *   node --test automation/tranare-valkomstmail/tests/logic.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  parseTallyPayload,
  isAllowedForm,
  buildPersonalDulLink,
  resolveRecipient,
  renderTemplate,
  formatWelcomeEmail,
} = require("../shared-logic.js");

function loadFixture(name) {
  const file = path.join(__dirname, "fixtures", name);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const FIELD_LABELS = {
  name: ["Namn", "Name"],
  email: ["E-post", "Email", "E-mail"],
  coachId: ["Coach ID", "Coach_ID", "CoachID"],
};

const DEFAULT_TEMPLATE = {
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
};

const TEST_CONFIG = {
  testMode: true,
  testRecipientEmail: "mig@example.com",
  allowedFormIds: ["TEST_FORM_ID"],
  dulSurveyBaseUrl: "https://tally.so/r/TEST_ENKAT_ID",
};

test("parseTallyPayload plockar ut namn, e-post och coachId", () => {
  const payload = loadFixture("tally-webhook-sample.json");
  const parsed = parseTallyPayload(payload, FIELD_LABELS);

  assert.equal(parsed.name, "Anna Andersson");
  assert.equal(parsed.email, "anna.andersson@example.com");
  assert.equal(parsed.coachId, "TEST-COACH-001");
  assert.equal(parsed.formId, "TEST_FORM_ID");
});

test("parseTallyPayload kastar tydligt fel när obligatoriska fält saknas", () => {
  const payload = loadFixture("tally-webhook-missing-field.json");
  assert.throws(
    () => parseTallyPayload(payload, FIELD_LABELS),
    /e-post, coach-id/
  );
});

test("parseTallyPayload kastar fel på fel eventType", () => {
  assert.throws(
    () => parseTallyPayload({ eventType: "PING" }, FIELD_LABELS),
    /Okänt eventType/
  );
});

test("isAllowedForm släpper bara igenom formulär i allowlistan", () => {
  assert.equal(isAllowedForm(TEST_CONFIG, "TEST_FORM_ID"), true);
  assert.equal(
    isAllowedForm(TEST_CONFIG, "DUL_ANMALAN_TRANARE_LIVE_ID"),
    false
  );
  assert.equal(isAllowedForm(TEST_CONFIG, undefined), false);
  assert.equal(isAllowedForm(TEST_CONFIG, null), false);
});

test("kedjan avvisar en webhook från ett ej godkänt (t.ex. skarpt) formulär", () => {
  const payload = loadFixture("tally-webhook-wrong-form.json");
  assert.equal(isAllowedForm(TEST_CONFIG, payload.data.formId), false);
});

test("buildPersonalDulLink bygger en Coach_ID-länk mot testenkäten, aldrig 68ED6O", () => {
  const link = buildPersonalDulLink(TEST_CONFIG, "TEST-COACH-001");
  assert.equal(link, "https://tally.so/r/TEST_ENKAT_ID?Coach_ID=TEST-COACH-001");
  assert.doesNotMatch(link, /68ED6O/);
});

test("buildPersonalDulLink URL-kodar coachId", () => {
  const link = buildPersonalDulLink(TEST_CONFIG, "id med mellanslag/#");
  assert.equal(
    link,
    "https://tally.so/r/TEST_ENKAT_ID?Coach_ID=id%20med%20mellanslag%2F%23"
  );
});

test("resolveRecipient tvingar mejlet till testadressen i testMode, oavsett inskickad e-post", () => {
  const recipient = resolveRecipient(TEST_CONFIG, "en.riktig.tranare@example.com");
  assert.equal(recipient, TEST_CONFIG.testRecipientEmail);
});

test("resolveRecipient kastar fel om testMode=true men ingen testadress är satt", () => {
  const badConfig = { testMode: true, testRecipientEmail: "" };
  assert.throws(() => resolveRecipient(badConfig, "nagon@example.com"));
});

test("resolveRecipient använder den riktiga adressen ENDAST när testMode=false", () => {
  const liveConfig = { testMode: false };
  const recipient = resolveRecipient(liveConfig, "en.riktig.tranare@example.com");
  assert.equal(recipient, "en.riktig.tranare@example.com");
});

test("renderTemplate ersätter {{namn}} och {{lank}} men lämnar okända platshållare orörda", () => {
  const result = renderTemplate("Hej {{namn}}, se {{lank}} och {{okand}}.", {
    namn: "Anna",
    lank: "https://example.com",
  });
  assert.equal(result, "Hej Anna, se https://example.com och {{okand}}.");
});

test("formatWelcomeEmail märker ämnesraden [TEST] i testläge och visar ursprunglig adress i brödtexten", () => {
  const email = formatWelcomeEmail({
    name: "Anna",
    personalLink: "https://tally.so/r/TEST_ENKAT_ID?Coach_ID=TEST-COACH-001",
    testMode: true,
    originalEmail: "anna.andersson@example.com",
    template: DEFAULT_TEMPLATE,
  });

  assert.match(email.subject, /^\[TEST\]/);
  assert.match(email.body, /anna\.andersson@example\.com/);
  assert.match(email.body, /Hej Anna!/);
  assert.match(email.body, /Coach_ID=TEST-COACH-001/);
});

test("formatWelcomeEmail har inget [TEST]-prefix eller varningstext i skarpt läge", () => {
  const email = formatWelcomeEmail({
    name: "Anna",
    personalLink: "https://tally.so/r/68ED6O?Coach_ID=LIVE-COACH-001",
    testMode: false,
    template: DEFAULT_TEMPLATE,
  });

  assert.doesNotMatch(email.subject, /\[TEST\]/);
  assert.doesNotMatch(email.body, /TESTMEJL/);
});

test("formatWelcomeEmail använder en helt egen, fritt skriven mall korrekt", () => {
  const customTemplate = {
    subject: "Kul att du är med, {{namn}}!",
    body: [
      "Hej {{namn}},",
      "",
      "Innan kursen vill vi att du:",
      "1. Läser igenom materialet på vår hemsida.",
      "2. Svarar på din personliga DUL-enkät här: {{lank}}",
      "3. Hör av dig om du har frågor.",
      "",
      "Vi ses snart!",
    ].join("\n"),
  };

  const email = formatWelcomeEmail({
    name: "Björn",
    personalLink: "https://tally.so/r/TEST_ENKAT_ID?Coach_ID=TEST-COACH-003",
    testMode: false,
    template: customTemplate,
  });

  assert.equal(email.subject, "Kul att du är med, Björn!");
  assert.match(email.body, /Hej Björn,/);
  assert.match(
    email.body,
    /Svarar på din personliga DUL-enkät här: https:\/\/tally\.so\/r\/TEST_ENKAT_ID\?Coach_ID=TEST-COACH-003/
  );
});

test("formatWelcomeEmail lägger till testbanderoll och [TEST] även med en egen mall - går inte att skriva bort", () => {
  const customTemplate = {
    subject: "Mitt eget ämne utan test-ord",
    body: "Min egen text utan omnämnande av test.",
  };

  const email = formatWelcomeEmail({
    name: "Björn",
    personalLink: "https://tally.so/r/TEST_ENKAT_ID?Coach_ID=TEST-COACH-003",
    testMode: true,
    originalEmail: "bjorn@example.com",
    template: customTemplate,
  });

  assert.match(email.subject, /^\[TEST\] Mitt eget ämne/);
  assert.match(email.body, /TESTMEJL/);
  assert.match(email.body, /bjorn@example\.com/);
});

test("end-to-end (i minnet): testformulärets payload -> mejl går bara till testadressen", () => {
  const payload = loadFixture("tally-webhook-sample.json");
  const parsed = parseTallyPayload(payload, FIELD_LABELS);
  assert.equal(isAllowedForm(TEST_CONFIG, parsed.formId), true);

  const link = buildPersonalDulLink(TEST_CONFIG, parsed.coachId);
  const recipient = resolveRecipient(TEST_CONFIG, parsed.email);
  const email = formatWelcomeEmail({
    name: parsed.name,
    personalLink: link,
    testMode: TEST_CONFIG.testMode,
    originalEmail: parsed.email,
    template: DEFAULT_TEMPLATE,
  });

  assert.equal(recipient, "mig@example.com");
  assert.notEqual(recipient, parsed.email);
  assert.ok(email.body.includes(link), "brödtexten ska innehålla den personliga länken");
});

test("end-to-end (i minnet): en webhook från live-formuläret skulle avvisas innan något mejl formateras", () => {
  const payload = loadFixture("tally-webhook-wrong-form.json");
  const parsed = parseTallyPayload(payload, FIELD_LABELS);
  const allowed = isAllowedForm(TEST_CONFIG, parsed.formId);

  assert.equal(allowed, false, "live-formulärets ID får ALDRIG finnas i testkonfigens allowlist");
});
