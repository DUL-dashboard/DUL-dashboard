import Link from "next/link";
import { getAirtableConfigStatus } from "@/lib/airtable/config";
import { fetchCoaches, type Coach } from "@/lib/airtable/coaching";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const configStatus = getAirtableConfigStatus();

  let coaches: Coach[] = [];
  let error: string | null = null;

  if (configStatus.isConfigured) {
    try {
      coaches = await fetchCoaches();
    } catch (err) {
      error = err instanceof Error ? err.message : "Okänt fel";
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-8">
      <header>
        <h1 className="text-2xl font-semibold">DUL Dashboard</h1>
        <p className="text-sm text-neutral-500">Tränare</p>
      </header>

      {!configStatus.isConfigured && (
        <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-medium">Inte konfigurerat än</p>
          <p className="mt-1">
            Saknar miljövariabler: {configStatus.missing.join(", ")}. Se{" "}
            <code>.env.example</code> för hur du kopplar in din Airtable-bas.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950 dark:text-red-200">
          <p className="font-medium">Kunde inte hämta tränare</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {configStatus.isConfigured && !error && (
        <section className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          {coaches.length === 0 ? (
            <p className="p-6 text-sm text-neutral-500">
              Inga tränare registrerade ännu.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
                  <th className="px-4 py-3 font-medium">Namn</th>
                  <th className="px-4 py-3 font-medium">Idrott</th>
                  <th className="px-4 py-3 font-medium">Antal idrottare</th>
                  <th className="px-4 py-3 font-medium">Kursomgång</th>
                </tr>
              </thead>
              <tbody>
                {coaches.map((coach) => (
                  <tr
                    key={coach.id}
                    className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/${coach.id}`}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {coach.name || "(Namn saknas)"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{coach.sport || "–"}</td>
                    <td className="px-4 py-3">{coach.athleteCount || "–"}</td>
                    <td className="px-4 py-3">{coach.courseGroup || "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </main>
  );
}
