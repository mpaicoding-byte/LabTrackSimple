import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

import { SessionProvider } from "@/features/auth/SessionProvider";
import { ProfileCompletionGate } from "@/features/onboarding/ProfileCompletionGate";

const bodyFont = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
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
      <body className={`${bodyFont.variable} font-sans antialiased`} suppressHydrationWarning>
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
