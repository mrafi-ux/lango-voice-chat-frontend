import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoiceCare - AI-Powered Healthcare Communication",
  description: "Break language barriers in healthcare with AI-powered voice translation. Real-time communication between patients and nurses using premium voice synthesis.",
  keywords: "healthcare, voice translation, AI, medical communication, multilingual",
  authors: [{ name: "VoiceCare Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
