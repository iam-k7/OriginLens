"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { LogoMark } from "./Logo";

const FAQS = [
  {
    q: "Do you store my images or text?",
    a: "No. Files and text are processed in memory and discarded once you get your result. We keep only usage records (which tool ran, how long it took) — never the content itself.",
  },
  {
    q: "Can OriginLens tell if an image is AI-generated?",
    a: "It shows the evidence the file carries: Content Credentials (C2PA), IPTC digital-source tags and generator fingerprints. No validated pixel-level detector is integrated, so we never show a made-up probability — and missing metadata proves nothing either way.",
  },
  {
    q: "What does Privacy Clean remove?",
    a: "GPS location, EXIF, XMP, IPTC, Content Credentials and comments from JPEG, PNG and WEBP files. The pixels are copied byte-for-byte and the color profile is kept, so quality doesn't change.",
  },
  {
    q: "Does removing metadata change where an image came from?",
    a: "No. It removes information embedded in the file; it doesn't change the image's true origin. An AI-generated image stays AI-generated.",
  },
  {
    q: "Which files can I upload?",
    a: "JPEG, PNG, WEBP and GIF up to 15 MB. We check the real file signature, not the extension. SVG is rejected because it can carry scripts.",
  },
  {
    q: "Is the text tool an AI detector?",
    a: "No. It measures explainable style signals sentence by sentence. Rewrite Naturally and Deep Scan send your text to our AI providers to produce their result; the standard scan runs on our servers only.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();

  return (
    <section className="panel px-4 py-16 sm:px-10 sm:py-20" aria-labelledby={`${base}-title`}>
      <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[minmax(0,360px)_1fr] lg:gap-16">
      <aside className="relative order-last overflow-hidden rounded-lg bg-ink p-8 text-milk lg:order-none">
        <div className="relative">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-milk shadow-[inset_0_-4px_8px_rgb(120_90_60/0.2)]">
            <LogoMark className="h-8 w-8" />
          </div>
          <h3 className="mt-6 font-display text-2xl font-normal tracking-[-0.035em]">Still have questions?</h3>
          <p className="mt-2 text-sm text-dim">We&apos;re happy to explain how OriginLens handles your files and data.</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row lg:flex-col">
            <a href="mailto:contact@originlens.com" className="btn-primary">Email us</a>
            <Link href="/privacy" className="btn-ghost-dark">Read the privacy policy</Link>
          </div>
        </div>
      </aside>

      <div>
        <p className="eyebrow">FAQ</p>
        <h2 id={`${base}-title`} className="mt-2 font-display text-4xl font-normal tracking-[-0.045em] sm:text-5xl">Looking for answers?</h2>
        <p className="mt-3 max-w-lg text-sm text-muted">How OriginLens reads, cleans and protects your content — in plain words.</p>

        <div className="mt-8 border-t border-line">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="border-b border-line">
                <h3>
                  <button
                    type="button"
                    id={`${base}-q${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`${base}-a${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left text-base font-medium text-ink transition hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                  >
                    {f.q}
                    <svg viewBox="0 0 18 18" className={`h-[18px] w-[18px] shrink-0 transition-transform duration-500 ease-in-out ${isOpen ? "rotate-180" : ""}`} fill="none" aria-hidden="true">
                      <path d="m4.5 7.2 3.793 3.793a1 1 0 0 0 1.414 0L13.5 7.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </h3>
                {/* Grid-rows trick animates height; inert keeps collapsed answers out of tab order and screen readers. */}
                <div
                  id={`${base}-a${i}`}
                  role="region"
                  aria-labelledby={`${base}-q${i}`}
                  inert={!isOpen}
                  className={`grid transition-all duration-500 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-2xl pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </section>
  );
}
