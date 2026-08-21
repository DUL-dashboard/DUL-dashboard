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

## Nästa steg

- Definiera det faktiska Airtable-schemat (tabeller/fält) för DUL.
- Bygga ut dashboarden med riktiga vyer per coachee/session.
- Designa den riktiga PDF-rapportmallen tillsammans med verksamheten.
- Lägga till autentisering innan verktyget används med skarpa data.
