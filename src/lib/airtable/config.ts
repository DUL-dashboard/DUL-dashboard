export const airtableConfig = {
  apiKey: process.env.AIRTABLE_PAT ?? "",
  baseId: process.env.AIRTABLE_BASE_ID ?? "",
  defaultTable: process.env.AIRTABLE_TABLE_NAME ?? "",
};

export function getAirtableConfigStatus() {
  const missing: string[] = [];
  if (!airtableConfig.apiKey) missing.push("AIRTABLE_PAT");
  if (!airtableConfig.baseId) missing.push("AIRTABLE_BASE_ID");
  if (!airtableConfig.defaultTable) missing.push("AIRTABLE_TABLE_NAME");

  return {
    isConfigured: missing.length === 0,
    missing,
  };
}
