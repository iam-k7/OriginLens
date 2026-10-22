import Link from "next/link";
import type { ReactNode } from "react";

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO date, shown on the page and in the sitemap
  keywords: string[];
  body: ReactNode;
};

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="font-medium text-brand-700 underline underline-offset-2 hover:text-ink">{children}</Link>
);

export const POSTS: Post[] = [
  {
    slug: "how-to-check-if-an-image-is-ai-generated",
    title: "How to Check If an Image Is AI-Generated: An Honest Guide",
    description:
      "A practical, honest guide to checking whether a photo was made by AI: Content Credentials (C2PA), metadata, reverse image search and visual clues, plus why detectors still get it wrong.",
    date: "2026-10-22",
    keywords: [
      "how to check if an image is AI generated",
      "AI image detector",
      "is this image AI",
      "detect AI generated images",
      "C2PA content credentials",
      "AI image metadata",
    ],
    body: (
      <>
        <p>
          AI image generators now produce pictures that look like real photographs. A fake product photo, a staged news image or
          a too-perfect profile picture can fool most people at a glance. So how do you actually check whether an image was
          made by AI? This guide walks through the methods that work, in the order you should try them, and is honest about
          where each one stops working.
        </p>

        <h2>The short answer</h2>
        <p>
          The most reliable sign is a label the image carries itself: <strong>Content Credentials (C2PA)</strong> or an AI
          &quot;digital source type&quot; in its metadata. When that label is present, you can read exactly which tool created
          the image. When it has been removed, no method can prove an image is AI-made or human-made. You can only collect
          clues.
        </p>

        <h2>1. Look for Content Credentials (C2PA)</h2>
        <p>
          Content Credentials are a signed record inside the image file, defined by the C2PA standard. Adobe, Microsoft,
          OpenAI, Google, camera makers and others back the standard. A record can state that an image was
          &quot;created by a trained algorithm&quot;. It can also name the app that made it and when it was signed.
        </p>
        <p>
          Several popular generators add this record automatically. Images from OpenAI&apos;s ChatGPT and DALL·E, Adobe
          Firefly and Microsoft&apos;s image tools usually carry Content Credentials when you download them directly. LinkedIn
          reads the same record to show its small &quot;CR&quot; label on posts.
        </p>
        <p>
          Because the record is cryptographically signed, a valid signature shows that the record has not been tampered with
          since it was signed. That makes it far stronger evidence than anything you can see in the pixels.
        </p>
        <p>
          <strong>How to check:</strong> open the file in the <A href="/analyzer">OriginLens Image Analyzer</A>. It reads
          Content Credentials with the official C2PA library, right in your browser, and shows the generator, the signer and
          whether the signature is valid. The image is never uploaded to a server.
        </p>

        <h2>2. Check the other metadata</h2>
        <p>Even without Content Credentials, many AI images leave traces in their regular metadata:</p>
        <ul>
          <li>
            <strong>IPTC or XMP &quot;digital source type&quot;</strong>, set to <code>trainedAlgorithmicMedia</code>. This is
            the industry term for AI-generated media.
          </li>
          <li>
            <strong>Software or creator tool fields</strong> that name a generator, such as Midjourney, Stable Diffusion,
            Firefly or DALL·E.
          </li>
          <li>
            <strong>Generation settings inside PNG files.</strong> Stable Diffusion tools often save the full prompt in a
            &quot;parameters&quot; block, and ComfyUI saves its whole workflow.
          </li>
          <li>
            <strong>Camera data</strong> (make, model, exposure, lens). This points towards a real camera, but it is weak
            evidence, because anyone can copy camera data onto a generated image.
          </li>
        </ul>
        <p>
          The OriginLens Image Analyzer checks all of these and lists every signal it finds, with how strong it is, instead of
          hiding them behind a single score.
        </p>

        <h2>3. Understand why the labels often disappear</h2>
        <p>
          This is the part most &quot;AI image detector&quot; articles skip. Metadata, including Content Credentials, is
          easily lost:
        </p>
        <ul>
          <li>Taking a screenshot creates a brand-new file with no history.</li>
          <li>WhatsApp, Telegram, Instagram, X and many other apps strip metadata when you share or upload.</li>
          <li>Converting, compressing or editing in some apps drops it too.</li>
          <li>Some people remove it on purpose.</li>
        </ul>
        <p>
          So if a check finds <em>no</em> AI label, that does <strong>not</strong> mean the image is real. It only means the
          file no longer says how it was made. A good tool tells you this plainly instead of guessing.
        </p>

        <h2>4. Use reverse image search</h2>
        <p>
          When the file itself has nothing to say, search for where the image came from. Google Lens, Bing Visual Search and
          TinEye can find earlier copies of a picture. The original upload may still carry its credentials, or appear on a
          generator&apos;s showcase page, a stock-photo site or a fact-check article. The oldest copy you can find is usually
          the most informative.
        </p>

        <h2>5. Look closely, but don&apos;t trust your eyes too much</h2>
        <p>Older AI images often had tell-tale mistakes, and some still do:</p>
        <ul>
          <li>Hands with the wrong number of fingers, or fingers that merge.</li>
          <li>Text on signs, labels or clothing that turns into gibberish.</li>
          <li>Jewellery, glasses or earrings that don&apos;t match on each side.</li>
          <li>Backgrounds where lines bend, repeat or melt into each other.</li>
          <li>Skin that is unnaturally smooth, with lighting that doesn&apos;t match the scene.</li>
        </ul>
        <p>
          Newer generators make far fewer of these mistakes. A clean-looking image is not proof of a real photo, and a real
          photo can have odd artefacts from editing or compression. Treat visual clues as hints, never as a verdict.
        </p>

        <h2>What about &quot;AI detector&quot; websites?</h2>
        <p>
          Many sites promise to tell you, with a percentage, whether any picture is AI. They work by training a model on
          examples of real and generated images. The problem is that these models learn the generators they were trained on,
          and they struggle with new ones and with ordinary photos that have been compressed or resized.
        </p>
        <p>
          We tested four open-source detectors on a small set of known AI images and real photos. Every one of them either
          missed AI images or labelled real photos as AI, often with over 95% confidence. That is why OriginLens does not show
          an AI percentage: a confident wrong answer about a real person&apos;s photo does more harm than an honest &quot;we
          can&apos;t tell&quot;.
        </p>

        <h2>Step by step: check an image with OriginLens</h2>
        <ol>
          <li>
            Open the <A href="/analyzer">Image Analyzer</A>. It&apos;s free and needs no account.
          </li>
          <li>Drop in the image, ideally the original file rather than a screenshot or a forwarded copy.</li>
          <li>
            Read the result. &quot;The file declares AI generation&quot; means a label says so. With a valid signature it is
            strong evidence. &quot;AI-related indicators&quot; means weaker signs, such as a generator&apos;s name in the
            software field. &quot;No AI markers found&quot; means the file has no label either way.
          </li>
          <li>Open the Provenance tab to see the full Content Credentials, and the Metadata tab for every field in the file.</li>
          <li>If nothing is left in the file, use a reverse image search to look for the original.</li>
        </ol>
        <p>
          The whole check runs in your browser. Your image is not uploaded or stored. You can also use the same page to
          remove location and other metadata from your own photos before you share them.
        </p>

        <h2>Quick checklist</h2>
        <ul>
          <li>Content Credentials say it was AI-generated, with a valid signature: very likely AI.</li>
          <li>Metadata names a generator or an AI source type: likely AI, but metadata can be edited.</li>
          <li>Real camera data and no AI labels: leans towards a camera photo, but it is not proof.</li>
          <li>No metadata at all: unknown. Search for the original and judge the source, not just the picture.</li>
        </ul>

        <h2>Frequently asked questions</h2>
        <h3>Can any tool tell with 100% certainty if an image is AI?</h3>
        <p>
          No. A signed Content Credentials record is the strongest evidence available, but it only exists if the creator&apos;s
          tool added it and nobody removed it. Without it, every method gives clues, not certainty.
        </p>
        <h3>Does a screenshot remove the AI label?</h3>
        <p>
          Yes. A screenshot is a new image file and carries none of the original&apos;s metadata or Content Credentials.
        </p>
        <h3>Is it free to check an image with OriginLens?</h3>
        <p>
          Yes. The <A href="/analyzer">Image Analyzer</A> is free, needs no sign-up and runs entirely in your browser.
        </p>
      </>
    ),
  },
];

export const getPost = (slug: string) => POSTS.find((p) => p.slug === slug);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
