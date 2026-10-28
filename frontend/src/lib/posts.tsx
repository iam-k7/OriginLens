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
    slug: "check-chatgpt-gemini-images",
    title: "Was It Made by ChatGPT or Gemini? How to Check an Image",
    description:
      "How to check if an image came from ChatGPT, Gemini or other Google AI: Content Credentials, the SynthID watermark, and the free tools that read them.",
    date: "2026-10-28",
    keywords: [
      "check if image is ai generated gemini",
      "check if image is ai generated chatgpt",
      "check if image is ai generated openai",
      "ai image checker google",
      "synthid detector",
      "synthid checker",
    ],
    body: (
      <>
        <p>
          ChatGPT and Google&apos;s Gemini are two of the most-used image generators, and both now label what they make.
          That means you can often check an image&apos;s origin for certain, as long as you use the right tool and the
          label hasn&apos;t been stripped. Here is how each label works and how to check it.
        </p>

        <h2>Two kinds of label</h2>
        <ul>
          <li>
            <strong>Content Credentials (C2PA):</strong> a signed record inside the file that says which tool made it
            and that AI was used. Any C2PA reader can check it, but screenshots, re-saves and many apps remove it.
          </li>
          <li>
            <strong>SynthID:</strong> an invisible watermark woven into the pixels, created by Google DeepMind. It is
            designed to survive common changes like compression and screenshots, but only the maker&apos;s own tools can
            check for it.
          </li>
        </ul>

        <h2>Images from ChatGPT (OpenAI)</h2>
        <p>
          OpenAI has added Content Credentials to images from its image tools for some time. In May 2026 it announced
          it would also add the SynthID watermark, and it launched a public checker at <strong>openai.com/verify</strong>
          {" "}that looks for both signals in images from ChatGPT, the OpenAI API and Codex.
        </p>
        <ul>
          <li><strong>To check the Content Credentials:</strong> add the image to the <A href="/analyzer">OriginLens Image Analyzer</A>. If the record is there, the File labels card says the file declares AI generation, and the Provenance tab shows OpenAI as the tool.</li>
          <li><strong>To check the watermark:</strong> use OpenAI&apos;s own verifier. Watermarks can&apos;t be read by other tools.</li>
        </ul>

        <h2>Images from Gemini and other Google AI</h2>
        <p>
          Images made or edited with Google&apos;s AI models carry a SynthID watermark. Google has also started adding
          Content Credentials to images from its newer image models (the Nano Banana family) in the Gemini app and some
          of its other products.
        </p>
        <ul>
          <li>
            <strong>To check the watermark:</strong> open the Gemini app or gemini.google.com, attach the image, and ask
            &quot;Was this created or edited with Google AI?&quot;. If Gemini finds SynthID, all or part of the image was
            made or edited with Google AI. Use one image at a time; if you use a screenshot, crop it tightly.
          </li>
          <li>
            <strong>To check the Content Credentials:</strong> add the image to the <A href="/analyzer">OriginLens Image
            Analyzer</A>. Google often records the AI step in an earlier layer of the record (for example, &quot;created
            with Google Generative AI&quot;, then a watermark added on top). OriginLens reads every layer, so it still
            finds the AI label.
          </li>
        </ul>
        <p>
          A real example: a portrait edited with Google&apos;s AI that we tested had two signed layers from Google. The
          latest said only &quot;added visible watermark&quot;; the earlier one recorded the AI step as{" "}
          <code>trainedAlgorithmicMedia</code>, the industry term for AI-generated media. A checker that reads only the
          latest layer would have missed it.
        </p>

        <h2>Which check to use</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink"><th className="py-2 pr-4">Image from</th><th className="py-2 pr-4">Content Credentials</th><th className="py-2">Watermark</th></tr>
            </thead>
            <tbody>
              <tr className="border-b border-line"><td className="py-2 pr-4">ChatGPT / OpenAI</td><td className="py-2 pr-4">OriginLens or any C2PA reader</td><td className="py-2">openai.com/verify</td></tr>
              <tr className="border-b border-line"><td className="py-2 pr-4">Gemini / Google AI</td><td className="py-2 pr-4">OriginLens or any C2PA reader</td><td className="py-2">Gemini app (SynthID)</td></tr>
              <tr><td className="py-2 pr-4">Unknown source</td><td className="py-2 pr-4">Start with OriginLens</td><td className="py-2">Try both makers&apos; checkers</td></tr>
            </tbody>
          </table>
        </div>

        <h2>What a &quot;no&quot; really means</h2>
        <p>
          These checks are reliable when they find something. When they find nothing, they prove much less:
        </p>
        <ul>
          <li>OpenAI&apos;s checker can only tell you about OpenAI&apos;s images, and Gemini only about Google&apos;s.</li>
          <li>Images from other generators (such as Midjourney or open-source Stable Diffusion models) usually carry neither label.</li>
          <li>Screenshots and social apps often strip Content Credentials. Watermarks hold up better, but heavy editing can still weaken them.</li>
        </ul>
        <p>
          So &quot;no label found&quot; means &quot;unknown&quot;, not &quot;real&quot;. When that happens, try a reverse
          image search to find the original, and read our guide on{" "}
          <A href="/blog/how-to-check-if-an-image-is-ai-generated">how to tell if an image is AI-generated</A>.
        </p>

        <h2>Step by step</h2>
        <ol>
          <li>Get the original file if you can, not a screenshot.</li>
          <li>Add it to the <A href="/analyzer">OriginLens Image Analyzer</A> and read the File labels card and the Provenance tab.</li>
          <li>If you suspect ChatGPT, check it at openai.com/verify. If you suspect Gemini or Google AI, ask the Gemini app.</li>
          <li>If nothing is found, run a reverse image search and treat the result as unknown.</li>
        </ol>

        <h2>Frequently asked questions</h2>
        <h3>Can Gemini tell if an image was made by ChatGPT?</h3>
        <p>
          Not reliably. Gemini&apos;s watermark check only recognises Google&apos;s SynthID. Use a Content Credentials
          reader such as OriginLens, or OpenAI&apos;s own checker.
        </p>
        <h3>Does a screenshot remove these labels?</h3>
        <p>
          A screenshot removes Content Credentials, because it creates a new file. A SynthID watermark is designed to
          survive screenshots, so the maker&apos;s checker may still find it.
        </p>
        <h3>Is there one tool that checks everything?</h3>
        <p>
          Not yet. Content Credentials are an open standard any tool can read, but each company&apos;s watermark can
          only be checked with its own tool. See our{" "}
          <A href="/blog/free-ai-image-checkers-compared">comparison of free AI image checkers</A>.
        </p>
      </>
    ),
  },
  {
    slug: "linkedin-content-credentials-label",
    title: "LinkedIn's \"CR\" Content Credentials Label, Explained",
    description:
      "What the small CR label on LinkedIn images means, why it appeared on your post, what it does and doesn't prove, and how to check a photo before you upload.",
    date: "2026-10-28",
    keywords: [
      "content credentials linkedin",
      "content credentials label linkedin",
      "content credentials label added",
      "linkedin CR label",
      "linkedin AI label image",
      "C2PA LinkedIn",
    ],
    body: (
      <>
        <p>
          You upload a photo to LinkedIn and a small <strong>&quot;CR&quot;</strong> icon appears on it. Or you notice
          the label on someone else&apos;s post and wonder whether it means the image is fake. Here is what the label
          actually is, why it shows up, and how to check an image yourself before you post it.
        </p>

        <h2>The short answer</h2>
        <p>
          &quot;CR&quot; stands for <strong>Content Credentials</strong>. LinkedIn shows it when an image or video
          carries a signed provenance record made with the C2PA standard. LinkedIn does not run its own AI detector to
          add the label: it simply reads a record that was already inside the file, written by the camera, app or AI
          tool that made or edited it.
        </p>

        <h2>Why the label appeared on your image</h2>
        <p>The label appears when your file already contains Content Credentials. Common sources:</p>
        <ul>
          <li><strong>AI image generators</strong> that add them automatically, such as OpenAI&apos;s image tools and Adobe Firefly.</li>
          <li><strong>Editing apps</strong>, such as Adobe Photoshop or Lightroom, when Content Credentials are switched on, including when you used a generative AI feature on part of a real photo.</li>
          <li><strong>Google&apos;s generative AI tools</strong>, which record AI steps in the image&apos;s history.</li>
          <li><strong>Some cameras and phones</strong> that sign photos at capture.</li>
        </ul>
        <p>
          A common surprise: you took a real photo, but used an AI tool to remove a background or extend the frame. That
          step can be recorded, so the label appears even though the photo started as real.
        </p>

        <h2>What you see when you click it</h2>
        <p>Clicking the label opens a short summary of the record. Depending on what the file contains, it can show:</p>
        <ul>
          <li>the app or device used to create or edit the content;</li>
          <li>whether AI was used to generate all or part of it;</li>
          <li>who signed the record (the issuer) and when.</li>
        </ul>
        <p>
          LinkedIn rolled the feature out gradually, and the label&apos;s exact look and position have varied, so it may
          look slightly different on your account.
        </p>

        <h2>What the label does not mean</h2>
        <ul>
          <li><strong>It is not an accusation.</strong> It reports what the file says about itself. Plenty of real, honest photos carry it.</li>
          <li><strong>It does not prove an image is true.</strong> A valid record shows how the file was made and that the record wasn&apos;t changed after signing, not that the scene is real or the caption accurate.</li>
          <li><strong>No label doesn&apos;t mean &quot;real&quot;.</strong> Most AI tools still don&apos;t add Content Credentials, and screenshots and many apps strip them. LinkedIn itself says it can&apos;t yet identify and label all AI-generated content.</li>
        </ul>

        <h2>How to check an image before you post it</h2>
        <ol>
          <li>Open the <A href="/analyzer">OriginLens Image Analyzer</A> and add your image. It runs in your browser; the image isn&apos;t uploaded.</li>
          <li>Check the <strong>File labels</strong> card. If the file declares AI generation, that is very likely what LinkedIn will show.</li>
          <li>Open the <strong>Provenance</strong> tab to see the full Content Credentials: the tools, the signer, the date and every AI source label.</li>
        </ol>
        <p>
          OriginLens reads <em>every</em> step in the file&apos;s history, not just the last one. That matters: an image
          made with a generative AI tool and then watermarked or converted can show the AI step only in an earlier
          layer of the record.
        </p>

        <h2>Can you remove the label?</h2>
        <p>
          Technically, yes. The label comes from data in the file, and tools like OriginLens Privacy Clean can remove
          Content Credentials along with other metadata, for example to strip your device details or location before
          sharing.
        </p>
        <p>
          But think about why you would. Removing the record doesn&apos;t change how the image was made, and if the
          image is AI-generated or AI-edited, hiding that can mislead people and may break LinkedIn&apos;s rules or
          your employer&apos;s. If the label is accurate, it&apos;s usually better to keep it and add context in your
          post, such as &quot;background extended with AI&quot;.
        </p>

        <h2>Privacy: what the record reveals</h2>
        <p>
          Content Credentials are readable by anyone who downloads the file. Depending on your settings they can include
          your name, the software and device you used, and edit history. Check what&apos;s in the file before you post,
          especially for personal photos.
        </p>

        <h2>Frequently asked questions</h2>
        <h3>Does the CR label mean LinkedIn thinks my image is AI?</h3>
        <p>
          Not by itself. It means the file carries Content Credentials. Click it: the summary says whether AI was
          involved, based on what the creating tool recorded.
        </p>
        <h3>Why doesn&apos;t every AI image on LinkedIn have the label?</h3>
        <p>
          Because the label depends on the record being in the file. Many AI tools don&apos;t add one, and screenshots
          or re-saves often remove it. See our guide on{" "}
          <A href="/blog/how-to-check-if-an-image-is-ai-generated">how to tell if an image is AI-generated</A> for the
          other checks.
        </p>
        <h3>How do I see the full details?</h3>
        <p>
          Add the image to the <A href="/analyzer">OriginLens Image Analyzer</A> and open the Provenance tab, or use
          the official Content Credentials Verify site. Our{" "}
          <A href="/blog/free-ai-image-checkers-compared">comparison of free AI image checkers</A> explains the
          differences.
        </p>
      </>
    ),
  },
  {
    slug: "free-ai-image-checkers-compared",
    title: "Free AI Image Checkers Compared: Which One to Use",
    description:
      "An honest comparison of free ways to check if an image is AI-generated: OriginLens, Content Credentials Verify, Sightengine and reverse image search.",
    date: "2026-10-28",
    keywords: [
      "free AI image checker",
      "AI image detector comparison",
      "Content Credentials Verify alternative",
      "C2PA checker",
      "best AI image detector",
      "check if image is AI generated free",
    ],
    body: (
      <>
        <p>
          There is no single tool that can tell you, with certainty, whether any image was made by AI. There are,
          however, several free tools that each answer part of the question well. This guide compares them honestly,
          including our own, so you can pick the right one for the job.
        </p>
        <p>
          Tool features change often. What follows is based on what each tool says it does as of October 2026; check
          the tool&apos;s own site before relying on it.
        </p>

        <h2>The three kinds of check</h2>
        <ul>
          <li>
            <strong>Provenance (Content Credentials / C2PA):</strong> reads a signed record inside the file that can
            say the image was AI-generated. Strongest evidence when present, but often stripped by screenshots and
            social apps.
          </li>
          <li>
            <strong>Metadata:</strong> reads EXIF, XMP and IPTC fields, such as an AI source label or a generator name.
            Useful, but easy to edit or remove.
          </li>
          <li>
            <strong>Pixel detectors:</strong> AI models that look at the picture itself. They work even without
            metadata, but they make mistakes in both directions, especially on new generators and compressed images.
          </li>
        </ul>

        <h2>The tools</h2>

        <h3>OriginLens</h3>
        <p>
          <A href="/analyzer">OriginLens</A> combines all three checks in one page. It reads Content Credentials with
          the official C2PA library and checks the signature, including AI labels from earlier editing steps (for
          example, Google&apos;s generative AI images that later had a watermark added). It also shows all
          EXIF/XMP/IPTC/GPS metadata and can remove it without re-encoding. Its pixel check (the open Community
          Forensics model) is optional and clearly labelled experimental.
        </p>
        <ul>
          <li><strong>Best for:</strong> one place to see every signal, plus removing private metadata before sharing.</li>
          <li><strong>Privacy:</strong> runs in your browser; images are not uploaded.</li>
          <li><strong>Limits:</strong> one free image check a day without an account (unlimited with a free account). The pixel check misses some AI images, and the signer is not checked against a trusted-issuer list.</li>
        </ul>

        <h3>Content Credentials Verify (contentcredentials.org/verify)</h3>
        <p>
          The official verifier from the Content Authenticity Initiative. It checks whether a file&apos;s Content
          Credentials are valid and shows a readable summary of who signed it and how it was made.
        </p>
        <ul>
          <li><strong>Best for:</strong> the authoritative answer on whether Content Credentials are valid and who issued them.</li>
          <li><strong>Limits:</strong> it only helps when the file still has Content Credentials, and it doesn&apos;t inspect other metadata or the pixels.</li>
        </ul>

        <h3>Sightengine C2PA check</h3>
        <p>
          Sightengine, a company that sells image-moderation APIs, offers a free in-browser C2PA checker. It also
          advertises AI and deepfake detection on the pixels through its paid API.
        </p>
        <ul>
          <li><strong>Best for:</strong> a quick C2PA check, and businesses that need detection at scale through an API.</li>
          <li><strong>Limits:</strong> pixel detection is part of the commercial product; check their site for current free limits.</li>
        </ul>

        <h3>Reverse image search (Google Lens, Bing, TinEye)</h3>
        <p>
          Not an AI detector, but often the most useful step when a file has no metadata. Finding the earliest copy of
          an image can lead to the original upload, the generator&apos;s gallery, or a fact-check.
        </p>
        <ul>
          <li><strong>Best for:</strong> images that were screenshotted or shared through social apps.</li>
          <li><strong>Limits:</strong> your image is sent to the search provider.</li>
        </ul>

        <h2>Quick comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink"><th className="py-2 pr-4">Tool</th><th className="py-2 pr-4">Content Credentials</th><th className="py-2 pr-4">Other metadata</th><th className="py-2 pr-4">Pixel check</th><th className="py-2">Removes metadata</th></tr>
            </thead>
            <tbody>
              <tr className="border-b border-line"><td className="py-2 pr-4">OriginLens</td><td className="py-2 pr-4">Yes, with signature check</td><td className="py-2 pr-4">Yes</td><td className="py-2 pr-4">Experimental, on device</td><td className="py-2">Yes</td></tr>
              <tr className="border-b border-line"><td className="py-2 pr-4">Content Credentials Verify</td><td className="py-2 pr-4">Yes (official)</td><td className="py-2 pr-4">No</td><td className="py-2 pr-4">No</td><td className="py-2">No</td></tr>
              <tr className="border-b border-line"><td className="py-2 pr-4">Sightengine</td><td className="py-2 pr-4">Yes</td><td className="py-2 pr-4">Partly</td><td className="py-2 pr-4">Paid API</td><td className="py-2">No</td></tr>
              <tr><td className="py-2 pr-4">Reverse image search</td><td className="py-2 pr-4">No</td><td className="py-2 pr-4">No</td><td className="py-2 pr-4">No (finds copies)</td><td className="py-2">No</td></tr>
            </tbody>
          </table>
        </div>

        <h2>Which one should you use?</h2>
        <ol>
          <li>Start with a tool that reads Content Credentials and metadata, such as <A href="/analyzer">OriginLens</A>. If it finds a signed AI label, you have strong evidence.</li>
          <li>If the label&apos;s signer matters (for example, in journalism), confirm it with the official Content Credentials Verify tool.</li>
          <li>If the file has no metadata, run a reverse image search to find the original.</li>
          <li>Treat any pixel-detector score as a hint, never a verdict, in either direction.</li>
        </ol>
        <p>
          For the full method, read our guide on{" "}
          <A href="/blog/how-to-check-if-an-image-is-ai-generated">how to check if an image is AI-generated</A>.
        </p>

        <h2>Frequently asked questions</h2>
        <h3>Which free AI image checker is the most accurate?</h3>
        <p>
          For images that still carry Content Credentials, any tool that reads them correctly gives near-certain
          answers. For images without them, no free tool is reliable: pixel detectors miss new generators and
          sometimes flag real photos.
        </p>
        <h3>Is OriginLens the same as the Origin Lens app?</h3>
        <p>
          No. OriginLens (www.originlens.bond) is a separate website, not affiliated with the &quot;Origin Lens&quot;
          iOS app or research project. See <A href="/about">About OriginLens</A>.
        </p>
      </>
    ),
  },
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
