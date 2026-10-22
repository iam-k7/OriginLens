import type { Metadata } from "next";
import { Instrument_Serif, Inter_Tight, Outfit } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PrivacyBanner } from "@/components/PrivacyBanner";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["500", "600", "700"] });
const instrumentSerif = Instrument_Serif({ variable: "--font-instrument-serif", subsets: ["latin"], weight: "400" });

const DESCRIPTION =
  "Free, privacy-first tools to check if an image is AI-generated, verify Content Credentials (C2PA), view and remove photo metadata, and analyse text.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "OriginLens — Understand where your content comes from", template: "%s · OriginLens" },
  description: DESCRIPTION,
  openGraph: { type: "website", siteName: "OriginLens", title: "OriginLens", description: DESCRIPTION },
  twitter: { card: "summary", title: "OriginLens", description: DESCRIPTION },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${interTight.variable} ${outfit.variable} ${instrumentSerif.variable} h-full antialiased`}>
      {/* Dark frame around every page; pages render light panels inside it. */}
      <body className="flex min-h-full flex-col bg-ink texture-grid-dark p-2 font-sans sm:p-3">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-milk focus:px-3 focus:py-2 focus:text-ink">
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
        <PrivacyBanner />
      </body>
    </html>
  );
}
