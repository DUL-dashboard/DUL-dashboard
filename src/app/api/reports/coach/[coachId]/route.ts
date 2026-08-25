import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import {
  TRANARE_TABLE,
  fetchFragorById,
  fetchSvarForCoach,
  summarizeByDimension,
} from "@/lib/airtable/dul";
import { fetchRecords } from "@/lib/airtable/records";
import { CoachDimensionReportDocument } from "@/lib/pdf/CoachDimensionReportDocument";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ coachId: string }> }
) {
  const { coachId } = await params;

  try {
    const [fragorById, svarRows, tranareRows] = await Promise.all([
      fetchFragorById(),
      fetchSvarForCoach(coachId),
      fetchRecords(TRANARE_TABLE, 100),
    ]);

    const coach = tranareRows.find(
      (row) => String(row.fields["Coach_ID"] ?? "") === coachId
    );
    const coachName = coach ? String(coach.fields["Namn"]) : null;
    const summaries = summarizeByDimension(svarRows, fragorById);

    const pdfBuffer = await renderToBuffer(
      CoachDimensionReportDocument({
        coachName,
        coachId,
        summaries,
        totalAnswers: svarRows.length,
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
