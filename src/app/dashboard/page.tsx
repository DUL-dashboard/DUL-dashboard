import { getAirtableConfigStatus } from "@/lib/airtable/config";
import { checkAirtableConnection } from "@/lib/airtable/records";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const configStatus = getAirtableConfigStatus();
  const result = configStatus.isConfigured
    ? await checkAirtableConnection()
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-8">
      <header>
        <h1 className="text-2xl font-semibold">DUL Dashboard</h1>
        <p className="text-sm text-neutral-500">
          Coachingverktygets dashboard – Airtable-koppling
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
        <h2 className="mb-4 text-lg font-medium">Airtable-anslutning</h2>

        {!configStatus.isConfigured && (
          <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <p className="font-medium">Inte konfigurerat än</p>
            <p className="mt-1">
              Saknar miljövariabler: {configStatus.missing.join(", ")}. Se{" "}
              <code>.env.example</code> för hur du kopplar in din Airtable-bas.
            </p>
          </div>
        )}

        {result?.connected && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-900 dark:bg-green-950 dark:text-green-200">
            <p className="font-medium">✅ Ansluten till Airtable</p>
            <p className="mt-1">
              Tabell &quot;{result.table}&quot; – {result.recordCount} poster
              hämtade.
            </p>
          </div>
        )}

        {result && !result.connected && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950 dark:text-red-200">
            <p className="font-medium">❌ Kunde inte ansluta</p>
            <p className="mt-1">{result.error}</p>
          </div>
        )}
      </section>

      {result?.connected && (
        <section className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
          <h2 className="mb-4 text-lg font-medium">
            Kolumner i tabellen
          </h2>
          {result.columns.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Tabellen svarade men innehåller inga poster ännu.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {result.columns.map((column) => (
                <li
                  key={column}
                  className="rounded-full bg-neutral-100 px-3 py-1 text-xs dark:bg-neutral-800"
                >
                  {column}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
