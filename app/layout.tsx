import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

import { SessionProvider } from "@/features/auth/SessionProvider";
import { ProfileCompletionGate } from "@/features/onboarding/ProfileCompletionGate";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`} suppressHydrationWarning>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <ProfileCompletionGate>{children}</ProfileCompletionGate>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
