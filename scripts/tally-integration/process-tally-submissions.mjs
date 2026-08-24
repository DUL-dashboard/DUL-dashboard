/**
 * Körs manuellt, på begäran (t.ex. efter att en kursomgång är klar).
 *
 * Läser alla obehandlade rader (Bearbetad ej ikryssad) i
 * Tally-inskickningar, packar upp varje inskickning till en rad per
 * besvarad fråga i Svar-tabellen (Fråga_ID, Svar, Coach_ID, Tidsstämpel),
 * och kryssar sedan i Bearbetad på ursprungsraden.
 *
 * Ersätter den tidigare planen med en Airtable Automation ("Run a
 * script"), som kräver Airtables betalda Team-plan – detta script
 * använder bara den vanliga REST-API:et och kräver ingen Automation alls.
 *
 * Användning:
 *   node --env-file=.env.local scripts/tally-integration/process-tally-submissions.mjs
 *
 * Krävda miljövariabler:
 *   AIRTABLE_PAT      – Personal Access Token med scope data.records:read
 *                        och data.records:write
 *   AIRTABLE_BASE_ID  – basens ID (börjar på "app...")
 */
import { QUESTION_IDS } from "./question-ids.mjs";

const TALLY_TABLE = "Tally-inskickningar";
const SVAR_TABLE = "Svar";
const CREATE_BATCH_SIZE = 10; // REST-API:ets max per anrop

const pat = process.env.AIRTABLE_PAT;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!pat || !baseId) {
  console.error(
    "Saknar AIRTABLE_PAT och/eller AIRTABLE_BASE_ID. Sätt dem i .env.local " +
      "och kör t.ex.:\n" +
      "  node --env-file=.env.local scripts/tally-integration/process-tally-submissions.mjs"
  );
  process.exit(1);
}

function airtableUrl(tableName, params = {}) {
  const url = new URL(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`
  );
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

async function airtableFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Airtable-anrop misslyckades (${response.status} ${url}): ${await response.text()}`
    );
  }

  return response.json();
}

async function fetchUnprocessedSubmissions() {
  const records = [];
  let offset;

  do {
    const url = airtableUrl(TALLY_TABLE, {
      filterByFormula: "NOT({Bearbetad})",
      pageSize: "100",
      ...(offset ? { offset } : {}),
    });
    const data = await airtableFetch(url);
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

function buildSvarRecords(submission) {
  const coachId = submission.fields["Coach_ID"] ?? null;
  const tidsstampel = submission.fields["Tidsstämpel"] ?? null;

  return QUESTION_IDS.map((fragaId) => {
    const raw = submission.fields[fragaId];
    const svar = typeof raw === "string" ? raw.trim() : raw;
    if (!svar) return null;

    return {
      fields: {
        Fråga_ID: fragaId,
        Svar: svar,
        Coach_ID: coachId,
        Tidsstämpel: tidsstampel,
      },
    };
  }).filter((record) => record !== null);
}

async function createSvarRecords(records) {
  for (let i = 0; i < records.length; i += CREATE_BATCH_SIZE) {
    const batch = records.slice(i, i + CREATE_BATCH_SIZE);
    await airtableFetch(airtableUrl(SVAR_TABLE), {
      method: "POST",
      body: JSON.stringify({ records: batch }),
    });
  }
}

async function markProcessed(submissionId) {
  await airtableFetch(airtableUrl(TALLY_TABLE), {
    method: "PATCH",
    body: JSON.stringify({
      records: [{ id: submissionId, fields: { Bearbetad: true } }],
    }),
  });
}

async function main() {
  const submissions = await fetchUnprocessedSubmissions();

  if (submissions.length === 0) {
    console.log("Inga obehandlade inskickningar i Tally-inskickningar.");
    return;
  }

  console.log(`Hittade ${submissions.length} obehandlade inskickning(ar).`);

  let totalSvarRows = 0;

  for (const submission of submissions) {
    const svarRecords = buildSvarRecords(submission);
    await createSvarRecords(svarRecords);
    await markProcessed(submission.id);
    totalSvarRows += svarRecords.length;

    const coachId = submission.fields["Coach_ID"] ?? "(okänt Coach_ID)";
    console.log(
      `  ${submission.id} (Coach_ID: ${coachId}): ${svarRecords.length} svar → Svar-tabellen, markerad Bearbetad.`
    );
  }

  console.log(
    `Klart. ${submissions.length} inskickning(ar) bearbetade, ${totalSvarRows} rader skapade i Svar.`
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
