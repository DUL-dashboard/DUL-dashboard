import { getAirtableBase } from "./client";

const TRANARE_TABLE = "Tränare";
const FRAGOR_TABLE = "Frågor";
const SVAR_TABLE = "Svar";

export type Coach = {
  id: string;
  coachId: string;
  namn: string;
  idrott: string;
  antalIdrottare: number | null;
  kursomgang: string;
  epost: string;
};

function escapeFormulaValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function toCoach(id: string, fields: Record<string, unknown>): Coach {
  return {
    id,
    coachId: typeof fields["Coach_ID"] === "string" ? fields["Coach_ID"] : "",
    namn: typeof fields["Namn"] === "string" ? fields["Namn"] : "",
    idrott: typeof fields["Idrott"] === "string" ? fields["Idrott"] : "",
    antalIdrottare:
      typeof fields["Antal idrottare"] === "number"
        ? fields["Antal idrottare"]
        : null,
    kursomgang:
      typeof fields["Kursomgång"] === "string" ? fields["Kursomgång"] : "",
    epost: typeof fields["E-post"] === "string" ? fields["E-post"] : "",
  };
}

/**
 * Hämtar alla tränare. Rader utan namn (t.ex. tomma placeholder-rader
 * i Airtable) filtreras bort.
 */
export async function fetchCoaches(): Promise<Coach[]> {
  const base = getAirtableBase();
  const rows = await base(TRANARE_TABLE).select({ pageSize: 100 }).all();

  return rows
    .map((row) => toCoach(row.id, row.fields))
    .filter((coach) => coach.namn && coach.coachId);
}

export async function fetchCoachByCoachId(
  coachId: string
): Promise<Coach | null> {
  const base = getAirtableBase();
  const rows = await base(TRANARE_TABLE)
    .select({
      filterByFormula: `{Coach_ID} = "${escapeFormulaValue(coachId)}"`,
      maxRecords: 1,
    })
    .firstPage();

  const row = rows[0];
  return row ? toCoach(row.id, row.fields) : null;
}

export type QuestionAnswers = {
  frageId: string;
  frageText: string;
  answers: string[];
};

export type DimensionSummary = {
  dimension: string;
  questions: QuestionAnswers[];
};

/**
 * Slår ihop Frågor- och Svar-tabellerna för en given tränare, grupperat
 * per dimension. Svarsvärdena lämnas som text (Nästan alltid / Då och då /
 * Nästan aldrig / Vill eller kan ej bedöma) – ingen numerisk poängsättning.
 */
export async function fetchCoachAnswerSummary(
  coachId: string
): Promise<DimensionSummary[]> {
  const base = getAirtableBase();

  const [questionRows, answerRows] = await Promise.all([
    base(FRAGOR_TABLE).select({ pageSize: 100 }).all(),
    base(SVAR_TABLE)
      .select({
        filterByFormula: `{Coach_ID} = "${escapeFormulaValue(coachId)}"`,
        pageSize: 100,
      })
      .all(),
  ]);

  const questionsById = new Map<
    string,
    { frageText: string; dimension: string }
  >();
  const dimensionOrder: string[] = [];

  for (const row of questionRows) {
    const frageId = row.fields["FrågeID"];
    if (typeof frageId !== "string" || !frageId) continue;

    const dimension =
      typeof row.fields["Dimension"] === "string"
        ? row.fields["Dimension"]
        : "Övrigt";
    const frageText =
      typeof row.fields["Frågetext"] === "string"
        ? row.fields["Frågetext"]
        : frageId;

    questionsById.set(frageId, { frageText, dimension });
    if (!dimensionOrder.includes(dimension)) {
      dimensionOrder.push(dimension);
    }
  }

  const dimensionMap = new Map<string, Map<string, QuestionAnswers>>();

  for (const row of answerRows) {
    const frageId = row.fields["Fråga_ID"];
    const svar = row.fields["Svar"];
    if (
      typeof frageId !== "string" ||
      !frageId ||
      typeof svar !== "string" ||
      !svar
    ) {
      continue;
    }

    const question = questionsById.get(frageId);
    const dimension = question?.dimension ?? "Övrigt";
    const frageText = question?.frageText ?? frageId;

    if (!dimensionMap.has(dimension)) {
      dimensionMap.set(dimension, new Map());
    }
    const questionMap = dimensionMap.get(dimension)!;

    if (!questionMap.has(frageId)) {
      questionMap.set(frageId, { frageId, frageText, answers: [] });
    }
    questionMap.get(frageId)!.answers.push(svar);
  }

  const orderedDimensions = [
    ...dimensionOrder.filter((dimension) => dimensionMap.has(dimension)),
    ...[...dimensionMap.keys()].filter((d) => !dimensionOrder.includes(d)),
  ];

  return orderedDimensions.map((dimension) => ({
    dimension,
    questions: [...dimensionMap.get(dimension)!.values()],
  }));
}
