import type { Metadata } from "next";
import Link from "next/link";

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Free AI Image Checker and Metadata Viewer",
  description:
    "Check if an image is AI-generated, read Content Credentials (C2PA), view EXIF and GPS metadata, and remove it. Free, no sign-up, runs in your browser.",
  alternates: { canonical: "/analyzer" },
};

// Rendered on the server, so search engines and AI assistants can read what the tool does
// (the analyzer itself is built in the browser).
export default function AnalyzerLayout({ children }: LayoutProps<"/analyzer">) {
  return (
    <>
      {children}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6" aria-labelledby="how-it-works">
        <div className="max-w-3xl space-y-3 border-t border-line pt-10 text-sm leading-relaxed text-muted [&_strong]:text-ink">
          <h2 id="how-it-works" className="font-display text-xl font-semibold tracking-tight text-ink">How this AI image checker works</h2>
          <p>
            Add a JPEG, PNG, WEBP or GIF and OriginLens reads what the file itself says. It checks
            <strong> Content Credentials (C2PA)</strong> with the official C2PA library and verifies their signature, looks for
            AI source labels (such as <em>trainedAlgorithmicMedia</em>) and generator names in the metadata, and shows camera,
            software, date and <strong>GPS location</strong> details.
          </p>
          <p>
            <strong>Privacy Clean</strong> removes EXIF, XMP, IPTC, Content Credentials and comments without re-encoding the
            picture, so quality doesn&apos;t change. The optional <strong>pixel check</strong> runs an open AI-image model on your
            device and gives an experimental AI likelihood.
          </p>
          <p>
            Everything runs in your browser; the image is not uploaded. A missing label proves nothing: screenshots and most apps
            strip metadata. Read the full guide:{" "}
            <Link href="/blog/how-to-check-if-an-image-is-ai-generated" className="font-medium text-brand-700 underline underline-offset-2">
              how to check if an image is AI-generated
            </Link>.
          </p>
        </div>
      </section>
    </>
  );
}
