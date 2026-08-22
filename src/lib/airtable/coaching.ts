import { airtableConfig } from "./config";
import { fetchAllRecords, fetchRecordById, type AirtableRecord } from "./records";

export type Coach = {
  id: string;
  name: string;
  sport: string;
  athleteCount: string;
  courseGroup: string;
};

const ANSWER_SCALE = [
  "Nästan alltid",
  "Då och då",
  "Nästan aldrig",
  "Vill eller kan ej bedöma",
] as const;

export type AnswerValue = (typeof ANSWER_SCALE)[number];

export type QuestionSummary = {
  question: string;
  counts: Record<AnswerValue, number>;
  total: number;
};

export type DimensionSummary = {
  dimension: string;
  questions: QuestionSummary[];
};

// Fältnamnen i Airtable-basen är inte formellt låsta ännu, så vi provar
// ett par rimliga varianter per fält istället för att anta exakt namn.
function pickText(fields: Record<string, unknown>, candidates: string[]): string {
  for (const key of candidates) {
    const value = fields[key];
    if (typeof value === "string" && value.trim() !== "") return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

function pickLinkedIds(fields: Record<string, unknown>, candidates: string[]): string[] {
  for (const key of candidates) {
    const value = fields[key];
    if (Array.isArray(value) && value.every((entry) => typeof entry === "string")) {
      return value as string[];
    }
  }
  return [];
}

function pickAnswerValue(fields: Record<string, unknown>): AnswerValue | null {
  const candidates = ["Svar", "Svarsalternativ", "Bedömning", "Answer"];
  for (const key of candidates) {
    const raw = fields[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (typeof value === "string" && (ANSWER_SCALE as readonly string[]).includes(value)) {
      return value as AnswerValue;
    }
  }
  return null;
}

function emptyCounts(): Record<AnswerValue, number> {
  return {
    "Nästan alltid": 0,
    "Då och då": 0,
    "Nästan aldrig": 0,
    "Vill eller kan ej bedöma": 0,
  };
}

function coachFromRecord(record: AirtableRecord): Coach {
  return {
    id: record.id,
    name: pickText(record.fields, ["Namn", "Name"]),
    sport: pickText(record.fields, ["Idrott", "Sport"]),
    athleteCount: pickText(record.fields, ["Antal idrottare", "Antal Idrottare"]),
    courseGroup: pickText(record.fields, ["Kursomgång", "Kursomgang"]),
  };
}

export async function fetchCoaches(): Promise<Coach[]> {
  const records = await fetchAllRecords(airtableConfig.coachesTable);
  return records.map(coachFromRecord);
}

export async function fetchCoachById(coachId: string): Promise<Coach> {
  const record = await fetchRecordById(airtableConfig.coachesTable, coachId);
  return coachFromRecord(record);
}

/**
 * Sammanställer alla registrerade svar för en tränare, grupperat per
 * dimension och fråga, med en räkning per svarsalternativ.
 */
export async function fetchCoachAnswerSummary(
  coachId: string
): Promise<DimensionSummary[]> {
  const [answers, questions] = await Promise.all([
    fetchAllRecords(airtableConfig.answersTable),
    fetchAllRecords(airtableConfig.questionsTable),
  ]);

  const questionById = new Map(
    questions.map((question) => [
      question.id,
      {
        text: pickText(question.fields, ["Fråga", "Namn", "Question", "Text"]),
        dimension: pickText(question.fields, ["Dimension", "Kategori"]) || "Övrigt",
      },
    ])
  );

  const dimensionOrder: string[] = [];
  const dimensions = new Map<string, Map<string, QuestionSummary>>();

  for (const answer of answers) {
    const coachIds = pickLinkedIds(answer.fields, ["Tränare", "Coach"]);
    if (!coachIds.includes(coachId)) continue;

    const answerValue = pickAnswerValue(answer.fields);
    if (!answerValue) continue;

    const questionIds = pickLinkedIds(answer.fields, ["Fråga", "Frågor", "Question"]);
    for (const questionId of questionIds) {
      const question = questionById.get(questionId);
      if (!question) continue;

      let questionMap = dimensions.get(question.dimension);
      if (!questionMap) {
        questionMap = new Map();
        dimensions.set(question.dimension, questionMap);
        dimensionOrder.push(question.dimension);
      }

      let summary = questionMap.get(question.text);
      if (!summary) {
        summary = { question: question.text, counts: emptyCounts(), total: 0 };
        questionMap.set(question.text, summary);
      }

      summary.counts[answerValue] += 1;
      summary.total += 1;
    }
  }

  return dimensionOrder.map((dimension) => ({
    dimension,
    questions: Array.from(dimensions.get(dimension)!.values()),
  }));
}
