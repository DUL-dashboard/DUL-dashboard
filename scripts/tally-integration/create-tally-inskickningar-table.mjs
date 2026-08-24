/**
 * Engångsscript: skapar tabellen "Tally-inskickningar" i Airtable-basen via
 * Metadata-API:et. Körs lokalt, en gång, av en människa med en Personal
 * Access Token som har scopet `schema.bases:write` (utöver
 * `data.records:read`/`data.records:write`).
 *
 * Tabellen får 55 fält: Coach_ID, Tidsstämpel, Bearbetad + 52
 * frågekolumner (se question-ids.mjs).
 *
 * Körs INTE av Airtable Automation – automationer kan inte skapa tabeller,
 * bara skriva/läsa poster. Se airtable-automation-tally-to-svar.js för
 * scriptet som packar upp inskickningar till Svar-rader.
 *
 * Användning:
 *   node --env-file=.env.local scripts/tally-integration/create-tally-inskickningar-table.mjs
 *
 * Krävda miljövariabler:
 *   AIRTABLE_PAT      – Personal Access Token med scope schema.bases:write
 *   AIRTABLE_BASE_ID  – basens ID (börjar på "app...")
 */
import { QUESTION_IDS } from "./question-ids.mjs";

const TABLE_NAME = "Tally-inskickningar";

const pat = process.env.AIRTABLE_PAT;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!pat || !baseId) {
  console.error(
    "Saknar AIRTABLE_PAT och/eller AIRTABLE_BASE_ID. Sätt dem i .env.local " +
      "och kör t.ex.:\n" +
      "  node --env-file=.env.local scripts/tally-integration/create-tally-inskickningar-table.mjs"
  );
  process.exit(1);
}

if (QUESTION_IDS.length !== 52) {
  console.error(
    `Förväntade 52 frågekolumner i question-ids.mjs, hittade ${QUESTION_IDS.length}.`
  );
  process.exit(1);
}

const fields = [
  { name: "Coach_ID", type: "singleLineText" },
  { name: "Tidsstämpel", type: "dateTime", options: {
      dateFormat: { name: "iso" },
      timeFormat: { name: "24hour" },
      timeZone: "client",
    },
  },
  { name: "Bearbetad", type: "checkbox", options: { icon: "check", color: "greenBright" } },
  ...QUESTION_IDS.map((questionId) => ({
    name: questionId,
    type: "singleLineText",
  })),
];

async function main() {
  const existing = await fetch(
    `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
    { headers: { Authorization: `Bearer ${pat}` } }
  );

  if (!existing.ok) {
    throw new Error(
      `Kunde inte lista tabeller (${existing.status}): ${await existing.text()}`
    );
  }

  const { tables } = await existing.json();
  if (tables.some((table) => table.name === TABLE_NAME)) {
    console.log(`Tabellen "${TABLE_NAME}" finns redan – gör inget.`);
    return;
  }

  const response = await fetch(
    `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pat}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: TABLE_NAME,
        description:
          "Rådata från Tally-formulärinskickningar, en rad per inskickning. " +
          "Packas upp till Svar-tabellen av en Airtable Automation.",
        fields,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Kunde inte skapa tabellen (${response.status}): ${await response.text()}`
    );
  }

  const created = await response.json();
  console.log(`Skapade tabellen "${TABLE_NAME}" (${created.id}) med ${fields.length} fält.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
