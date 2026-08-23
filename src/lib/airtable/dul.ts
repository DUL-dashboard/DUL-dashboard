import { getAirtableBase } from "./client";

export const SVAR_TABLE = "Svar";
export const FRAGOR_TABLE = "Frågor";
export const TRANARE_TABLE = "Tränare";

export const ANSWER_OPTIONS = [
  "Nästan alltid",
  "Då och då",
  "Nästan aldrig",
  "Vill eller kan ej bedöma",
] as const;

export type AnswerOption = (typeof ANSWER_OPTIONS)[number];

export type QuestionInfo = {
  fragaId: string;
  dimension: string;
  fragetext: string;
};

export type SvarRow = {
  id: string;
  fragaId: string;
  svar: string;
  tidsstampel: string | null;
};

export type DimensionSummary = {
  dimension: string;
  total: number;
  counts: Record<AnswerOption, number>;
};

function emptyCounts(): Record<AnswerOption, number> {
  return {
    "Nästan alltid": 0,
    "Då och då": 0,
    "Nästan aldrig": 0,
    "Vill eller kan ej bedöma": 0,
  };
}

function escapeFormulaValue(value: string): string {
  return value.replace(/"/g, '\\"');
}

/**
 * Hämtar alla frågor och indexerar dem på FrågeID, eftersom Svar-tabellens
 * Fråga_ID är ett textfält (inte en länkad post) som matchas mot detta.
 */
export async function fetchFragorById(): Promise<Map<string, QuestionInfo>> {
  const base = getAirtableBase();
  const rows = await base(FRAGOR_TABLE).select({ pageSize: 100 }).all();

  const map = new Map<string, QuestionInfo>();
  for (const row of rows) {
    const fragaId = String(row.fields["FrågeID"] ?? "").trim();
    if (!fragaId) continue;

    map.set(fragaId, {
      fragaId,
      dimension: String(row.fields["Dimension"] ?? "Okänd dimension"),
      fragetext: String(row.fields["Frågetext"] ?? ""),
    });
  }

  return map;
}

export async function fetchSvarForCoach(coachId: string): Promise<SvarRow[]> {
  const base = getAirtableBase();
  const formula = `{Coach_ID} = "${escapeFormulaValue(coachId)}"`;
  const rows = await base(SVAR_TABLE)
    .select({ filterByFormula: formula, pageSize: 100 })
    .all();

  return rows.map((row) => ({
    id: row.id,
    fragaId: String(row.fields["Fråga_ID"] ?? "").trim(),
    svar: String(row.fields["Svar"] ?? ""),
    tidsstampel: row.fields["Tidsstämpel"]
      ? String(row.fields["Tidsstämpel"])
      : null,
  }));
}

/**
 * Grupperar svar per dimension (hämtad via Fråga_ID -> Frågor) och räknar
 * antal per svarsalternativ inom varje dimension.
 */
export function summarizeByDimension(
  svarRows: SvarRow[],
  fragorById: Map<string, QuestionInfo>
): DimensionSummary[] {
  const byDimension = new Map<string, DimensionSummary>();
  const knownOptions: readonly string[] = ANSWER_OPTIONS;

  for (const row of svarRows) {
    const question = fragorById.get(row.fragaId);
    const dimension = question?.dimension ?? "Okänd fråga";

    if (!byDimension.has(dimension)) {
      byDimension.set(dimension, {
        dimension,
        total: 0,
        counts: emptyCounts(),
      });
    }

    const summary = byDimension.get(dimension)!;
    summary.total += 1;
    if (knownOptions.includes(row.svar)) {
      summary.counts[row.svar as AnswerOption] += 1;
    }
  }

  return Array.from(byDimension.values()).sort((a, b) =>
    a.dimension.localeCompare(b.dimension, "sv")
  );
}
