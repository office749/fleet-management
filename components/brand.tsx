import fs from "fs";
import path from "path";
import { cn } from "@/lib/utils";

/**
 * Brand mark. If a logo image is present in /public it is used automatically;
 * otherwise we fall back to a typographic wordmark that follows the brand guide.
 *
 * To use the official logo, drop a file in /public named:
 *   logo.png / logo.svg / logo.webp        -> used on light backgrounds
 *   logo-dark.png / logo-dark.svg / ...     -> used on dark backgrounds (login)
 * (a light/white version reads better on the dark login screen).
 */
function findLogo(names: string[]): string | null {
  for (const n of names) {
    if (fs.existsSync(path.join(process.cwd(), "public", n))) return "/" + n;
  }
  return null;
}

const LIGHT_LOGO = findLogo(["logo.svg", "logo.png", "logo.webp", "logo.jpg"]);
const DARK_LOGO = findLogo([
  "logo-dark.svg",
  "logo-dark.png",
  "logo-dark.webp",
  "logo-dark.jpg",
]);

export function Wordmark({
  className,
  onDark = false,
  large = false,
}: {
  className?: string;
  onDark?: boolean;
  large?: boolean;
}) {
  const logo = onDark ? DARK_LOGO ?? LIGHT_LOGO : LIGHT_LOGO;

  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt="Llewellyn Plumbing"
        className={cn(large ? "h-14 w-auto" : "h-9 w-auto", className)}
      />
    );
  }

  // Fallback wordmark (Georgia "Llewellyn" + bold "FLEET").
  return (
    <span className={cn("inline-flex items-baseline gap-1 select-none", className)}>
      <span
        className={cn(
          large ? "text-2xl" : "text-xl",
          "font-serif leading-none",
          onDark ? "text-white" : "text-brand",
        )}
      >
        Llewellyn
      </span>
      <span
        className={cn(
          large ? "text-2xl" : "text-xl",
          "font-sans font-extrabold tracking-tight leading-none",
          onDark ? "text-white" : "text-brand-dark",
        )}
      >
        FLEET
      </span>
    </span>
  );
}
