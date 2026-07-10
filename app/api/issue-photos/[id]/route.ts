import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { readFile } from "@/lib/storage";

/** Serves a driver-reported issue photo to an admin or the reporting driver. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const issue = await prisma.issue.findUnique({ where: { id } });
  if (!issue?.photoPath) return new NextResponse("Not found", { status: 404 });
  if (user.role !== "admin" && issue.reportedById !== user.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let bytes: Buffer;
  try {
    bytes = await readFile(issue.photoPath);
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
