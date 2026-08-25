import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import {
  TRANARE_TABLE,
  buildAreaReport,
  countTallySubmissionsForCoach,
  fetchFragorById,
  fetchSvarForCoach,
  summarizeInstrumentStructure,
} from "@/lib/airtable/dul";
import { fetchRecords } from "@/lib/airtable/records";
import { CoachDimensionReportDocument } from "@/lib/pdf/CoachDimensionReportDocument";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ coachId: string }> }
) {
  const { coachId } = await params;

  try {
    const [fragorById, svarRows, tranareRows, antalSvarande] = await Promise.all([
      fetchFragorById(),
      fetchSvarForCoach(coachId),
      fetchRecords(TRANARE_TABLE, 100),
      countTallySubmissionsForCoach(coachId),
    ]);

    const coach = tranareRows.find(
      (row) => String(row.fields["Coach_ID"] ?? "") === coachId
    );
    const coachName = coach ? String(coach.fields["Namn"]) : null;
    const idrott = coach ? String(coach.fields["Idrott"] ?? "") || null : null;
    const antalIdrottare = coach
      ? Number(coach.fields["Antal idrottare"]) || null
      : null;

    const areaReport = buildAreaReport(svarRows, fragorById);
    const instrumentStructure = summarizeInstrumentStructure(fragorById);
    const reportDate = new Date().toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const pdfBuffer = await renderToBuffer(
      CoachDimensionReportDocument({
        coachName,
        coachId,
        idrott,
        antalIdrottare,
        antalSvarande,
        reportDate,
        areaReport,
        instrumentStructure,
      })
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="dul-rapport-${coachId}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Okänt fel" },
      { status: 500 }
    );
  }
}
