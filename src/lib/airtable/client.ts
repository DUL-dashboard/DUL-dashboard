import Airtable from "airtable";
import { airtableConfig } from "./config";

let base: Airtable.Base | null = null;

export function getAirtableBase(): Airtable.Base {
  if (!airtableConfig.apiKey || !airtableConfig.baseId) {
    throw new Error(
      "Airtable är inte konfigurerat. Sätt AIRTABLE_PAT och AIRTABLE_BASE_ID i .env.local."
    );
  }

  if (!base) {
    Airtable.configure({ apiKey: airtableConfig.apiKey });
    base = Airtable.base(airtableConfig.baseId);
  }

  return base;
}
