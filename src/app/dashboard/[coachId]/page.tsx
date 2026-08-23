import {
  ANSWER_OPTIONS,
  TRANARE_TABLE,
  fetchFragorById,
  fetchSvarForCoach,
  summarizeByDimension,
  type DimensionSummary,
} from "@/lib/airtable/dul";
import { fetchRecords } from "@/lib/airtable/records";

export const dynamic = "force-dynamic";

type PageData = {
  coachName: string | null;
  summaries: DimensionSummary[];
  totalAnswers: number;
};

async function loadPageData(coachId: string): Promise<PageData> {
  const [fragorById, svarRows, tranareRows] = await Promise.all([
    fetchFragorById(),
    fetchSvarForCoach(coachId),
    fetchRecords(TRANARE_TABLE, 100),
  ]);

  const coach = tranareRows.find(
    (row) => String(row.fields["Coach_ID"] ?? "") === coachId
  );

  return {
    coachName: coach ? String(coach.fields["Namn"]) : null,
    summaries: summarizeByDimension(svarRows, fragorById),
    totalAnswers: svarRows.length,
  };
}

export default async function CoachDashboardPage({
  params,
}: {
  params: Promise<{ coachId: string }>;
}) {
  const { coachId } = await params;

  let data: PageData | null = null;
  let error: string | null = null;

  try {
    data = await loadPageData(coachId);
  } catch (err) {
    error = err instanceof Error ? err.message : "Okänt fel";
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-8">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950 dark:text-red-200">
          <p className="font-medium">❌ Kunde inte hämta data</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {data && <CoachSummary coachId={coachId} data={data} />}
    </main>
  );
}

function CoachSummary({
  coachId,
  data,
}: {
  coachId: string;
  data: PageData;
}) {
  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold">
          {data.coachName ?? `Tränare ${coachId}`}
        </h1>
        <p className="text-sm text-neutral-500">
          Coach_ID: {coachId} · {data.totalAnswers} svar registrerade
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
        <h2 className="mb-4 text-lg font-medium">
          Sammanställning per dimension
        </h2>

        {data.totalAnswers === 0 ? (
          <p className="text-sm text-neutral-500">
            Inga svar registrerade för denna tränare ännu.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="py-2 pr-4">Dimension</th>
                  {ANSWER_OPTIONS.map((option) => (
                    <th key={option} className="py-2 pr-4">
                      {option}
                    </th>
                  ))}
                  <th className="py-2">Totalt</th>
                </tr>
              </thead>
              <tbody>
                {data.summaries.map((summary) => (
                  <tr
                    key={summary.dimension}
                    className="border-b border-neutral-100 dark:border-neutral-900"
                  >
                    <td className="py-2 pr-4 font-medium">
                      {summary.dimension}
                    </td>
                    {ANSWER_OPTIONS.map((option) => (
                      <td key={option} className="py-2 pr-4">
                        {summary.counts[option]}
                      </td>
                    ))}
                    <td className="py-2">{summary.total}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-neutral-300 font-semibold dark:border-neutral-700">
                  <td className="py-2 pr-4">Totalt</td>
                  {ANSWER_OPTIONS.map((option) => (
                    <td key={option} className="py-2 pr-4">
                      {data.summaries.reduce(
                        (sum, s) => sum + s.counts[option],
                        0
                      )}
                    </td>
                  ))}
                  <td className="py-2">{data.totalAnswers}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
