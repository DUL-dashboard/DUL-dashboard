import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchCoachAnswerSummary, fetchCoachById } from "@/lib/airtable/coaching";

export const dynamic = "force-dynamic";

export default async function CoachPage({
  params,
}: {
  params: Promise<{ coachId: string }>;
}) {
  const { coachId } = await params;

  let coach;
  try {
    coach = await fetchCoachById(coachId);
  } catch {
    notFound();
  }

  const dimensions = await fetchCoachAnswerSummary(coachId);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-8">
      <Link
        href="/dashboard"
        className="text-sm text-neutral-500 hover:underline"
      >
        ← Alla tränare
      </Link>

      <header>
        <h1 className="text-2xl font-semibold">
          {coach.name || "(Namn saknas)"}
        </h1>
        <p className="text-sm text-neutral-500">
          {[coach.sport, coach.courseGroup].filter(Boolean).join(" · ") || "–"}
        </p>
        {coach.athleteCount && (
          <p className="mt-1 text-sm text-neutral-500">
            Antal idrottare: {coach.athleteCount}
          </p>
        )}
      </header>

      {dimensions.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 p-6 text-sm text-neutral-500 dark:border-neutral-800">
          Inga svar registrerade ännu
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {dimensions.map((dimension) => (
            <section
              key={dimension.dimension}
              className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800"
            >
              <h2 className="mb-4 text-lg font-medium">
                {dimension.dimension}
              </h2>
              <div className="flex flex-col gap-4">
                {dimension.questions.map((question) => (
                  <div key={question.question}>
                    <p className="text-sm font-medium">{question.question}</p>
                    <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500">
                      {Object.entries(question.counts)
                        .filter(([, count]) => count > 0)
                        .map(([label, count]) => (
                          <li key={label}>
                            {label}: {count}
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
