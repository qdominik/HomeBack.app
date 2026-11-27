import type { Metadata } from "next";
import { bodyFont, headingFont } from "@/lib/ui/fonts";
import { appearanceBootstrap } from "@/lib/ui/daylight-bootstrap";
import { loadInitialAtmosphere } from "@/lib/weather/server";
import { defaultPreferences, type Atmosphere } from "@/lib/weather/contracts";
import { AppearanceProvider } from "@/components/rhythm/appearance";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HomeBack.app",
    template: "%s | HomeBack.app",
  },
  description: "Domowa baza rzeczy, dokumentow i lokalizacji.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initial: Atmosphere = { renderedAt: 0, userId: "", preferences: {...defaultPreferences}, location: null, canEditLocation: false, weather: { status: "no_location", snapshot: null }, preferencesAvailable: false };
  try { initial = await loadInitialAtmosphere(); } catch { /* neutral fallback */ }
  return (
    <html suppressHydrationWarning lang="pl" className={`${bodyFont.variable} ${headingFont.variable} h-full antialiased`}>
      <head><script dangerouslySetInnerHTML={{ __html: appearanceBootstrap(initial.preferences.mode, initial.preferences.motion) }} /></head>
      <body className="min-h-full flex flex-col"><AppearanceProvider key={initial.userId} initial={initial}>{children}</AppearanceProvider></body>
    </html>
  );
}
