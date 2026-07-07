import { NextRequest, NextResponse } from "next/server";
import { getAuditEvents } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const tableSlug = request.nextUrl.searchParams.get("tableSlug") ?? undefined;
  const actorId = request.nextUrl.searchParams.get("actorId") ?? undefined;
  const limitParam = request.nextUrl.searchParams.get("limit");
  const offsetParam = request.nextUrl.searchParams.get("offset");
  const limit = limitParam ? Number(limitParam) : undefined;
  const offset = offsetParam ? Number(offsetParam) : undefined;

  const result = await getAuditEvents({
    tableSlug,
    actorId,
    limit: limit !== undefined && Number.isFinite(limit) ? limit : undefined,
    offset: offset !== undefined && Number.isFinite(offset) ? offset : undefined,
  });

  return NextResponse.json(result);
}
