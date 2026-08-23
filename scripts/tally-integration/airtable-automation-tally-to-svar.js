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
const QUESTION_IDS = Array.from({ length: 52 }, (_, i) => `F${i + 1}`);

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
