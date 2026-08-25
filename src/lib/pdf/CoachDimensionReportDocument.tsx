import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { ANSWER_OPTIONS, type DimensionSummary } from "@/lib/airtable/dul";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666666", marginBottom: 24 },
  table: { borderTop: "1px solid #cccccc", borderLeft: "1px solid #cccccc" },
  headerRow: { flexDirection: "row", backgroundColor: "#f3f4f6" },
  row: { flexDirection: "row" },
  totalRow: { flexDirection: "row", backgroundColor: "#f3f4f6" },
  cell: {
    flex: 1,
    padding: 6,
    borderRight: "1px solid #cccccc",
    borderBottom: "1px solid #cccccc",
  },
  dimensionCell: {
    flex: 2,
    padding: 6,
    borderRight: "1px solid #cccccc",
    borderBottom: "1px solid #cccccc",
  },
  headerText: { fontWeight: 700 },
  totalText: { fontWeight: 700 },
});

export function CoachDimensionReportDocument({
  coachName,
  coachId,
  summaries,
  totalAnswers,
}: {
  coachName: string | null;
  coachId: string;
  summaries: DimensionSummary[];
  totalAnswers: number;
}) {
  const totals = ANSWER_OPTIONS.reduce(
    (acc, option) => {
      acc[option] = summaries.reduce(
        (sum, s) => sum + s.counts[option],
        0
      );
      return acc;
    },
    {} as Record<(typeof ANSWER_OPTIONS)[number], number>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>DUL – Coachingrapport</Text>
        <Text style={styles.subtitle}>
          {coachName ?? `Tränare ${coachId}`} · Coach_ID: {coachId} ·{" "}
          {totalAnswers} svar registrerade
        </Text>

        {summaries.length === 0 ? (
          <Text>Inga svar registrerade för denna tränare ännu.</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.headerRow}>
              <Text style={[styles.dimensionCell, styles.headerText]}>
                Dimension
              </Text>
              {ANSWER_OPTIONS.map((option) => (
                <Text key={option} style={[styles.cell, styles.headerText]}>
                  {option}
                </Text>
              ))}
              <Text style={[styles.cell, styles.headerText]}>Totalt</Text>
            </View>

            {summaries.map((summary) => (
              <View key={summary.dimension} style={styles.row}>
                <Text style={styles.dimensionCell}>{summary.dimension}</Text>
                {ANSWER_OPTIONS.map((option) => (
                  <Text key={option} style={styles.cell}>
                    {summary.counts[option]}
                  </Text>
                ))}
                <Text style={styles.cell}>{summary.total}</Text>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={[styles.dimensionCell, styles.totalText]}>
                Totalt
              </Text>
              {ANSWER_OPTIONS.map((option) => (
                <Text key={option} style={[styles.cell, styles.totalText]}>
                  {totals[option]}
                </Text>
              ))}
              <Text style={[styles.cell, styles.totalText]}>
                {totalAnswers}
              </Text>
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
