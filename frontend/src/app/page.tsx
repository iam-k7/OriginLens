import Link from "next/link";

const FEATURES = [
  { title: "Metadata inspection", body: "EXIF, GPS, camera, software, XMP, IPTC and color profiles — read straight from the file, never guessed." },
  { title: "Content Credentials", body: "Verify C2PA manifests: who signed them, which tool made the image, and whether AI was declared." },
  { title: "Privacy Clean", body: "Strip GPS or all removable metadata without re-encoding. Same pixels, same quality, nothing left behind." },
  { title: "AI signals, honestly", body: "Evidence with strength and limits. No made-up percentages when no validated detector backs them." },
  { title: "Text intelligence", body: "Explainable style signals sentence by sentence, plus an optional deep review." },
  { title: "Rewrite naturally", body: "Improve clarity, flow and tone while keeping your meaning, facts and voice." },
];

const STEPS = [
  ["Upload", "Drop, paste or link an image. We check the real file signature, not the extension."],
  ["Inspect", "See every metadata block, provenance claim and technical property the file carries."],
  ["Act", "Download a cleaned copy, or share evidence that explains what the file declares."],
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-brand-500 sm:rounded-b-[4rem]">
        <div className="texture-lines-light pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-16 text-center sm:px-6 sm:pb-32 sm:pt-24">
          <p className="glass-on-orange mx-auto inline-flex rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-ink">
            Privacy-first content provenance
          </p>
          <h1 className="mx-auto mt-7 max-w-4xl font-display text-[2.4rem] font-extrabold uppercase leading-[0.98] text-balance text-milk [overflow-wrap:anywhere] sm:text-6xl lg:text-7xl">
            Understand where your content comes from
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink">
            Inspect image metadata and Content Credentials, remove what you don&apos;t want to share,
            and read your writing with clear, explainable signals.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/analyzer" className="btn-dark px-7 py-3 text-base">Analyze an image</Link>
            <Link href="/text" className="btn glass-on-orange px-7 py-3 text-base text-ink hover:bg-milk/35">Analyze text</Link>
          </div>
          <p className="mt-5 text-sm text-ink">No account needed. Uploads are processed in memory and discarded.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="features">
        <p className="eyebrow">What you get</p>
        <h2 id="features" className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">Evidence, not guesses</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <div className="h-1.5 w-10 rounded-full brand-gradient" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="card grid gap-8 p-8 md:grid-cols-3 md:p-10">
          {STEPS.map(([t, b], i) => (
            <div key={t}>
              <span className="font-display text-sm font-extrabold text-brand-600">0{i + 1}</span>
              <h3 className="mt-1 font-display text-xl font-bold">{t}</h3>
              <p className="mt-2 text-sm text-muted">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="card flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight">Honest by design</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Removing metadata never changes where an image came from, and no tool can prove authorship with
              certainty. OriginLens shows what a file declares and explains the limits.
            </p>
          </div>
          <Link href="/pricing" className="btn-dark shrink-0">See plans</Link>
        </div>
      </section>
    </>
  );
}
