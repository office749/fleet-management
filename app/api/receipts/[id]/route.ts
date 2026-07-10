import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { readFile } from "@/lib/storage";

/** Serves a service-record receipt. ADMIN ONLY (receipts are financial). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { id } = await params;
  const record = await prisma.serviceRecord.findUnique({ where: { id } });
  if (!record?.receiptPath) return new NextResponse("Not found", { status: 404 });

  let bytes: Buffer;
  try {
    bytes = await readFile(record.receiptPath);
  } catch {
    return new NextResponse("File missing", { status: 404 });
  }
  return new NextResponse(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
