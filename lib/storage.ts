import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";

/**
 * File storage on the Railway persistent volume. Files are written under
 * FILE_STORAGE_DIR (e.g. /data on Railway, ./storage locally) and are ONLY
 * served back through authenticated routes — never as public URLs.
 */
const ROOT = process.env.FILE_STORAGE_DIR || "./storage";

export type FileCategory = "documents" | "receipts" | "issues";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

export function isAllowedUpload(mime: string, size: number): string | null {
  if (!ALLOWED_MIME.has(mime)) return "Only PDF or image files are allowed.";
  if (size > MAX_BYTES) return "File is too large (15 MB max).";
  if (size === 0) return "That file appears to be empty.";
  return null;
}

/** Persist a file and return its stored relative path + display name. */
export async function saveFile(
  category: FileCategory,
  originalName: string,
  data: Buffer,
): Promise<{ filePath: string; fileName: string }> {
  const dir = path.join(ROOT, category);
  await fs.mkdir(dir, { recursive: true });
  const safe = sanitize(originalName) || "file";
  const unique = `${Date.now()}-${randomBytes(6).toString("hex")}-${safe}`;
  const abs = path.join(dir, unique);
  await fs.writeFile(abs, data);
  // Store a path relative to ROOT so the volume can move without breaking refs.
  return { filePath: path.join(category, unique), fileName: originalName };
}

/** Read a stored file's bytes. Guards against path traversal. */
export async function readFile(relPath: string): Promise<Buffer> {
  const abs = path.resolve(ROOT, relPath);
  const rootAbs = path.resolve(ROOT);
  if (!abs.startsWith(rootAbs + path.sep)) {
    throw new Error("Invalid file path.");
  }
  return fs.readFile(abs);
}

export async function deleteFile(relPath: string): Promise<void> {
  try {
    const abs = path.resolve(ROOT, relPath);
    const rootAbs = path.resolve(ROOT);
    if (!abs.startsWith(rootAbs + path.sep)) return;
    await fs.unlink(abs);
  } catch {
    // ignore missing files
  }
}
