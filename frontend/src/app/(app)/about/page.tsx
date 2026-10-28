import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About OriginLens",
  description:
    "OriginLens is a free web tool that shows where images and text come from: AI labels, Content Credentials (C2PA), hidden metadata, and writing style.",
  alternates: { canonical: "/about" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  url: `${SITE_URL}/about`,
  name: "About OriginLens",
  about: { "@id": `${SITE_URL}/#org` },
};

const LINK = "font-medium text-brand-700 underline underline-offset-2 hover:text-ink";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <p className="eyebrow">About</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">About OriginLens</h1>
      <div className="mt-6 space-y-4 text-[1.02rem] leading-relaxed text-muted [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-ink [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        <p>
          <strong>OriginLens</strong> is a free website, at www.originlens.bond, that shows where an image or a piece
          of text comes from. It reads the evidence a file carries, explains what that evidence does and doesn&apos;t
          prove, and lets you remove private details before you share.
        </p>

        <h2>What it does</h2>
        <ul>
          <li><strong>Checks images for AI labels.</strong> It reads Content Credentials (C2PA) with the official C2PA library, checks their signature, and looks for AI source labels and generator names in the file&apos;s metadata.</li>
          <li><strong>Shows hidden photo metadata</strong>, such as camera, editing software, dates and GPS location.</li>
          <li><strong>Removes metadata without re-encoding</strong> (Privacy Clean), so image quality doesn&apos;t change.</li>
          <li><strong>Runs an experimental pixel check</strong> with an open AI-image model (Community Forensics), on your own device.</li>
          <li><strong>Analyses and rewrites text</strong>: style signals sentence by sentence, an AI style review, and rewriting in five tones plus a Humanize option.</li>
        </ul>

        <h2>What it won&apos;t pretend to do</h2>
        <p>
          No tool can prove with certainty whether an image or text was made by AI. OriginLens shows the evidence it
          finds, says plainly when there is none, and labels its pixel check as experimental. It never shows an
          &quot;AI score&quot; for text, because style alone can&apos;t tell who wrote something.
        </p>

        <h2>Privacy by design</h2>
        <p>
          Image checks run in your browser, so your images are not uploaded. Text you send to Rewrite or Deep Scan goes
          to our AI provider to produce the result and is not stored by us. Details are in the{" "}
          <Link href="/privacy" className={LINK}>Privacy Policy</Link>.
        </p>

        <h2>Not to be confused with</h2>
        <p>
          OriginLens (www.originlens.bond) is not affiliated with the &quot;Origin Lens&quot; iOS app or the
          &quot;Origin Lens&quot; research paper on arXiv. They are separate projects with a similar name.
        </p>

        <h2>Try it</h2>
        <p>
          Start with the <Link href="/analyzer" className={LINK}>Image Analyzer</Link> or{" "}
          <Link href="/text" className={LINK}>Text and Blog Intelligence</Link>, or read our guide on{" "}
          <Link href="/blog/how-to-check-if-an-image-is-ai-generated" className={LINK}>how to check if an image is AI-generated</Link>.
          It&apos;s free: one image check and one text check a day without an account, and unlimited with a free account.
        </p>
      </div>
    </div>
  );
}
