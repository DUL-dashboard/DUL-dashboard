# Bygginstruktion: Tally-formulär "DUL anmälan tränare"

**Status:** Inte byggt än. Jag (Claude) har ingen direkt åtkomst till Tally.so
i den här miljön (inget API-verktyg, inget kopplat konto) och kan därför inte
skapa formuläret automatiskt. Den här filen är en fullständig
kopiera-in-i-Tally-guide så du (eller en framtida session) kan bygga det på
några minuter utan att behöva tolka den ursprungliga instruktionen på nytt.

Airtable-sidan är redan klar: Tränare-tabellen har fått de 4 fält som
saknades (`Förening eller organisation`, `Kön`, `Åldersgrupp`, `Nivå`) via
Metadata-API:et, se commit-historiken. `Idrott` och `Kursomgång` var redan
`singleLineText` sedan tidigare och behöver inga ändringar.

## 1. Skapa formuläret

Tally → "Create form" → namnge det **"DUL anmälan tränare"**.

## 2. Fält, i denna ordning

| # | Fält (Tally-typ) | Obligatoriskt | Alternativ |
|---|---|---|---|
| 1 | Namn (Short text) | Ja | – |
| 2 | E-post (Email) | Ja | – |
| 3 | Idrott (Dropdown/Single select) | Rekommenderas | Se lista nedan |
| 4 | Förening eller organisation (Short text) | Nej | – |
| 5 | Antal idrottare som deltar i att ge feedback i den här utbildningen (Number) | Ja | – |
| 6 | Kön (Multiple choice, enkelval) | Ja | Flickor eller Damer / Pojkar eller Herrar / Mixad grupp |
| 7 | Den vanligaste åldersgruppen (Multiple choice, enkelval) | Ja | 9 till 12 år / 13 till 15 år / 16 till 19 år / 20 plus år |
| 8 | Nivå på idrottare (Multiple choice, enkelval) | Ja | Breddidrott / Regional nivå / Nationell nivå / Elitidrott / Landslag |
| 9 | Kursomgång (Short text, eller Dropdown om ni etablerat en fast lista) | Ja | Se anmärkning nedan |

**Idrott-listan** (alfabetisk, "Annan individuell idrott"/"Annan lagidrott" alltid sist):
Badminton, Basket, Bordtennis, Bowling, Budo och kampsport, Cykel, Dans,
Fotboll, Friidrott, Golf, Gymnastik, Handboll, Innebandy, Ishockey,
Konståkning, Motorsport, Orientering, Ridsport, Segling, Simning,
Skidor – alpint, Skidor – längd, Skytte, Tennis, Volleyboll,
Annan individuell idrott, Annan lagidrott.

**Om Kön/Åldersgrupp/Nivå:** valen ovan matchar exakt de `singleSelect`-alternativ
som just skapats i Airtables Tränare-tabell. Om du ändrar ett alternativs
ordalydelse i Tally måste samma ändring göras i Airtable-fältets choices,
annars matchar inte Tally → Airtable-mappningen (samma typ av problem vi
stötte på med svarsalternativen i Tally-inskickningar tidigare i det här
projektet).

**Om Kursomgång:** det finns ingen etablerad, fast lista med kursomgångar
ännu (bara testvärdet "Test1" i Airtable). Jag rekommenderar fritext för nu
snarare än en dropdown – säg till om ni vill låsa den till en lista, så
uppdaterar vi den här filen och Airtable-fältet.

## 3. Airtable-koppling

Tally → Integrations → Airtable → koppla mot samma bas som DUL-formuläret
(`apppxGfCGbKtMaEOj`), tabellen **Tränare**.

Mappa varje Tally-fält till Airtable-kolumnen med samma namn:

| Tally-fält | Airtable-kolumn |
|---|---|
| Namn | Namn |
| E-post | E-post |
| Idrott | Idrott |
| Förening eller organisation | Förening eller organisation |
| Antal idrottare... | Antal idrottare |
| Kön | Kön |
| Den vanligaste åldersgruppen | Åldersgrupp |
| Nivå på idrottare | Nivå |
| Kursomgång | Kursomgång |

**Coach_ID = e-postadressen, inte ett löpnummer:** i mappningsvyn finns en
egen rad för Airtable-kolumnen `Coach_ID`. Sätt **samma källfält där som för
E-post-kolumnen** (dvs. fält 2, E-post) – inte Tallys automatiska
löpnummer/response-ID. Om mappningsgränssnittet inte tillåter att välja
samma källfält två gånger: skapa ett dolt "Calculated field" i Tally som
kopierar värdet från E-post-fältet, och mappa det dolda fältet till
`Coach_ID` istället. Verifiera med en testinskickning att `Coach_ID` i
Airtable faktiskt blir e-postadressen, inte ett löpnummer, innan lansering.

## 4. Respondent email notifications (bekräftelsemejl)

Tally → formulärets Settings → Notifications → **Respondent email
notifications** → slå på, koppla till fält 2 (E-post) som mottagaradress.

**⚠️ Flaggat, ej verifierat:** jag är inte säker på om respondent email
notifications kräver Tally Pro (betald plan) eller ingår i gratisplanen –
det kan ha ändrats sedan min kunskap uppdaterades senast. Kontrollera
[tally.so/pricing](https://tally.so/pricing) eller testa att slå på
inställningen; om Tally visar en uppgraderingsspärr vet du att ni behöver
uppgradera innan detta fungerar skarpt.

**Ämnesrad:**
```
Ditt Unika Ledarskap – Information och nästa steg
```

**Mejltext** (klistra in i Tallys mejleditor; ersätt `{{Namn}}` och
`{{E-post}}` med Tallys faktiska variabel-/merge-fält-väljare på samma
ställe – jag är inte säker på exakt token-syntax i den aktuella
Tally-versionen, så använd variabel-ikonen/`/`-kommandot i editorn och välj
fälten "Namn" respektive "E-post" istället för att lita på texten nedan
ordagrant):

```
Hej {{Namn}}

Varmt välkommen till utbildningen Ditt Unika Ledarskap (DUL). Här kommer
information om hur du går till väga för att samla in feedback från
idrottarna du tränar, samt praktisk information om utbildningen.

Så går du till väga
Nedan hittar du din unika länk. Vidarebefordra länken till idrottarna du
tränar, gärna via mejl eller i er lagchatt. Idrottarna svarar anonymt på 52
korta frågor om hur de uppfattar beteenden i ditt ledarskap. Det tar cirka
10 minuter att svara. Feedbacken du får från idrottarna kommer ligga till
grund för analys, reflektioner och framtagande av din unika handlingsplan
för träning av ditt ledarskap.

Din unika länk
Svaren är helt anonyma och redovisas endast som grupp i den rapport du
senare får. Det är därför viktigt att så många idrottare som möjligt
svarar. Minimum är 5 för att resultatet ska bli meningsfullt.

https://tally.so/r/68ED6O?coach_id={{E-post}}

Sista svarsdag
15 september

Om utbildningen
Ditt Unika Ledarskap bygger på en evidensbaserad grund som transformerande
ledarskap, självbestämmande motivation och idrottspsykologi. Under
utbildningen går vi igenom din rapport tillsammans, identifierar styrkor
och utvecklingsområden i ditt ledarskap, och du får en konkret
handlingsplan att arbeta vidare med. Dagarna innehåller grundläggande
teori, men framförallt diskussioner, analys och konkreta arbetssätt för
att utveckla ditt ledarskap.

Tid och plats
[DATUM OCH TID]
[PLATS]

Uppföljande webbinar
Efter utbildningen bjuder vi in till ett webbinar där vi följer upp hur
din träning gått efter utbildningen och hur du kan fortsätta träna ditt
ledarskap framöver. Dessutom kommer vi gå igenom frågor och ge goda
exempel till varandra.
Länk till webbinaret skickas ut separat inför tillfället.
[DATUM OCH TID FÖR WEBBINAR]

Frågor
Hör gärna av dig om du undrar något.

Johan
johan@2motiv8.se
```

`[DATUM OCH TID]`, `[PLATS]` och `[DATUM OCH TID FÖR WEBBINAR]` är
platshållare som ska fyllas i manuellt innan lansering – lämnade orörda
enligt instruktion. `https://tally.so/r/68ED6O` är den befintliga
idrottsenkätens URL (samma form som redan är kopplad till
Tally-inskickningar-pipelinen i det här repot); `?coach_id={{E-post}}`
förutsätter att det formuläret redan har ett dolt fält `coach_id` som läser
från URL-parametern – vilket stämmer med hur Coach_ID redan fylls i
Tally-inskickningar-tabellen idag.

## 5. Testa innan skarp drift

1. Skicka in en testanmälan med en riktig e-postadress du har tillgång till.
2. Verifiera i Airtable att alla 9 fält hamnat rätt, och att `Coach_ID`
   blivit e-postadressen (inte ett löpnummer).
3. Verifiera att bekräftelsemejlet kommer fram, att namn och länk är rätt
   ifyllda, och att länken faktiskt fungerar med rätt `coach_id`.
4. Städa bort testposten i Airtable när du verifierat att allt fungerar.
