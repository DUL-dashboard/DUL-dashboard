/**
 * Källa till sanning för vilka 52 frågekolumner som ska finnas i
 * "Tally-inskickningar" (och vilket Fråga_ID varje kolumn motsvarar i
 * Frågor-tabellen).
 *
 * VIKTIGT: Just nu är detta en platshållarlista (F1..F52). Byt ut värdena
 * mot de faktiska FrågeID-värdena från er Frågor-tabell innan ni kör
 * create-tally-inskickningar-table.mjs, och håll listan i
 * airtable-automation-tally-to-svar.js i synk manuellt (Airtable
 * Automation-scriptet kan inte importera denna fil).
 */
export const QUESTION_IDS = Array.from(
  { length: 52 },
  (_, i) => `F${i + 1}`
);
