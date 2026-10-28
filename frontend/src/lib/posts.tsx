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
    slug: "ai-text-humanizer-and-writing-analyzer",
    title: "AI Text Humanizer and Writing Analyzer: How It Works",
    description:
      "How the OriginLens text tool reads your writing sentence by sentence, what each signal means, and how to humanize AI-sounding text so it reads naturally.",
    date: "2026-10-28",
    keywords: [
      "AI text humanizer",
      "humanize AI text",
      "make AI text sound human",
      "writing analyzer",
      "rewrite AI text naturally",
      "AI writing style checker",
    ],
    body: (
      <>
        <p>
          You asked an AI assistant for a draft, and it came back stiff: every sentence the same length, a
          &quot;Furthermore&quot; in every paragraph, and phrases nobody says out loud. Or you wrote it yourself and it
          still sounds like a template. The <A href="/text">OriginLens Text and Blog Intelligence</A> tool shows you
          exactly why a piece of writing reads that way, and rewrites it so it sounds like a person.
        </p>
        <p>This guide explains what the tool measures, how the rewrite and humanizer work, and how to get the best results.</p>

        <h2>What the tool does</h2>
        <p>It has two parts, shown as two tabs:</p>
        <ul>
          <li><strong>Analyze</strong> measures the style of your text and flags sentences worth a second look.</li>
          <li><strong>Rewrite Naturally</strong> rewrites the text in a tone you choose, including a <strong>Humanize</strong> option for text that sounds machine-written.</li>
        </ul>
        <p>
          One thing it does <strong>not</strong> do is tell you whether a human or an AI wrote the text. No tool can do
          that reliably. Style patterns are evidence about <em>how</em> something is written, not proof of
          <em>who</em> wrote it, and many careful human writers use the same patterns. So you will never see an
          &quot;AI score&quot; here.
        </p>

        <h2>How Analyze works</h2>
        <p>
          The <strong>Standard Scan</strong> runs entirely in your browser. Your text is not sent anywhere. It splits the
          text into sentences and measures four style signals:
        </p>
        <ul>
          <li>
            <strong>Sentence length variation.</strong> People naturally mix short sentences with long ones. When almost
            every sentence is the same length, writing feels flat. This is common in templated and machine-generated
            text, and in some formal writing.
          </li>
          <li>
            <strong>Vocabulary diversity.</strong> The share of words that are unique. Very repetitive vocabulary makes text
            feel padded. This number naturally drops as text gets longer, so the tool only flags it on longer pieces.
          </li>
          <li>
            <strong>Stock phrases.</strong> Phrases that are over-used in assistant-style writing, such as &quot;delve&quot;,
            &quot;it is important to note&quot;, &quot;in today&apos;s fast-paced world&quot;, &quot;furthermore&quot; and
            &quot;a testament to&quot;. One is fine. Several in a short text is a pattern readers notice.
          </li>
          <li>
            <strong>Repeated sentence openers.</strong> Starting three or more sentences with the same word (&quot;This…&quot;,
            &quot;Additionally…&quot;) breaks the flow.
          </li>
        </ul>
        <p>
          You also get a reading-ease score, word and sentence counts and reading time. Each sentence is listed with
          flags like <em>very long</em>, <em>stock phrase</em> or <em>near-average length</em>, so you know exactly
          where to edit.
        </p>
        <p>
          <strong>Deep Scan</strong> adds a short style review written by an AI model: observations about repetition,
          generic phrasing, hedging and voice, plus notes on specific sentences and concrete suggestions. It is an
          opinion about style, and the tool labels it that way.
        </p>

        <h2>How Rewrite Naturally works</h2>
        <p>Pick a tone and press Rewrite. The AI model rewrites your text for clarity and flow while keeping your facts, names, numbers and meaning, without adding new claims. The tones are:</p>
        <ul>
          <li><strong>Neutral</strong>: clear and plain.</li>
          <li><strong>Friendly</strong>: warm and conversational.</li>
          <li><strong>Formal</strong>: professional.</li>
          <li><strong>Concise</strong>: shorter and more direct.</li>
          <li><strong>Academic</strong>: precise.</li>
          <li><strong>Humanize</strong>: for text that sounds machine-written (explained below).</li>
        </ul>

        <h2>How the Humanize option works</h2>
        <p>
          Most &quot;AI humanizers&quot; just swap words for synonyms, which often makes text worse. OriginLens uses a
          two-step method based on the open-source humanize-text project:
        </p>
        <ol>
          <li>
            The AI model rewrites your text <strong>into Chinese</strong>, the way a person would naturally say it,
            with more varied rhythm and fewer stock phrases. Moving into a very different language forces the sentence
            structure to be rebuilt, not just reworded.
          </li>
          <li>
            The model then rewrites that draft <strong>back into your original language</strong>. In this step it also
            sees your original text and is told to keep its meaning exactly, with no added claims or exaggeration.
          </li>
        </ol>
        <p>
          That second check matters. When we tested the original humanizer method, it sometimes added ideas that were
          not in the source, like turning &quot;verification tools are needed&quot; into &quot;nobody can trust
          anything&quot;. Showing the model the original stops that drift.
        </p>
        <p>Here is a real example:</p>
        <blockquote className="border-l-4 border-brand-300 pl-4">
          <p><strong>Before:</strong> &quot;Artificial intelligence has fundamentally transformed the way content is created and consumed. It is important to note that AI-generated images are now widespread, making it increasingly difficult for individuals to distinguish authentic photographs from synthetic ones. Furthermore, this trend underscores the critical need for robust verification tools.&quot;</p>
          <p><strong>After Humanize:</strong> &quot;Artificial intelligence has fundamentally reshaped how content is made and consumed. AI-generated images are now everywhere, blurring the line between real photographs and synthetic ones. That shift makes reliable verification tools more essential than ever.&quot;</p>
        </blockquote>
        <p>
          Same facts, fewer filler phrases (&quot;it is important to note&quot;, &quot;furthermore&quot;), more natural
          rhythm. Humanize takes about 15 to 25 seconds, because it makes two passes.
        </p>

        <h2>Step by step: improve a piece of writing</h2>
        <ol>
          <li>Open <A href="/text">Text and Blog Intelligence</A> and paste your text, or upload a .txt file (up to 20,000 characters).</li>
          <li>On the <strong>Analyze</strong> tab, run a Standard Scan. Note the sentences flagged as <em>stock phrase</em> or <em>very long</em>, and whether sentence lengths are too uniform.</li>
          <li>For a second opinion on voice and tone, tick <strong>Deep Scan</strong> and run it again.</li>
          <li>Switch to <strong>Rewrite Naturally</strong>, choose a tone (or <strong>Humanize</strong> for AI-sounding drafts), and press Rewrite.</li>
          <li>Read the result carefully, check every fact, name and number, and copy it. Then run Analyze on the new version to compare.</li>
        </ol>
        <p>
          The rewrite is a strong first draft, not a finished one. The best results come from keeping what works,
          editing what doesn&apos;t, and adding details only you know. Specific examples and your own opinions are what
          make writing sound like you.
        </p>

        <h2>Tips for text that sounds human</h2>
        <ul>
          <li>Mix sentence lengths. Follow a long explanation with a short point.</li>
          <li>Cut transition words that do nothing. Most &quot;furthermore&quot; and &quot;moreover&quot; can simply go.</li>
          <li>Replace general claims with specifics: a number, a name, an example.</li>
          <li>Say it the way you would explain it to a colleague, then tidy it up.</li>
          <li>Read it out loud. Anywhere you stumble needs another pass.</li>
        </ul>

        <h2>Privacy and limits</h2>
        <ul>
          <li>The Standard Scan runs in your browser and nothing is sent anywhere.</li>
          <li>Rewrite, Humanize and Deep Scan send your text to our AI provider (NVIDIA) to produce the result. We do not store your text.</li>
          <li>Without an account you get one free text check per day. With a free account, analysis is unlimited and you get 10 AI rewrites or Deep Scans per day.</li>
        </ul>

        <h2>Use it honestly</h2>
        <p>
          Humanizing makes writing easier to read. It does not change who wrote it. If your school, employer or
          publisher requires you to disclose AI help, a rewrite doesn&apos;t change that. We also make no promise about
          how any AI detector will score the result; those tools disagree with each other and are often wrong.
        </p>

        <h2>Frequently asked questions</h2>
        <h3>Can this tool tell if text was written by AI?</h3>
        <p>
          No, and we don&apos;t pretend to. It measures style patterns that are common in AI-assisted writing but also
          appear in human writing. Use them to edit, not to judge who wrote something.
        </p>
        <h3>Will Humanize change my meaning?</h3>
        <p>
          It is designed not to: the second step checks against your original and is told not to add claims. Still,
          always read the result and check facts, names and numbers before you use it.
        </p>
        <h3>Is it free?</h3>
        <p>
          Yes. You can try one text check a day without an account. A free account gives you unlimited analysis and 10
          AI rewrites per day. <A href="/signup">Sign up free</A>.
        </p>
      </>
    ),
  },
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
