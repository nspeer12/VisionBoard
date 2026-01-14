import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VisionBoard — Dream. Plan. Manifest.",
  description: "A guided vision board experience that transforms your aspirations into vivid visuals and actionable plans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-cream text-charcoal antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
