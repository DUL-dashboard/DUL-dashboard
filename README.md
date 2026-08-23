# DUL Dashboard

Coachingverktyget DUL: dashboard och PDF-rapportgenerator kopplat till en
Airtable-databas.

## Status

Grundstruktur på plats. Första steget är att bevisa att kopplingen mot
Airtable fungerar – dashboarden visar anslutningsstatus och listar
kolumnerna i den konfigurerade tabellen.

## Komma igång

1. Installera beroenden:

   ```bash
   npm install
   ```

2. Kopiera miljövariabler och fyll i era Airtable-uppgifter:

   ```bash
   cp .env.example .env.local
   ```

   - `AIRTABLE_PAT` – Personal Access Token från
     [airtable.com/create/tokens](https://airtable.com/create/tokens) med
     scope `data.records:read` och access till er DUL-bas.
   - `AIRTABLE_BASE_ID` – ID:t för basen (börjar på `app...`).
   - `AIRTABLE_TABLE_NAME` – namnet på tabellen som ska visas, t.ex.
     `Coachees` eller `Sessioner`.

3. Starta utvecklingsservern:

   ```bash
   npm run dev
   ```

4. Öppna [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
   – sidan visar om kopplingen mot Airtable fungerar.

## Struktur

```
src/
  app/
    dashboard/              Dashboard-sida (visar Airtable-status + kolumner)
    api/airtable/status/    API-route för att verifiera Airtable-koppling
    api/reports/[recordId]/ Genererar en PDF-rapport för en Airtable-post
  lib/
    airtable/                Airtable-klient, config och datahämtning
    pdf/                     React-PDF-mallar för rapportgenerering
```

## PDF-rapporter

`GET /api/reports/<recordId>` genererar en enkel PDF utifrån en post i den
konfigurerade Airtable-tabellen. Mallen (`CoachingReportDocument`) är en
första utgångspunkt – layout och innehåll behöver anpassas när vi
bestämt hur en DUL-rapport faktiskt ska se ut.

## Tally → Svar-transform

Tally-formulärsvar skrivs (via Tallys inbyggda Airtable-integration eller en
mellanhand som Zapier/Make) som en rad per inskickning i tabellen
`Tally-inskickningar` – en kolumn per fråga (52 st) plus `Coach_ID`,
`Tidsstämpel` och `Bearbetad`. En Airtable Automation packar sedan upp varje
inskickning till en rad per besvarad fråga i `Svar`, i det format
dashboarden redan läser (`Fråga_ID`, `Svar`, `Coach_ID`, `Tidsstämpel`).

Filer i `scripts/tally-integration/`:

- `question-ids.mjs` – källa till sanning för de 52 frågekolumnernas namn
  (F1..F52 som platshållare – byt ut mot de riktiga `FrågeID`-värdena från
  Frågor-tabellen).
- `create-tally-inskickningar-table.mjs` – engångsscript som skapar
  `Tally-inskickningar`-tabellen via Airtables Metadata-API. Kräver en PAT
  med scope `schema.bases:write` utöver `data.records:read/write`. Körs
  lokalt, aldrig i produktion:

  ```bash
  node --env-file=.env.local scripts/tally-integration/create-tally-inskickningar-table.mjs
  ```

- `airtable-automation-tally-to-svar.js` – innehållet klistras in i ett
  "Run a script"-steg i en Airtable Automation (trigger: "When record
  created" på `Tally-inskickningar`, med en input variable `recordId` =
  triggerpostens Record ID). Se kommentaren högst upp i filen för
  steg-för-steg-instruktioner. Automationer kan inte skapa tabeller, bara
  läsa/skriva poster – därför är detta ett separat steg från
  tabellskapandet ovan.

**Innan ni kör:** ersätt platshållarlistan i `question-ids.mjs` (och håll
`QUESTION_IDS` i `airtable-automation-tally-to-svar.js` manuellt i synk,
scriptsandlådan i Airtable kan inte importera filer) med de faktiska
`FrågeID`-värdena från er Frågor-tabell, så att `Tally-inskickningar`-
kolumnerna matchar det Tally-formuläret faktiskt skickar in.

## Nästa steg

- Definiera det faktiska Airtable-schemat (tabeller/fält) för DUL.
- Bygga ut dashboarden med riktiga vyer per coachee/session.
- Designa den riktiga PDF-rapportmallen tillsammans med verksamheten.
- Lägga till autentisering innan verktyget används med skarpa data.
