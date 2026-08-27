# Referensdata för anmälningsformuläret

Se `docs/tally-tranare-anmalan-formular.md` för den fullständiga
bygginstruktionen för Tally-formuläret "DUL anmälan tränare" (fält,
Airtable-mappning, bekräftelsemejl). Tränare-tabellen har nu fått fälten
`Förening eller organisation`, `Kön`, `Åldersgrupp` och `Nivå`. Den här
filen behålls som ren referens för options-listorna.

PDF-rapporten (`CoachDimensionReportDocument.tsx`) visar fortfarande inte
ÅLDERSGRUPP/NIVÅ på omslaget – uppdatera den när formuläret är i skarp
drift och det finns riktig data i de nya fälten.

## Idrott

25 största idrotterna enligt RF, alfabetisk ordning. "Annan individuell
idrott" och "Annan lagidrott" ska alltid stå sist i listan (inte
alfabetiskt inordnade):

1. Badminton
2. Basket
3. Bordtennis
4. Bowling
5. Budo och kampsport
6. Cykel
7. Dans
8. Fotboll
9. Friidrott
10. Golf
11. Gymnastik
12. Handboll
13. Innebandy
14. Ishockey
15. Konståkning
16. Motorsport
17. Orientering
18. Ridsport
19. Segling
20. Simning
21. Skidor – alpint
22. Skidor – längd
23. Skytte
24. Tennis
25. Volleyboll
26. Annan individuell idrott
27. Annan lagidrott

## Åldersgrupp

- 9–12 år
- 13–15 år
- 16–19 år
- 20+ år

## Nivå

- Breddidrott
- Regional nivå
- Nationell nivå
- Elitidrott
- Landslag

Elitidrott och Landslag är separata kategorier, inte samma sak.
