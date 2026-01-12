import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";

import { SessionProvider } from "@/features/auth/SessionProvider";
import { ProfileCompletionGate } from "@/features/onboarding/ProfileCompletionGate";

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "LabTrackSimple",
  description: "LabTrackSimple keeps household lab results clear and organized.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`}>
        <SessionProvider>
          <ProfileCompletionGate>{children}</ProfileCompletionGate>
        </SessionProvider>
      </body>
    </html>
  );
}
