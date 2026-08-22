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

/**
 * Hämtar samtliga poster i en tabell (paginerar över hela tabellen),
 * till skillnad från fetchRecords som bara läser första sidan.
 */
export async function fetchAllRecords(
  tableName: string
): Promise<AirtableRecord[]> {
  const base = getAirtableBase();
  const records: AirtableRecord[] = [];

  await base(tableName)
    .select({ pageSize: 100 })
    .eachPage((rows, fetchNextPage) => {
      for (const row of rows) {
        records.push({ id: row.id, fields: row.fields });
      }
      fetchNextPage();
    });

  return records;
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
      error: error instanceof Error ? error.message : "Okänt fel",
    };
  }
}
