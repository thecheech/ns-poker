import { NextRequest, NextResponse } from "next/server";
import { getAuditEvents } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const tableSlug = request.nextUrl.searchParams.get("tableSlug") ?? undefined;
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 100;

  const events = await getAuditEvents({
    tableSlug,
    limit: Number.isFinite(limit) ? limit : 100,
  });

  return NextResponse.json(events);
}
