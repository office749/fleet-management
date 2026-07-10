/**
 * Weekly-window math in Mountain Time (America/Denver).
 *
 * The business week runs Monday 00:00 -> Sunday 23:59 Mountain Time. A reading
 * submitted any time in that window counts for that week. We represent a week by
 * its "week start" = the Monday, stored as a date-only value (UTC midnight of
 * that calendar date) so it is timezone-stable in Postgres.
 */

const TZ = "America/Denver";

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

/** Get the Denver calendar date + weekday for a given instant. */
function denverParts(instant: Date): { y: number; m: number; d: number; weekdayIdx: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = fmt.formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    y: Number(get("year")),
    m: Number(get("month")),
    d: Number(get("day")),
    weekdayIdx: WEEKDAY_INDEX[get("weekday")] ?? 0,
  };
}

/** Build a date-only Date (UTC midnight) from calendar parts. */
function utcDate(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

/** The Monday (week start) of the week containing `instant`, in Mountain Time. */
export function weekStartFor(instant: Date = new Date()): Date {
  const { y, m, d, weekdayIdx } = denverParts(instant);
  const base = utcDate(y, m, d);
  base.setUTCDate(base.getUTCDate() - weekdayIdx);
  return base;
}

/** The Monday of the current week (Mountain Time). */
export function currentWeekStart(): Date {
  return weekStartFor(new Date());
}

/** Move a week-start Date back/forward by N weeks. */
export function shiftWeeks(weekStart: Date, weeks: number): Date {
  const next = new Date(weekStart);
  next.setUTCDate(next.getUTCDate() + weeks * 7);
  return next;
}

/** The Sunday (week end) for a given week start. */
export function weekEndFor(weekStart: Date): Date {
  return shiftDays(weekStart, 6);
}

function shiftDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** True if two week-start dates refer to the same week. */
export function sameWeek(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate();
}

/** Format a week start as "Jul 7 – Jul 13" (Mon–Sun). */
export function formatWeekRange(weekStart: Date): string {
  const end = shiftDays(weekStart, 6);
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  };
  return `${weekStart.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

/** "Sunday" deadline label for the current week. */
export function weekDeadlineLabel(weekStart: Date): string {
  const end = shiftDays(weekStart, 6);
  return end.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
