import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What OriginLens collects, why, who processes it, and how to exercise your rights.",
};

const EMAIL = "contact@originlens.com";

function S({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="mt-10" aria-labelledby={`s${n}`}>
      <h2 id={`s${n}`} className="font-display text-xl font-semibold tracking-tight">{n}. {title}</h2>
      <div className="mt-3 space-y-3 text-[0.95rem] leading-relaxed text-muted [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Privacy Policy</h1>
      <p className="mt-3 text-muted">
        This policy explains how OriginLens (&quot;we&quot;, &quot;us&quot;) handles data on https://originlens.bond.
        The short version: your images and text are processed to give you a result and are not stored by us.
      </p>
      <p className="mt-2 text-sm text-muted">Last updated: October 19, 2026</p>

      <S n={1} title="Data we collect">
        <p><strong>Account data.</strong> If you create an account we collect your <strong>email address</strong>.
          Your password is handled by our authentication provider (Supabase), is stored only as a hash, and is never
          visible to us. If you sign in with Google or GitHub, that provider shares your email and basic profile
          details (such as your name and avatar) with Supabase. We do not ask for your name ourselves.</p>
        <p><strong>Images you analyze.</strong> Files you upload, paste or link are processed in memory to read their
          metadata and provenance, and to produce a cleaned copy. We do not save them to disk or to our database, and
          we do not log their contents. If you analyze an image URL, our server downloads that image on your behalf.</p>
        <p><strong>Text you submit.</strong> The text you analyze is processed in memory and is not stored by us. If you use
          <em> Rewrite Naturally</em> or <em>Deep Scan</em>, the text is sent to an AI provider (see section 4).
          The standard scan runs on our own servers only.</p>
        <p><strong>Usage records.</strong> For each tool run we record the type of tool, success or failure, how long it took
          and any error code, linked to your account when you are signed in. For AI features we also record the provider,
          model and token counts. These records contain no image or text content.</p>
        <p><strong>Rate-limit counters.</strong> To enforce fair-use limits we keep short-lived counters keyed to your account
          ID, or to your <strong>IP address</strong> if you are not signed in. These expire within about two days.</p>
        <p><strong>Technical logs.</strong> Our logs contain a request ID, method, path, status code and timing. They do not
          contain request bodies, query strings, tokens or uploaded content. Our hosting providers may record IP
          addresses in their own infrastructure logs.</p>
      </S>

      <S n={2} title="Cookies and browser storage">
        <ul>
          <li>We do not set advertising or analytics cookies, and we do not run analytics or tracking tools.</li>
          <li>When you sign in, our authentication library stores your session token in your browser&apos;s local storage.
            It is essential: without it you would be signed out on every page.</li>
          <li>We store your choice on the privacy notice in local storage, so we do not ask on every visit.</li>
        </ul>
        <p>You can clear this at any time in your browser settings; the privacy notice will then appear again.</p>
      </S>

      <S n={3} title="How we use data">
        <ul>
          <li>To provide the tools you ask for, and to show your plan and daily usage.</li>
          <li>To authenticate you and keep your account secure.</li>
          <li>To apply usage limits, prevent abuse and control costs.</li>
          <li>To diagnose errors and keep the service reliable.</li>
        </ul>
        <p>We do not sell your data, show ads, or build advertising profiles. We do not use your images or text to train
          models.</p>
      </S>

      <S n={4} title="Who else processes your data">
        <p>We do not sell or rent your data. We rely on these service providers, who process data only to run
          OriginLens:</p>
        <ul>
          <li><strong>Supabase</strong> — authentication and our database (email, account and usage records).</li>
          <li><strong>Vercel</strong> — hosting of the website.</li>
          <li><strong>Our API host</strong> — runs the analysis service that processes your uploads in memory.</li>
          <li><strong>OpenRouter and Groq</strong> — receive your text only when you use Rewrite Naturally or Deep Scan, and
            may route it to the underlying model provider. Their own privacy terms apply to that processing. Do not
            submit text you are not comfortable sending to them.</li>
          <li><strong>Google and GitHub</strong> — only if you choose to sign in with them.</li>
          <li>A public exchange-rate service, used to show INR prices. It receives no personal data.</li>
        </ul>
        <p>We may also disclose data where the law requires it, or to protect the rights and safety of our users and
          service.</p>
      </S>

      <S n={5} title="How long we keep data">
        <ul>
          <li>Uploaded images and submitted text: not retained by us.</li>
          <li>Rate-limit counters: about two days at most.</li>
          <li>Account and usage records: while your account exists, and deleted on request (section 7).</li>
          <li>Logs: kept by our hosting providers for their standard log-retention periods.</li>
        </ul>
      </S>

      <S n={6} title="Security">
        <p>We use encrypted connections, short-lived access tokens, strict input validation, safe image decoding, protections
          against server-side request forgery on image URLs, and rate limiting. No system is perfectly secure, so we
          cannot guarantee absolute security.</p>
      </S>

      <S n={7} title="Your rights">
        <p>Depending on where you live, you may have the right to access, correct, delete or export your data, to object
          to or restrict certain processing, to withdraw consent, and to complain to your data protection authority.
          To exercise any of these, email <a className="font-medium text-brand-600 hover:underline" href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          We will respond within a reasonable time and within any period the law sets.</p>
      </S>

      <S n={8} title="International transfers">
        <p>Our providers may process data in countries other than your own. Where required, we rely on appropriate
          safeguards such as standard contractual clauses.</p>
      </S>

      <S n={9} title="Children">
        <p>OriginLens is not directed at children under 16, and we do not knowingly collect their data. If you believe a
          child has given us personal data, contact us and we will delete it.</p>
      </S>

      <S n={10} title="Changes to this policy">
        <p>If we change how we handle data, for example by adding analytics, we will update this page and its date, and
          will ask for your consent where the law requires it.</p>
      </S>

      <S n={11} title="Contact us">
        <p>Questions about privacy: <a className="font-medium text-brand-600 hover:underline" href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          Back to <Link className="font-medium text-brand-600 hover:underline" href="/">home</Link>.</p>
      </S>
    </div>
  );
}
