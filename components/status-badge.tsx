import { cn } from "@/lib/utils";

type Tone = "good" | "warn" | "bad" | "neutral";

const TONES: Record<Tone, string> = {
  good: "bg-good-bg text-good-fg",
  warn: "bg-warn-bg text-warn-fg",
  bad: "bg-bad-bg text-bad-fg",
  neutral: "bg-slate-100 text-slate-700",
};

/** A high-contrast pill readable at a glance. Color carries the meaning. */
export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A small colored dot for at-a-glance status in dense lists. */
export function StatusDot({ tone }: { tone: Tone }) {
  const colors: Record<Tone, string> = {
    good: "bg-good",
    warn: "bg-warn",
    bad: "bg-bad",
    neutral: "bg-slate-400",
  };
  return <span className={cn("inline-block h-3 w-3 rounded-full", colors[tone])} />;
}
