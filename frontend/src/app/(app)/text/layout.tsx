import type { Metadata } from "next";

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Text and Blog Intelligence",
  description: "Explainable writing style signals, sentence by sentence, and a rewrite that keeps your meaning. Your text is not stored.",
  alternates: { canonical: "/text" },
};

export default function TextLayout({ children }: LayoutProps<"/text">) {
  return children;
}
