import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { AirtableRecord } from "@/lib/airtable/records";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666666", marginBottom: 24 },
  row: { flexDirection: "row", marginBottom: 6 },
  label: { width: 160, color: "#666666" },
  value: { flex: 1 },
});

/**
 * Grundläggande rapportmall för DUL. Dumpar posten som fält tills vi
 * definierat den riktiga rapportstrukturen tillsammans med kunden.
 */
export function CoachingReportDocument({ record }: { record: AirtableRecord }) {
  const entries = Object.entries(record.fields);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>DUL – Coachingrapport</Text>
        <Text style={styles.subtitle}>Post-ID: {record.id}</Text>

        {entries.length === 0 && <Text>Posten har inga fält.</Text>}

        {entries.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{formatValue(value)}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "–";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
