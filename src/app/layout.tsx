import type { Metadata } from "next";
import "./Globals.css";

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
    <html lang="pl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
