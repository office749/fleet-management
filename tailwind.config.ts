import type { Config } from "tailwindcss";

/**
 * Llewellyn Plumbing brand theme.
 * All brand colors live here (and in app/globals.css as CSS variables).
 * To rebrand, change these values in one place.
 *
 * Brand guide:
 *   Llewellyn Blue  #1B74BB  (primary accent)
 *   Dark Blue       #114B78  (dark backgrounds / headers)
 *   Gray            #808080  (sparingly)
 *   White / Black   text + backgrounds
 * Status colors (functional, reserved for meaning — never decorative):
 *   green  = good        amber = due soon      red = overdue / error
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1B74BB", // Llewellyn Blue
          dark: "#114B78", // Dark Blue
          light: "#4a94cf",
          50: "#eef6fc",
          100: "#d6e9f6",
        },
        ink: "#111111", // near-black body text
        muted: "#808080", // brand gray
        // Functional status palette (accessible on white)
        good: {
          DEFAULT: "#15803d",
          bg: "#dcfce7",
          fg: "#166534",
        },
        warn: {
          DEFAULT: "#b45309",
          bg: "#fef3c7",
          fg: "#92400e",
        },
        bad: {
          DEFAULT: "#b91c1c",
          bg: "#fee2e2",
          fg: "#991b1b",
        },
      },
      fontFamily: {
        // Brand: Arial primary, Georgia for short headlines/callouts.
        sans: ["Arial", "Helvetica", "system-ui", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.1rem",
      },
    },
  },
  plugins: [],
};

export default config;
