import path from "path";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  ANSWER_OPTIONS,
  type AnswerOption,
  type AreaReport,
  type InstrumentAreaStructure,
  type QuestionInfo,
  type QuestionSummary,
} from "@/lib/airtable/dul";

/**
 * Visuell mall byggd efter tranarrapport_exempel_v2.pdf (v5, slutgiltig
 * design), inklusive samma omslagsbild (extraherad ur originalfilen).
 *
 * En avvikelse kvarstår mot originalfilen eftersom verklig data inte
 * stödjer den: svarsskalan har bara 4 alternativ i vårt system
 * (ANSWER_OPTIONS), inte de 5 i exempelfilens färgförklaring ("Ofta"
 * saknas helt hos oss) - färgerna nedan är en direkt ommappning av
 * samma fyra alternativ vi faktiskt har.
 *
 * Rapporten avser åldersgruppen 20+ år och omfattar därför bara
 * områdena A-D (52 frågor) - område E (Triaden, åldersbegränsade
 * frågor) samlas inte in i 20+-versionen och visas inte.
 */

const COVER_HERO_PATH = path.join(
  process.cwd(),
  "src/lib/pdf/assets/cover-hero.png"
);

const GOLD = "#C99A2E";
const GOLD_DARK = "#A67F1F";
const GOLD_LIGHT = "#F2D98A";
const CHARCOAL = "#2B2B2B";
const BORDER = "#D8D2C4";

const ANSWER_COLORS: Record<AnswerOption, string> = {
  "Nästan aldrig": "#D6D6D6",
  "Då och då": "#7C8A9B",
  "Nästan alltid": "#E3B94A",
  "Vill eller kan ej bedöma": CHARCOAL,
};

const ANSWER_TEXT_COLORS: Record<AnswerOption, string> = {
  "Nästan aldrig": CHARCOAL,
  "Då och då": "#FFFFFF",
  "Nästan alltid": CHARCOAL,
  "Vill eller kan ej bedöma": "#FFFFFF",
};

const styles = StyleSheet.create({
  coverPage: { fontFamily: "Helvetica", backgroundColor: "#FFFFFF" },
  coverTopBar: { height: 40, backgroundColor: GOLD_LIGHT },
  coverHeroImage: {
    width: "100%",
    height: 300,
    objectFit: "cover",
  },
  coverHeroBand: { height: 20, backgroundColor: GOLD_LIGHT },
  coverHeroBandDark: { height: 6, backgroundColor: GOLD_DARK },
  coverHeroBand2: { height: 20, backgroundColor: GOLD_LIGHT },
  coverBody: { padding: 32, paddingTop: 48, alignItems: "center" },
  coverTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: CHARCOAL,
    marginBottom: 8,
    textAlign: "center",
  },
  coverSubtitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: GOLD_DARK,
    letterSpacing: 1,
    marginBottom: 6,
  },
  coverAgeNote: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: CHARCOAL,
    letterSpacing: 0.5,
    marginBottom: 24,
  },
  coverTable: { width: "100%", maxWidth: 400, marginBottom: 24 },
  coverRow: { flexDirection: "row" },
  coverLabelCell: {
    width: 150,
    backgroundColor: CHARCOAL,
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    padding: 8,
    letterSpacing: 0.5,
  },
  coverValueCell: {
    flex: 1,
    backgroundColor: "#F4EFE1",
    color: CHARCOAL,
    fontSize: 10,
    padding: 8,
  },
  coverTagline: {
    fontSize: 10,
    fontFamily: "Helvetica-BoldOblique",
    color: GOLD_DARK,
    letterSpacing: 1,
  },
  coverFooter: {
    position: "absolute",
    bottom: 24,
    left: 32,
    fontSize: 8,
    fontFamily: "Helvetica-Oblique",
    color: "#8A8A8A",
  },

  page: { padding: 32, paddingTop: 44, paddingBottom: 40, fontFamily: "Helvetica", fontSize: 10, color: CHARCOAL },
  runningHead: {
    position: "absolute",
    top: 20,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottom: `1.5px solid ${GOLD}`,
    paddingBottom: 6,
  },
  runningHeadLeft: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: CHARCOAL,
    letterSpacing: 0.5,
  },
  runningHeadRight: { fontSize: 8, fontFamily: "Helvetica-Oblique", color: "#8A8A8A" },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "0.5px solid #DDDDDD",
    paddingTop: 6,
    fontSize: 8,
    color: "#8A8A8A",
  },

  h1: { fontSize: 20, fontFamily: "Helvetica-Bold", color: CHARCOAL, marginBottom: 10 },
  h2: { fontSize: 11, fontFamily: "Helvetica-Bold", color: GOLD_DARK, marginBottom: 4, marginTop: 14 },
  body: { fontSize: 10, lineHeight: 1.4, marginBottom: 6 },

  legendBox: {
    backgroundColor: "#F7F4EC",
    border: `0.5px solid ${BORDER}`,
    padding: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  legendTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: CHARCOAL, marginBottom: 6, letterSpacing: 0.5 },
  legendRow: { flexDirection: "row", flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", marginRight: 18, marginBottom: 2 },
  legendSwatch: { width: 12, height: 12, marginRight: 5 },
  legendLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: CHARCOAL },

  structureRow: { flexDirection: "row", alignItems: "center", marginBottom: 1 },
  structureBadge: {
    width: 22,
    height: 22,
    backgroundColor: GOLD,
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    textAlign: "center",
    paddingTop: 5,
    marginRight: 8,
  },
  structureName: { flex: 1, fontSize: 9, fontFamily: "Helvetica-Bold", color: CHARCOAL },
  structureMeta: { fontSize: 8, color: "#8A8A8A" },

  matrixTable: { marginTop: 8 },
  matrixHeaderRow: { flexDirection: "row", backgroundColor: CHARCOAL },
  matrixHeaderCellDim: { flex: 3, padding: 5, color: "#FFFFFF", fontSize: 8, fontFamily: "Helvetica-Bold" },
  matrixHeaderCell: { flex: 1, padding: 5, color: "#FFFFFF", fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "center" },
  matrixRow: { flexDirection: "row", borderBottom: `0.5px solid ${BORDER}` },
  matrixDimCell: { flex: 3, padding: 5, fontSize: 8, backgroundColor: "#F7F4EC" },
  matrixValueCell: { flex: 1, height: 20 },

  areaHeaderRow: { flexDirection: "row", backgroundColor: CHARCOAL, marginTop: 4, marginBottom: 10, alignItems: "stretch" },
  areaBadge: {
    width: 46,
    height: 46,
    backgroundColor: GOLD,
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    fontSize: 24,
    textAlign: "center",
    paddingTop: 8,
  },
  areaHeaderText: { justifyContent: "center", paddingLeft: 14, paddingVertical: 6 },
  areaName: { color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 15 },
  areaLabel: { color: GOLD_LIGHT, fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1, marginTop: 2 },

  dimensionBlock: { marginBottom: 14 },
  dimensionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: GOLD_DARK, marginBottom: 1 },
  dimensionSubtitle: { fontSize: 7.5, fontFamily: "Helvetica-Oblique", color: "#8A8A8A", marginBottom: 4 },

  summaryBar: { flexDirection: "row", height: 20, marginBottom: 8 },
  summarySegment: { justifyContent: "center", alignItems: "center" },
  summarySegmentText: { fontSize: 8, fontFamily: "Helvetica-Bold" },

  questionRow: { flexDirection: "row", marginBottom: 6, alignItems: "center" },
  questionText: { width: 210, fontSize: 8.5, lineHeight: 1.25, color: CHARCOAL },
  questionBarWrap: { flex: 1, flexDirection: "row", alignItems: "center" },
  questionBar: { flex: 1, flexDirection: "row", height: 13 },
  questionSegment: { justifyContent: "center", alignItems: "center" },
  questionSegmentText: { fontSize: 7, fontFamily: "Helvetica-Bold" },
  questionN: { width: 28, fontSize: 7.5, color: "#8A8A8A", textAlign: "right" },
  introLine: { fontSize: 7.5, fontFamily: "Helvetica-Oblique", color: "#8A8A8A", marginBottom: 4 },

  notesBlock: { marginTop: 10 },
  notesTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: GOLD_DARK,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  notesLine: {
    height: 20,
    borderBottomWidth: 0.75,
    borderBottomColor: "#C7BFA9",
    borderBottomStyle: "dotted",
  },
});

function MIN_SEGMENT() {
  return 0.001;
}

function ColorLegend() {
  return (
    <View style={styles.legendBox}>
      <Text style={styles.legendTitle}>FÄRGFÖRKLARING</Text>
      <View style={styles.legendRow}>
        {ANSWER_OPTIONS.map((option) => (
          <View key={option} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: ANSWER_COLORS[option] }]} />
            <Text style={styles.legendLabel}>{option}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function NotesLines({ lines = 4 }: { lines?: number }) {
  return (
    <View style={styles.notesBlock} wrap={false}>
      <Text style={styles.notesTitle}>ANTECKNINGAR</Text>
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={styles.notesLine} />
      ))}
    </View>
  );
}

function PageChrome() {
  return (
    <>
      <View style={styles.runningHead} fixed>
        <Text style={styles.runningHeadLeft}>DITT UNIKA LEDARSKAP</Text>
        <Text style={styles.runningHeadRight}>Feedforward-rapport för tränare</Text>
      </View>
      <View style={styles.footer} fixed>
        <Text>Konfidentiell rapport</Text>
        <Text>LEARN TODAY · COACH TOMORROW</Text>
        <Text
          render={({ pageNumber }) => `Sida ${pageNumber}`}
        />
      </View>
    </>
  );
}

function SummaryBar({
  counts,
  total,
}: {
  counts: Record<AnswerOption, number>;
  total: number;
}) {
  if (total === 0) return null;

  return (
    <View style={styles.summaryBar}>
      {ANSWER_OPTIONS.map((option) => {
        const count = counts[option];
        const pct = (count / total) * 100;
        if (count === 0) return null;
        return (
          <View
            key={option}
            style={[
              styles.summarySegment,
              {
                flexGrow: Math.max(pct, MIN_SEGMENT()),
                backgroundColor: ANSWER_COLORS[option],
              },
            ]}
          >
            {pct >= 6 && (
              <Text
                style={[styles.summarySegmentText, { color: ANSWER_TEXT_COLORS[option] }]}
              >
                {Math.round(pct)}%
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function QuestionBarRow({ question }: { question: QuestionSummary }) {
  return (
    <View style={styles.questionRow}>
      <Text style={styles.questionText}>{question.fragetext}</Text>
      <View style={styles.questionBarWrap}>
        <View style={styles.questionBar}>
          {ANSWER_OPTIONS.map((option) => {
            const count = question.counts[option];
            if (count === 0) return null;
            const pct = question.total > 0 ? (count / question.total) * 100 : 0;
            return (
              <View
                key={option}
                style={[
                  styles.questionSegment,
                  {
                    flexGrow: Math.max(pct, MIN_SEGMENT()),
                    backgroundColor: ANSWER_COLORS[option],
                  },
                ]}
              >
                {pct >= 10 && (
                  <Text
                    style={[
                      styles.questionSegmentText,
                      { color: ANSWER_TEXT_COLORS[option] },
                    ]}
                  >
                    {count}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
        <Text style={styles.questionN}>n={question.total}</Text>
      </View>
    </View>
  );
}

// Tie-break-ordning för "vanligast svarsalternativ": vid oavgjort vinner
// det alternativ som står tidigast i listan. VKEB kan alltså dominera en
// cell (om det faktiskt är vanligast), men förlorar mot ett sakligt svar
// vid oavgjort mot ett enda annat alternativ - och bland de tre
// frekvensalternativen vinner det lägre svaret vid oavgjort.
const DOMINANCE_TIEBREAK_ORDER: AnswerOption[] = [
  "Vill eller kan ej bedöma",
  "Nästan aldrig",
  "Då och då",
  "Nästan alltid",
];

function dominantAnswer(
  counts: Record<AnswerOption, number>
): AnswerOption | null {
  const max = Math.max(...ANSWER_OPTIONS.map((option) => counts[option]));
  if (max === 0) return null;
  return (
    DOMINANCE_TIEBREAK_ORDER.find((option) => counts[option] === max) ?? null
  );
}

export function CoachDimensionReportDocument({
  coachName,
  coachId,
  idrott,
  antalIdrottare,
  antalSvarande,
  reportDate,
  areaReport,
  instrumentStructure,
}: {
  coachName: string | null;
  coachId: string;
  idrott: string | null;
  antalIdrottare: number | null;
  antalSvarande: number;
  reportDate: string;
  areaReport: AreaReport[];
  instrumentStructure: InstrumentAreaStructure[];
}) {
  const svarandeLabel =
    antalIdrottare && antalIdrottare > 0
      ? `${antalSvarande} av ${antalIdrottare} idrottare (${Math.round(
          (antalSvarande / antalIdrottare) * 100
        )}%)`
      : `${antalSvarande} idrottare`;

  // 20+-versionen av DUL samlar inte in område E (Triaden - åldersbegränsade
  // frågor), så det visas inte i rapportens beskrivning av sin egen struktur.
  const visibleInstrumentStructure = instrumentStructure.filter(
    (area) => area.code !== "E"
  );

  return (
    <Document>
      {/* Sida 1: Omslag */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverTopBar} />
        {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML img */}
        <Image src={COVER_HERO_PATH} style={styles.coverHeroImage} />
        <View style={styles.coverHeroBand} />
        <View style={styles.coverHeroBandDark} />
        <View style={styles.coverHeroBand2} />

        <View style={styles.coverBody}>
          <Text style={styles.coverTitle}>Ditt Unika Ledarskap</Text>
          <Text style={styles.coverSubtitle}>FEEDFORWARD-RAPPORT</Text>
          <Text style={styles.coverAgeNote}>FÖR ÅLDERSGRUPPEN 20+ ÅR</Text>

          <View style={styles.coverTable}>
            {[
              ["TRÄNARE", coachName ?? `Tränare ${coachId}`],
              ["IDROTT", idrott ?? "–"],
              ["ANTAL SVAR", svarandeLabel],
              ["RAPPORTDATUM", reportDate],
            ].map(([label, value]) => (
              <View key={label} style={styles.coverRow}>
                <Text style={styles.coverLabelCell}>{label}</Text>
                <Text style={styles.coverValueCell}>{value}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.coverTagline}>LEARN TODAY · COACH TOMORROW</Text>
        </View>

        <Text style={styles.coverFooter}>
          Konfidentiell feedforward-rapport · Ditt Unika Ledarskap
        </Text>
      </Page>

      {/* Sida 2: Om rapporten */}
      <Page size="A4" style={styles.page}>
        <PageChrome />

        <Text style={styles.h1}>Om din rapport</Text>
        <Text style={styles.body}>
          Den här rapporten sammanfattar svaren från idrottarna. Svaren är helt
          anonyma och redovisas endast som grupp. Rapporten är din utgångspunkt för
          att identifiera styrkor och utvecklingsområden i ditt ledarskap.
        </Text>
        <Text style={styles.body}>
          Feedback från idrottarna gör att du kan utveckla de beteenden du anser
          viktiga. Metoden kallas feedforward – rapporten stannar inte vid
          återkoppling, utan börjar där för att ta dig framåt i din utveckling.
        </Text>

        <Text style={styles.h2}>Så läser du resultaten</Text>
        <Text style={styles.body}>
          Varje fråga besvaras med en fyrgradig skala. Andelen i färgförklaringen
          visar hur stor del av svaren som visar respektive beteende.
        </Text>
        <ColorLegend />

        <Text style={styles.h2}>Så är rapporten uppbyggd</Text>
        <Text style={styles.body}>
          Resultatet redovisas i {visibleInstrumentStructure.length} områden. Varje
          område innehåller flera dimensioner, och varje dimension innehåller fyra
          frågor. För varje dimension ser du först en sammanfattande stapel,
          därefter resultatet för var och en av de fyra frågorna.
        </Text>

        {visibleInstrumentStructure.map((area) => (
          <View key={area.code} style={styles.structureRow}>
            <Text style={styles.structureBadge}>{area.code}</Text>
            <Text style={styles.structureName}>{area.name.toUpperCase()}</Text>
            <Text style={styles.structureMeta}>
              {area.dimensionCount} dimensioner · {area.questionCount} frågor
            </Text>
          </View>
        ))}
      </Page>

      {/* Sida 3: Överblick - alla frågor */}
      {areaReport.length > 0 && (
        <Page size="A4" style={styles.page}>
          <PageChrome />
          <Text style={styles.h1}>Överblick – alla frågor</Text>
          <Text style={styles.body}>
            Översikten visar samtliga besvarade frågor. Varje cell färgas efter
            det svarsalternativ som är vanligast för just den frågan (vid
            oavgjort mellan flera alternativ vinner det lägre svaret). Inga
            siffror - använd bilden för att snabbt identifiera mönster.
          </Text>
          <ColorLegend />

          <View style={styles.matrixTable}>
            <View style={styles.matrixHeaderRow}>
              <Text style={styles.matrixHeaderCellDim}>DIMENSION</Text>
              <Text style={styles.matrixHeaderCell}>F1</Text>
              <Text style={styles.matrixHeaderCell}>F2</Text>
              <Text style={styles.matrixHeaderCell}>F3</Text>
              <Text style={styles.matrixHeaderCell}>F4</Text>
            </View>
            {areaReport.flatMap((area) =>
              area.dimensions.map((dimension) => (
                <View key={dimension.code} style={styles.matrixRow}>
                  <Text style={styles.matrixDimCell}>
                    {dimension.code} · {dimension.name}
                  </Text>
                  {[0, 1, 2, 3].map((i) => {
                    const question = dimension.questions[i];
                    const dominant = question
                      ? dominantAnswer(question.counts)
                      : null;
                    const bg = dominant ? ANSWER_COLORS[dominant] : "#EEEEEE";
                    return (
                      <View
                        key={i}
                        style={[styles.matrixValueCell, { backgroundColor: bg }]}
                      />
                    );
                  })}
                </View>
              ))
            )}
          </View>

          <Text style={[styles.body, { marginTop: 12 }]}>
            {/* Platshållartext - ersätts med kundens egen formulering. */}
            Använd överblicken som en helhetsbild: leta efter mönster snarare
            än enskilda avvikelser. Ett område där ett mindre önskvärt svar
            dominerar över flera frågor är ofta mer värt att följa upp än en
            enstaka fråga.
          </Text>

          <NotesLines lines={3} />
        </Page>
      )}

      {/* Ett uppslag per område */}
      {areaReport.map((area) => (
        <Page key={area.code} size="A4" style={styles.page} wrap>
          <PageChrome />

          <View style={styles.areaHeaderRow}>
            <Text style={styles.areaBadge}>{area.code}</Text>
            <View style={styles.areaHeaderText}>
              <Text style={styles.areaName}>{area.name.toUpperCase()}</Text>
              <Text style={styles.areaLabel}>OMRÅDE</Text>
            </View>
          </View>

          <ColorLegend />

          {area.dimensions.map((dimension) => (
            <View key={dimension.code} style={styles.dimensionBlock} wrap={false}>
              <Text style={styles.dimensionTitle}>
                {dimension.code}. {dimension.name}
              </Text>
              <Text style={styles.dimensionSubtitle}>
                Sammanfattning av dimensionens fyra frågor
              </Text>
              <SummaryBar counts={dimension.counts} total={dimension.total} />

              <Text style={styles.introLine}>Hur ofta upplever du att din tränare…</Text>
              {dimension.questions.map((question) => (
                <QuestionBarRow key={question.fragaId} question={question} />
              ))}
            </View>
          ))}

          <NotesLines lines={4} />
        </Page>
      ))}
    </Document>
  );
}

export type { QuestionInfo };
