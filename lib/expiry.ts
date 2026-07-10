// Small date helpers for expiry display (safe to use in client components).

export function daysUntil(date: Date): number {
  const today = new Date();
  const a = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const b = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.round((b - a) / 86_400_000);
}

export type ExpiryTone = "good" | "warn" | "bad" | "neutral";

export function expiryTone(date: Date | null | undefined): ExpiryTone {
  if (!date) return "neutral";
  const d = daysUntil(date);
  if (d < 0) return "bad";
  if (d <= 30) return "warn";
  return "good";
}

export function dateLabel(date: Date | null | undefined): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
