import localFont from "next/font/local";

export const bodyFont = localFont({
  src: "../../assets/fonts/inter-latin-ext-variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  style: "normal",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["Arial", "sans-serif"],
  preload: true,
});

export const headingFont = localFont({
  src: [
    { path: "../../assets/fonts/fraunces-latin-ext-variable.woff2", weight: "100 900", style: "normal" },
    { path: "../../assets/fonts/fraunces-latin-ext-italic-variable.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-fraunces",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "serif"],
  // Body is critical; display faces are fetched only when a heading uses them.
  preload: false,
});
