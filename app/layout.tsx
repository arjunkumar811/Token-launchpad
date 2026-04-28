import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { SolanaProvider } from "@/components/solana-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Launchpad Studio",
  description: "Create production-ready Solana SPL tokens from a polished, modern launch interface.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SolanaProvider>{children}</SolanaProvider>
      </body>
    </html>
  );
}
