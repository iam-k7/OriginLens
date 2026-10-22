import type { Metadata } from "next";

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Free AI Image Checker and Metadata Viewer",
  description:
    "Check if an image is AI-generated, read Content Credentials (C2PA), view EXIF and GPS metadata, and remove it. Free, no sign-up, runs in your browser.",
  alternates: { canonical: "/analyzer" },
};

export default function AnalyzerLayout({ children }: LayoutProps<"/analyzer">) {
  return children;
}
