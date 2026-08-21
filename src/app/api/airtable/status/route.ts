import { NextResponse } from "next/server";
import { getAirtableConfigStatus } from "@/lib/airtable/config";
import { checkAirtableConnection } from "@/lib/airtable/records";

export async function GET() {
  const configStatus = getAirtableConfigStatus();

  if (!configStatus.isConfigured) {
    return NextResponse.json(
      {
        connected: false,
        error: `Saknar miljövariabler: ${configStatus.missing.join(", ")}`,
      },
      { status: 200 }
    );
  }

  const result = await checkAirtableConnection();
  return NextResponse.json(result, { status: 200 });
}
