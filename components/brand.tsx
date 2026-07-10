import { cn } from "@/lib/utils";

/**
 * Llewellyn Plumbing wordmark. This is a typographic placeholder that follows
 * the brand guide (Georgia "Llewellyn" + bold "PLUMBING", Llewellyn Blue).
 * To use the official logo, drop the file at /public/logo.svg (or .png) and
 * swap the markup below for an <img src="/logo.svg" />.
 */
export function Wordmark({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-1 select-none", className)}>
      <span
        className={cn(
          "font-serif text-xl leading-none",
          onDark ? "text-white" : "text-brand",
        )}
      >
        Llewellyn
      </span>
      <span
        className={cn(
          "font-sans text-xl font-extrabold tracking-tight leading-none",
          onDark ? "text-white" : "text-brand-dark",
        )}
      >
        FLEET
      </span>
    </span>
  );
}
