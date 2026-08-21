import Link from "next/link";
import { getAirtableConfigStatus } from "@/lib/airtable/config";
import { fetchCoaches } from "@/lib/airtable/coaches";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const configStatus = getAirtableConfigStatus();

  if (!configStatus.isConfigured) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-8">
        <header>
          <h1 className="text-2xl font-semibold">DUL Dashboard</h1>
          <p className="text-sm text-neutral-500">Tränarlista</p>
        </header>
        <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-medium">Inte konfigurerat än</p>
          <p className="mt-1">
            Saknar miljövariabler: {configStatus.missing.join(", ")}. Se{" "}
            <code>.env.example</code> för hur du kopplar in din Airtable-bas.
          </p>
        </div>
      </main>
    );
  }

  let coaches: Awaited<ReturnType<typeof fetchCoaches>> = [];
  let error: string | null = null;

  try {
    coaches = await fetchCoaches();
  } catch (e) {
    error = e instanceof Error ? e.message : "Okänt fel";
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-8">
      <header>
        <h1 className="text-2xl font-semibold">DUL Dashboard</h1>
        <p className="text-sm text-neutral-500">
          Tränare – klicka på en rad för att se sammanställningen av svar.
        </p>
      </header>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950 dark:text-red-200">
          <p className="font-medium">❌ Kunde inte hämta tränare</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {!error && coaches.length === 0 && (
        <p className="text-sm text-neutral-500">
          Inga tränare registrerade ännu.
        </p>
      )}

      {!error && coaches.length > 0 && (
        <section className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
              <tr>
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
                      href={`/dashboard/${encodeURIComponent(coach.coachId)}`}
                      className="font-medium text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-100"
                    >
                      {coach.namn}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {coach.idrott || "–"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {coach.antalIdrottare ?? "–"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {coach.kursomgang || "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
