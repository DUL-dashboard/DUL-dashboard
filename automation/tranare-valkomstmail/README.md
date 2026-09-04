# Tränare-valkomstmail: Tally → Google Apps Script → Gmail

**Status:** Byggd och logiktestad i isolerad miljö. INTE kopplad till något
live-system. Ingenting i den här mappen rör "DUL anmälan tränare",
DUL-enkäten (68ED6O), eller Airtable-tabellerna `Tränare`/`Svar`.

## Syfte

När en tränare fyller i ett anmälningsformulär i Tally ska hen automatiskt
få ett mejl med sin personliga DUL-länk (`.../68ED6O?Coach_ID=...`)
inbyggd. Kedjan är:

```
Tally-formulär --webhook--> Google Apps Script (Web App) --GmailApp--> mejl
```

## Säkerhetsprinciper (varför koden ser ut som den gör)

1. **Separat allt.** Detta ska köras mot ett helt nytt, fristående
   Tally-testformulär och ett Apps Script-projekt du skapar själv för
   ändamålet - aldrig mot "DUL anmälan tränare".
2. **Tvingad testmottagare.** `CONFIG.testMode = true` gör att
   `resolveRecipient()` alltid returnerar `CONFIG.testRecipientEmail` (din
   egen adress), oavsett vilken e-post som stod i formuläret. Detta är
   hårdkodat och testat (se `tests/logic.test.js`).
3. **Allowlist på formulär-ID.** `doPost` avvisar tyst allt som inte
   kommer från ett formulär-ID i `CONFIG.allowedFormIds`. Så länge bara
   testformulärets ID står där kan skriptet aldrig göra något även om
   det av misstag skulle nås av en annan webhook.
4. **Delad hemlighet i webhook-URL:en.** `doPost` kräver en
   `?secret=...`-parameter som matchar `WEBHOOK_SECRET` i projektets
   Script Properties, så att inte vem som helst som gissar Web App-URL:en
   kan trigga utskick.

## Vad jag INTE har gjort (och inte kan göra härifrån)

Den här Claude-sessionen har ingen inloggad åtkomst till ditt Tally-konto
eller Google-konto - jag kan bara läsa/skriva filer i det här
git-repot. Jag har alltså **inte** skapat något testformulär i Tally,
**inte** skapat något Apps Script-projekt, och **inte** skickat något
riktigt mejl. Det som är klart är:

- Ren, testad logik (`shared-logic.js`) för att tolka en Tally-webhook,
  bygga den personliga länken, avgöra mottagare och formatera mejlet.
- Ett komplett Apps Script-skript (`apps-script/Code.gs`) med
  säkerhetsspärrarna ovan, redo att klistras in.
- 14 automatiska tester (`tests/logic.test.js`) som bevisar logiken,
  inklusive att en payload från "live"-formulärets ID avvisas och att
  testadressen alltid vinner över den inskickade adressen.

Nästa steg (att faktiskt skapa testformuläret och Apps Script-projektet)
kräver att **du** loggar in och gör dem - se steg-för-steg nedan.

## Köra de automatiska testerna

Ingen extra dependency behövs (samma mönster som repots övriga
`scripts/*.mjs`):

```bash
node --test automation/tranare-valkomstmail/tests/logic.test.js
```

Alla 14 tester ska gå igenom (`# pass 14`, `# fail 0`).

## Steg-för-steg: bygg den isolerade testmiljön

### 1. Skapa ett helt nytt Tally-testformulär

- Gå till [tally.so](https://tally.so), skapa ett **nytt** formulär, t.ex.
  döpt "TEST - Tränare valkomstmail (rör ej i produktion)".
- Lägg till tre frågor med exakt dessa rubriker (eller ändra
  `CONFIG.fieldLabels` i `Code.gs` om du vill ha andra):
  - `Namn` (kort text)
  - `E-post` (e-postfråga)
  - `Coach ID` (kort text - fyll själv i något påhittat värde som
    `TEST-COACH-001` när du testar)
- Publicera formuläret. Notera formulärets ID: det står i URL:en, t.ex.
  `https://tally.so/forms/AbCdEf` → ID:t är `AbCdEf`.
- **Rör inte "DUL anmälan tränare".** Detta ska vara ett helt separat
  formulär.

### 2. Skapa ett fristående Google Apps Script-projekt

- Gå till [script.google.com](https://script.google.com) (gärna med det
  Google-konto som ändå ska skicka mejlen, t.ex. ditt eget) → New project.
- Döp projektet till t.ex. "DUL tränare-valkomstmail (TEST)".
- Skapa en fil `Logic.gs` och klistra in **hela innehållet** i
  [`shared-logic.js`](./shared-logic.js) oförändrat.
- Skapa/ersätt `Code.gs` med innehållet i
  [`apps-script/Code.gs`](./apps-script/Code.gs).
- I `Code.gs`, uppdatera i `CONFIG`:
  - `testRecipientEmail` → din egen e-postadress.
  - `allowedFormIds` → `["<testformulärets ID från steg 1>"]`.
  - `dulSurveyBaseUrl` → peka mot testformuläret igen (eller valfri
    ofarlig test-URL) - **absolut inte** `.../r/68ED6O`.
- (Valfritt men rekommenderat) Kopiera in `appsscript.json`-innehållet via
  Project Settings → "Show appsscript.json in editor".

### 3. Sätt webhook-hemligheten

- I Apps Script-editorn: Project Settings → Script Properties → Add script
  property.
- Nyckel: `WEBHOOK_SECRET`. Värde: en slumpad sträng, t.ex. generera en
  lokalt med:

  ```bash
  node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
  ```

### 4. Deploya som Web App

- Deploy → New deployment → Type: Web app.
- Execute as: **Me**. Who has access: **Anyone**.
- Kopiera Web App-URL:en. Lägg till `?secret=<samma värde som
  WEBHOOK_SECRET>` på slutet, t.ex.
  `https://script.google.com/macros/s/XXXX/exec?secret=abcd1234...`.
- Behandla den fullständiga URL:en (med secret) som en hemlighet -
  spara den inte i klartext i delade dokument.

### 5. Verifiera själva skriptet innan Tally ens är inkopplat

- I Apps Script-editorn: välj funktionen `selfTest` i dropdownen uppe till
  vänster → Run.
- Första gången ber Google om behörighet (Gmail-sändning) - godkänn med
  samma konto som projektet skapades i.
- Kontrollera din inkorg: du ska få ett mejl med ämnet
  `[TEST] Välkommen till DUL - din personliga länk`, som nämner att det
  "i skarpt läge hade gått till" en påhittad adress, och innehåller en
  länk med `Coach_ID=SJALVTEST-123`.
- Detta bevisar hela kedjan (parsning → länk → mottagarspärr → Gmail)
  utan att röra Tally alls.

### 6. Koppla webhooken i TESTFORMULÄRET

- I Tally-testformuläret: Integrations → Webhooks → Add webhook.
- Klistra in Web App-URL:en **med `?secret=...`** från steg 4.
- Spara.

### 7. Kör en riktig end-to-end-test

- Fyll i testformuläret själv, som om du vore en tränare (använd t.ex.
  `TEST-COACH-002` som Coach ID).
- Vänta ~10-30 sekunder (Tally-webhooks är i princip direkta, men Apps
  Script kan ha någon sekunds fördröjning).
- Kontrollera att mejlet kommer till **din egen adress** (aldrig till
  adressen du skrev i formuläret, tack vare `resolveRecipient`).
- Kontrollera Apps Script-loggen (View → Executions) att anropet lyckades
  och att `formId` matchade allowlistan.
- Testa även en "felaktig" inskickning (lämna t.ex. Coach ID tomt) och
  bekräfta i loggen att det ger ett tydligt fel istället för en krasch
  eller ett tomt mejl.

När steg 5-7 fungerar pålitligt (gärna kör dem några gånger) är kedjan
bevisad i den isolerade miljön.

## Gå live - manuella steg (gör INTE detta förrän efter 20 september, och gör det tillsammans, inte jag ensam)

Detta är en checklista för när ni är redo. Jag utför inte dessa steg åt
er - de kräver medvetna beslut (bl.a. vilket Google-konto som ska "äga"
utskicken, och hur `Coach_ID` faktiskt ska hämtas för en riktig tränare)
som ni ska ta ställning till, inte jag.

1. **Bestäm hur `Coach_ID` ska tas fram för en riktig anmälan.** I
   testet skriver testtränaren in ett påhittat Coach ID själv. I skarpt
   läge finns `Coach_ID` redan (eller ska skapas) i Airtable-tabellen
   `Tränare` - ni behöver bestämma om Apps Script ska slå upp/skapa
   Coach_ID i Airtable (kräver en Airtable-koppling till i skriptet, med
   egen PAT) eller om `Coach_ID` ska vara ett fält tränaren själv fyller i
   vid anmälan. Det här är en riktig designfråga, inte bara en
   konfigurationsändring.
2. Skapa ett **nytt** webhook-block i "DUL anmälan tränare" (eller
   återanvänd om det redan finns ett, men lägg till, rör inte den
   befintliga Airtable-kopplingen/mappningen för formuläret).
3. I Apps Script-projektet (samma eller ett nytt, skarpt projekt - ta
   ställning till vilket): sätt
   - `CONFIG.testMode = false`
   - `CONFIG.allowedFormIds` → `["<det riktiga formulärets ID>"]`
   - `CONFIG.dulSurveyBaseUrl` → `https://tally.so/r/68ED6O`
   - Uppdatera `CONFIG.fieldLabels` om de riktiga fältrubrikerna i "DUL
     anmälan tränare" skiljer sig från testformulärets.
4. Generera en ny, egen `WEBHOOK_SECRET` för den skarpa deployen (återanvänd
   inte testhemligheten).
5. Deploya en **ny** Web App-version, koppla dess URL (med den nya
   secreten) som webhook i "DUL anmälan tränare".
6. Kör ett riktigt test genom att ni själva (inte en riktig tränare)
   fyller i det skarpa formuläret, och verifiera mejlet innan ni litar på
   det för riktiga tränare.
7. Först därefter är det säkert för faktiska tränare att fylla i
   formuläret och lita på att de får sin länk automatiskt.

## Filstruktur

```
automation/tranare-valkomstmail/
  README.md              Den här filen
  shared-logic.js         Ren, testad logik (parsning, länk, mottagarspärr, mejltext)
  apps-script/
    Code.gs               doPost, CONFIG, Gmail-sändning, selfTest()
    appsscript.json        Valfritt manifest (webapp-inställningar, tidszon)
  tests/
    logic.test.js          14 tester mot shared-logic.js (node --test)
    fixtures/
      tally-webhook-sample.json          Giltig payload från testformuläret
      tally-webhook-wrong-form.json      Payload som om den kom från "DUL anmälan tränare" - ska avvisas
      tally-webhook-missing-field.json   Payload med saknat fält - ska ge tydligt fel
```
