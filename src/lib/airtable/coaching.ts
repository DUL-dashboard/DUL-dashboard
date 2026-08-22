import { airtableConfig } from "./config";
import { fetchAllRecords, fetchRecordById, type AirtableRecord } from "./records";

export type Coach = {
  id: string;
  coachCode: string;
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

function textField(fields: Record<string, unknown>, key: string): string {
  const value = fields[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
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
    coachCode: textField(record.fields, "Coach_ID"),
    name: textField(record.fields, "Namn"),
    sport: textField(record.fields, "Idrott"),
    athleteCount: textField(record.fields, "Antal idrottare"),
    courseGroup: textField(record.fields, "Kursomgång"),
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
 * Svar-tabellen länkar till Tränare och Frågor via textkoderna
 * Coach_ID och Fråga_ID (mot Frågor-tabellens FrågeID) — inte via
 * Airtables länkfält.
 */
export async function fetchCoachAnswerSummary(
  coach: Coach
): Promise<DimensionSummary[]> {
  if (!coach.coachCode) return [];

  const [answers, questions] = await Promise.all([
    fetchAllRecords(airtableConfig.answersTable),
    fetchAllRecords(airtableConfig.questionsTable),
  ]);

  const questionByCode = new Map(
    questions.map((question) => [
      textField(question.fields, "FrågeID"),
      {
        text: textField(question.fields, "Frågetext"),
        dimension: textField(question.fields, "Dimension") || "Övrigt",
      },
    ])
  );

  const dimensionOrder: string[] = [];
  const dimensions = new Map<string, Map<string, QuestionSummary>>();

  for (const answer of answers) {
    if (textField(answer.fields, "Coach_ID") !== coach.coachCode) continue;

    const answerValue = textField(answer.fields, "Svar");
    if (!(ANSWER_SCALE as readonly string[]).includes(answerValue)) continue;

    const question = questionByCode.get(textField(answer.fields, "Fråga_ID"));
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

    summary.counts[answerValue as AnswerValue] += 1;
    summary.total += 1;
  }

  return dimensionOrder.map((dimension) => ({
    dimension,
    questions: Array.from(dimensions.get(dimension)!.values()),
  }));
}
