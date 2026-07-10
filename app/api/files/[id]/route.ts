import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getDocumentForUser } from "@/lib/data/documents";
import { readFile } from "@/lib/storage";

/**
 * Serves a vehicle document's bytes ONLY to an authorized user (admin, or the
 * driver assigned to that vehicle). Files are never public URLs.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  let doc;
  try {
    doc = await getDocumentForUser(user, id);
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }
  if (!doc) return new NextResponse("Not found", { status: 404 });

  let bytes: Buffer;
  try {
    bytes = await readFile(doc.filePath);
  } catch {
    return new NextResponse("File missing", { status: 404 });
  }

  return new NextResponse(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": doc.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
      // Private cache so the service worker / browser can hold it for offline use.
      "Cache-Control": "private, max-age=86400",
    },
  });
}
