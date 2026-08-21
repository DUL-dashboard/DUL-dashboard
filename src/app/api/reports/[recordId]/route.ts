import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { airtableConfig } from "@/lib/airtable/config";
import { fetchRecordById } from "@/lib/airtable/records";
import { CoachingReportDocument } from "@/lib/pdf/CoachingReportDocument";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ recordId: string }> }
) {
  const { recordId } = await params;

  try {
    const record = await fetchRecordById(airtableConfig.defaultTable, recordId);
    const pdfBuffer = await renderToBuffer(
      CoachingReportDocument({ record })
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="dul-rapport-${recordId}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Okänt fel" },
      { status: 500 }
    );
  }
}
