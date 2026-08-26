import { getAirtableBase } from "./client";

export const SVAR_TABLE = "Svar";
export const FRAGOR_TABLE = "Frågor";
export const TRANARE_TABLE = "Tränare";
export const TALLY_TABLE = "Tally-inskickningar";

/**
 * Under detta antal svarande idrottare finns risk att enskilda svar går
 * att härleda till en person - PDF-rapporten och rapport-API:et varnar
 * (utan att blockera) när en tränares antal svarande understiger detta.
 */
export const LOW_RESPONSE_THRESHOLD = 5;

export const ANSWER_OPTIONS = [
  "Nästan alltid",
  "Då och då",
  "Nästan aldrig",
  "Vill eller kan ej bedöma",
] as const;

export type AnswerOption = (typeof ANSWER_OPTIONS)[number];

export type QuestionInfo = {
  fragaId: string;
  omrade: string;
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
      omrade: String(row.fields["Område"] ?? "Okänt område"),
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
 * Räknar antal inskickade Tally-formulär (= antal idrottare som svarat)
 * för en coach, till skillnad från antal Svar-rader (en per fråga).
 */
export async function countTallySubmissionsForCoach(
  coachId: string
): Promise<number> {
  const base = getAirtableBase();
  const formula = `{Coach_ID} = "${escapeFormulaValue(coachId)}"`;
  const rows = await base(TALLY_TABLE)
    .select({ filterByFormula: formula, pageSize: 100, fields: ["Coach_ID"] })
    .all();

  return rows.length;
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

export type QuestionSummary = {
  fragaId: string;
  fragetext: string;
  total: number;
  counts: Record<AnswerOption, number>;
};

export type DimensionReport = {
  code: string;
  name: string;
  total: number;
  counts: Record<AnswerOption, number>;
  questions: QuestionSummary[];
};

export type AreaReport = {
  code: string;
  name: string;
  dimensions: DimensionReport[];
};

const FRAGA_ID_PATTERN = /^([A-Z])(\d+)_(\d+)$/;

export type InstrumentAreaStructure = {
  code: string;
  name: string;
  dimensionCount: number;
  questionCount: number;
};

/**
 * Sammanfattar hela frågeinstrumentet (alla områden/dimensioner/frågor i
 * Frågor-tabellen) oavsett insamlade svar - används för att beskriva
 * rapportens uppbyggnad, inte ett specifikt resultat.
 */
export function summarizeInstrumentStructure(
  fragorById: Map<string, QuestionInfo>
): InstrumentAreaStructure[] {
  const areas = new Map<
    string,
    { name: string; dimensions: Set<string>; questionCount: number }
  >();

  for (const [fragaId, question] of fragorById) {
    const match = FRAGA_ID_PATTERN.exec(fragaId);
    if (!match) continue;
    const [, areaCode, dimNum] = match;

    if (!areas.has(areaCode)) {
      areas.set(areaCode, {
        name: question.omrade,
        dimensions: new Set(),
        questionCount: 0,
      });
    }
    const area = areas.get(areaCode)!;
    area.dimensions.add(areaCode + dimNum);
    area.questionCount += 1;
  }

  return Array.from(areas.entries())
    .map(([code, area]) => ({
      code,
      name: area.name,
      dimensionCount: area.dimensions.size,
      questionCount: area.questionCount,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * Grupperar svar per fråga -> dimension -> område (utläst ur FrågeID:s
 * prefix, t.ex. "B2_3" -> område B, dimension B2, fråga 3), för
 * rapportvyer som behöver bryta ner ända ner på enskild fråga.
 */
export function buildAreaReport(
  svarRows: SvarRow[],
  fragorById: Map<string, QuestionInfo>
): AreaReport[] {
  const knownOptions: readonly string[] = ANSWER_OPTIONS;
  const questionSummaries = new Map<string, QuestionSummary>();

  for (const row of svarRows) {
    const question = fragorById.get(row.fragaId);
    if (!question || !FRAGA_ID_PATTERN.test(row.fragaId)) continue;

    if (!questionSummaries.has(row.fragaId)) {
      questionSummaries.set(row.fragaId, {
        fragaId: row.fragaId,
        fragetext: question.fragetext,
        total: 0,
        counts: emptyCounts(),
      });
    }

    const summary = questionSummaries.get(row.fragaId)!;
    summary.total += 1;
    if (knownOptions.includes(row.svar)) {
      summary.counts[row.svar as AnswerOption] += 1;
    }
  }

  const areasByCode = new Map<string, AreaReport>();
  const dimensionsByCode = new Map<string, DimensionReport>();

  for (const [fragaId, questionSummary] of questionSummaries) {
    const match = FRAGA_ID_PATTERN.exec(fragaId)!;
    const [, areaCode, dimNum] = match;
    const dimCode = areaCode + dimNum;
    const question = fragorById.get(fragaId)!;

    if (!areasByCode.has(areaCode)) {
      areasByCode.set(areaCode, {
        code: areaCode,
        name: question.omrade,
        dimensions: [],
      });
    }

    if (!dimensionsByCode.has(dimCode)) {
      const dimensionReport: DimensionReport = {
        code: dimCode,
        name: question.dimension,
        total: 0,
        counts: emptyCounts(),
        questions: [],
      };
      dimensionsByCode.set(dimCode, dimensionReport);
      areasByCode.get(areaCode)!.dimensions.push(dimensionReport);
    }

    const dimensionReport = dimensionsByCode.get(dimCode)!;
    dimensionReport.questions.push(questionSummary);
    dimensionReport.total += questionSummary.total;
    for (const option of ANSWER_OPTIONS) {
      dimensionReport.counts[option] += questionSummary.counts[option];
    }
  }

  const areas = Array.from(areasByCode.values());
  for (const area of areas) {
    area.dimensions.sort((a, b) => a.code.localeCompare(b.code));
    for (const dimension of area.dimensions) {
      dimension.questions.sort((a, b) => a.fragaId.localeCompare(b.fragaId));
    }
  }
  areas.sort((a, b) => a.code.localeCompare(b.code));

  return areas;
}
