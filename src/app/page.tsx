import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-semibold">DUL Dashboard</h1>
      <p className="max-w-md text-neutral-500">
        Coachingverktyg med Airtable-koppling, dashboard och
        PDF-rapportgenerator.
      </p>
      <Link
        href="/dashboard"
        className="rounded-full bg-neutral-900 px-6 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
      >
        Gå till dashboard
      </Link>
    </main>
  );
}
