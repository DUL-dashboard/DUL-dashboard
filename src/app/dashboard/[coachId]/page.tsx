import Link from "next/link";
import { notFound } from "next/navigation";
import { getAirtableConfigStatus } from "@/lib/airtable/config";
import { fetchCoachByCoachId, fetchCoachAnswerSummary } from "@/lib/airtable/coaches";

export const dynamic = "force-dynamic";

const ANSWER_STYLES: Record<string, string> = {
  "Nästan alltid":
    "bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200",
  "Då och då":
    "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  "Nästan aldrig": "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200",
  "Vill eller kan ej bedöma":
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
};

function answerBadgeClass(answer: string): string {
  return (
    ANSWER_STYLES[answer] ??
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
  );
}

export default async function CoachPage({
  params,
}: {
  params: Promise<{ coachId: string }>;
}) {
  const { coachId: rawCoachId } = await params;
  const coachId = decodeURIComponent(rawCoachId);

  const configStatus = getAirtableConfigStatus();
  if (!configStatus.isConfigured) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-8">
        <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-medium">Inte konfigurerat än</p>
          <p className="mt-1">
            Saknar miljövariabler: {configStatus.missing.join(", ")}.
          </p>
        </div>
      </main>
    );
  }

  const coach = await fetchCoachByCoachId(coachId);
  if (!coach) {
    notFound();
  }

  let dimensions: Awaited<ReturnType<typeof fetchCoachAnswerSummary>> = [];
  let error: string | null = null;

  try {
    dimensions = await fetchCoachAnswerSummary(coach.coachId);
  } catch (e) {
    error = e instanceof Error ? e.message : "Okänt fel";
  }

  const hasAnswers = dimensions.some((d) => d.questions.length > 0);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-8">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-neutral-500 hover:underline"
        >
          ← Tillbaka till tränarlistan
        </Link>
      </div>

      <header>
        <h1 className="text-2xl font-semibold">{coach.namn}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {[coach.idrott, coach.kursomgang].filter(Boolean).join(" · ") ||
            "–"}
          {coach.antalIdrottare !== null && (
            <> · {coach.antalIdrottare} idrottare</>
          )}
        </p>
      </header>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950 dark:text-red-200">
          <p className="font-medium">❌ Kunde inte hämta svar</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {!error && !hasAnswers && (
        <p className="text-sm text-neutral-500">
          Inga svar registrerade ännu
        </p>
      )}

      {!error &&
        hasAnswers &&
        dimensions
          .filter((d) => d.questions.length > 0)
          .map((d) => (
            <section
              key={d.dimension}
              className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800"
            >
              <h2 className="mb-4 text-lg font-medium">{d.dimension}</h2>
              <ul className="flex flex-col gap-4">
                {d.questions.map((q) => (
                  <li key={q.frageId}>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                      {q.frageText}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {q.answers.map((answer, i) => (
                        <span
                          key={`${q.frageId}-${i}`}
                          className={`rounded-full px-3 py-1 text-xs ${answerBadgeClass(
                            answer
                          )}`}
                        >
                          {answer}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
    </main>
  );
}
