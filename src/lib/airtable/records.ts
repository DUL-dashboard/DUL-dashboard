import { getAirtableBase } from "./client";
import { airtableConfig } from "./config";

export type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
};

/**
 * Hämtar poster från en Airtable-tabell. Fälten är dynamiska eftersom
 * DUL-basens tabellschema kan ändras utan att koden behöver uppdateras.
 */
export async function fetchRecords(
  tableName: string = airtableConfig.defaultTable,
  maxRecords = 25
): Promise<AirtableRecord[]> {
  const base = getAirtableBase();

  const rows = await base(tableName)
    .select({ maxRecords, pageSize: maxRecords })
    .firstPage();

  return rows.map((row) => ({
    id: row.id,
    fields: row.fields,
  }));
}

export async function fetchRecordById(
  tableName: string,
  recordId: string
): Promise<AirtableRecord> {
  const base = getAirtableBase();
  const row = await base(tableName).find(recordId);

  return { id: row.id, fields: row.fields };
}

export type ConnectionCheckResult =
  | { connected: true; table: string; recordCount: number; columns: string[] }
  | { connected: false; error: string };

/**
 * Airtables Node-SDK avvisar promises med vanliga objekt i formen
 * { error, message, statusCode } snarare än riktiga Error-instanser,
 * så vi måste läsa ut meddelandet manuellt för att kunna visa det.
 */
export function extractAirtableErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object") {
    const { error: code, message, statusCode } = error as {
      error?: string;
      message?: string;
      statusCode?: number;
    };

    if (message) {
      return statusCode ? `${message} (${code ?? statusCode})` : message;
    }
    if (code) return code;
  }

  return "Okänt fel";
}

/**
 * Enkel hälsokontroll: försöker hämta en post för att bevisa att
 * kopplingen mot Airtable (API-nyckel + bas-id + tabellnamn) fungerar.
 */
export async function checkAirtableConnection(
  tableName: string = airtableConfig.defaultTable
): Promise<ConnectionCheckResult> {
  try {
    const records = await fetchRecords(tableName, 5);
    const columns = Array.from(
      new Set(records.flatMap((record) => Object.keys(record.fields)))
    );

    return {
      connected: true,
      table: tableName,
      recordCount: records.length,
      columns,
    };
  } catch (error) {
    return {
      connected: false,
      error: extractAirtableErrorMessage(error),
    };
  }
}
