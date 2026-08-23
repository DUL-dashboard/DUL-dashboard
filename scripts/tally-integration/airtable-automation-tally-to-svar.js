/**
 * Airtable Automation-script: packar upp en rad i "Tally-inskickningar"
 * till en rad per besvarad fråga i "Svar".
 *
 * DETTA FILINNEHÅLL KLISTRAS IN I AIRTABLE, INTE KÖRS MED NODE.
 * Sätt upp så här i Airtable:
 *   1. Automations → skapa ny automation.
 *   2. Trigger: "When record created" (eller "When record matches
 *      conditions") på tabellen Tally-inskickningar.
 *   3. Action: "Run a script".
 *   4. Lägg till en input variable med namnet `recordId`, värde =
 *      Trigger record → Record ID (den symbolen från triggersteget ovan).
 *   5. Klistra in hela innehållet i denna fil i scriptrutan.
 *
 * OBS: QUESTION_IDS nedan måste hållas i synk manuellt med
 * scripts/tally-integration/question-ids.mjs, eftersom Airtables
 * scriptsandlåda inte kan importera filer från detta repo.
 */

const TALLY_TABLE_NAME = "Tally-inskickningar";
const SVAR_TABLE_NAME = "Svar";

// Håll i synk med scripts/tally-integration/question-ids.mjs.
const QUESTION_IDS = [
  "A1_1", "A1_2", "A1_3", "A1_4",
  "A2_1", "A2_2", "A2_3", "A2_4",
  "A3_1", "A3_2", "A3_3", "A3_4",
  "A4_1", "A4_2", "A4_3", "A4_4",
  "B1_1", "B1_2", "B1_3", "B1_4",
  "B2_1", "B2_2", "B2_3", "B2_4",
  "B3_1", "B3_2", "B3_3", "B3_4",
  "C1_1", "C1_2", "C1_3", "C1_4",
  "C2_1", "C2_2", "C2_3", "C2_4",
  "C3_1", "C3_2", "C3_3", "C3_4",
  "D1_1", "D1_2", "D1_3", "D1_4",
  "D2_1", "D2_2", "D2_3", "D2_4",
  "D3_1", "D3_2", "D3_3", "D3_4",
];

const tallyTable = base.getTable(TALLY_TABLE_NAME);
const svarTable = base.getTable(SVAR_TABLE_NAME);

const config = input.config();
const recordId = config.recordId;

const record = await tallyTable.selectRecordAsync(recordId);
if (!record) {
  throw new Error(`Hittade ingen post med id ${recordId} i ${TALLY_TABLE_NAME}`);
}

if (record.getCellValue("Bearbetad")) {
  console.log(`Post ${recordId} är redan bearbetad – gör inget.`);
} else {
  const coachId = record.getCellValue("Coach_ID");
  const tidsstampel = record.getCellValue("Tidsstämpel");

  const svarRecordsToCreate = QUESTION_IDS.map((fragaId) => {
    const svar = record.getCellValueAsString(fragaId).trim();
    if (!svar) return null;

    return {
      fields: {
        Fråga_ID: fragaId,
        Svar: svar,
        Coach_ID: coachId,
        Tidsstämpel: tidsstampel,
      },
    };
  }).filter((row) => row !== null);

  // createRecordsAsync tillåter max 50 poster per anrop.
  for (let i = 0; i < svarRecordsToCreate.length; i += 50) {
    await svarTable.createRecordsAsync(svarRecordsToCreate.slice(i, i + 50));
  }

  await tallyTable.updateRecordAsync(recordId, { Bearbetad: true });

  console.log(
    `Skapade ${svarRecordsToCreate.length} Svar-rader för inskickning ${recordId}.`
  );
}
