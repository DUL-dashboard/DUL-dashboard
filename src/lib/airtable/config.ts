export const airtableConfig = {
  apiKey: process.env.AIRTABLE_PAT ?? "",
  baseId: process.env.AIRTABLE_BASE_ID ?? "",
  defaultTable: process.env.AIRTABLE_TABLE_NAME ?? "",
  coachesTable: process.env.AIRTABLE_COACHES_TABLE ?? "Tränare",
  questionsTable: process.env.AIRTABLE_QUESTIONS_TABLE ?? "Frågor",
  answersTable: process.env.AIRTABLE_ANSWERS_TABLE ?? "Svar",
};

export function getAirtableConfigStatus() {
  const missing: string[] = [];
  if (!airtableConfig.apiKey) missing.push("AIRTABLE_PAT");
  if (!airtableConfig.baseId) missing.push("AIRTABLE_BASE_ID");

  return {
    isConfigured: missing.length === 0,
    missing,
  };
}
