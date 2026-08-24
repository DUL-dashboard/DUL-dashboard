/**
 * Källa till sanning för vilka 52 frågekolumner som ska finnas i
 * "Tally-inskickningar" (och vilket Fråga_ID varje kolumn motsvarar i
 * Frågor-tabellen).
 *
 * Detta är de 52 FrågeID (dimension A–D) i Frågor-tabellen där
 * "Endast för åldersgrupp" = "Alla". De återstående 12 frågorna
 * (E1_1..E3_4, dimensionen "Synligt samarbete"/triaden) gäller bara vissa
 * åldersgrupper och ingår inte i detta formulär/denna tabell.
 *
 * Håll listan i airtable-automation-tally-to-svar.js i synk manuellt om
 * den ändras här (Airtable Automation-scriptet kan inte importera denna
 * fil).
 */
export const QUESTION_IDS = [
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
