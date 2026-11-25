import type { Metadata } from "next";
import { bodyFont, headingFont } from "@/lib/ui/fonts";
import { daylightBootstrap } from "@/lib/ui/daylight-bootstrap";
import { RhythmClock } from "@/components/rhythm/clock";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="pl" className={`${bodyFont.variable} ${headingFont.variable} h-full antialiased`}>
      <head><script dangerouslySetInnerHTML={{ __html: daylightBootstrap }} /></head>
      <body className="min-h-full flex flex-col"><RhythmClock>{children}</RhythmClock></body>
    </html>
  );
}
