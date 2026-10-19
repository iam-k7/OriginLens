import Link from "next/link";
import { Faq } from "@/components/Faq";
import { LogoMark } from "@/components/Logo";

const SOFT = "text-[#857e77]"; // second headline tone; 3.3:1 on stone, used only at large sizes

function SampleTag() {
  return <span className="rounded-[3px] bg-milk/10 px-1.5 py-0.5 text-[10px] text-dim">Sample</span>;
}

function MetadataCard() {
  const C = 2 * Math.PI * 22;
  const parts: [string, number, string][] = [["EXIF", 14, "#ff6a00"], ["GPS", 4, "#ffb170"], ["XMP", 5, "#cfc8bf"], ["C2PA", 1, "#6b635c"]];
  let offset = 0;
  return (
    <div className="w-[264px] rounded-lg bg-ink-2 p-4 text-left text-milk shadow-2xl ring-1 ring-white/5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium">Metadata found</p>
        <SampleTag />
      </div>
      <p className="mt-0.5 text-[11px] text-dim">photo_0412.jpg · 2.4 MB</p>
      <p className="mt-3 text-2xl font-medium tracking-tight">24 fields</p>
      <span className="mt-1 inline-block rounded-[3px] bg-brand-500/15 px-1.5 py-0.5 text-[11px] text-brand-300">GPS location present</span>
      <div className="mt-3 flex items-center gap-4 border-t border-milk/10 pt-3">
        <svg viewBox="0 0 60 60" className="h-16 w-16 -rotate-90" aria-hidden="true">
          {parts.map(([k, v, c]) => {
            const len = (v / 24) * C;
            const el = <circle key={k} cx="30" cy="30" r="22" fill="none" stroke={c} strokeWidth="9" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />;
            offset += len;
            return el;
          })}
        </svg>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          {parts.map(([k, v, c]) => (
            <li key={k} className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{k} <span className="text-dim">{v}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CleanCard() {
  return (
    <div className="w-[264px] rounded-lg bg-ink-2 p-4 text-left text-milk shadow-2xl ring-1 ring-white/5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium">Privacy Clean</p>
        <SampleTag />
      </div>
      <p className="mt-0.5 text-[11px] text-dim">photo_0412-clean.jpg</p>
      <p className="mt-3 text-2xl font-medium tracking-tight">−6.1 KB</p>
      <span className="mt-1 inline-block rounded-[3px] bg-emerald-400/15 px-1.5 py-0.5 text-[11px] text-emerald-300">Pixels identical</span>
      <div className="mt-3 space-y-2 border-t border-milk/10 pt-3 text-[11px]">
        {[["Before", "w-full", "bg-milk/40"], ["After", "w-[97%]", "bg-brand-500"]].map(([l, w, c]) => (
          <div key={l}>
            <div className="flex justify-between text-dim"><span>{l}</span><span>{l === "Before" ? "2.41 MB" : "2.40 MB"}</span></div>
            <div className="mt-1 h-1.5 rounded-full bg-milk/10"><div className={`h-full rounded-full ${w} ${c}`} /></div>
          </div>
        ))}
        <p className="pt-1 text-dim">Removed: GPS · EXIF · XMP</p>
      </div>
    </div>
  );
}

const STATS = [
  ["0", "bytes of your images stored"],
  ["6", "metadata categories you can remove"],
  ["15 MB", "upload limit · JPEG, PNG, WEBP, GIF"],
  ["1:1", "pixel-identical cleaned files"],
];

const FEATURES = [
  ["Metadata inspection", "EXIF, GPS, camera, software, XMP, IPTC and color profiles — read straight from the file, never guessed."],
  ["Content Credentials", "Verify C2PA manifests: who signed them, which tool made the image, and whether AI was declared."],
  ["Privacy Clean", "Strip GPS or all removable metadata without re-encoding. Same pixels, same quality."],
  ["AI signals, honestly", "Evidence with strength and limits. No made-up percentages when no validated detector backs them."],
  ["Text intelligence", "Explainable style signals sentence by sentence, plus an optional deep review."],
  ["Rewrite naturally", "Improve clarity, flow and tone while keeping your meaning, facts and voice."],
];

const ROWS = [
  ["EXIF", "Make", "Canon", false], ["EXIF", "Model", "EOS R5", false], ["GPS", "Latitude", "12.967083", true],
  ["GPS", "Longitude", "77.594444", true], ["EXIF", "Software", "Lightroom 7.2", false], ["C2PA", "Manifest", "None found", false],
] as const;

export default function Home() {
  return (
    <>
      {/* Hero panel */}
      <section className="panel relative flex flex-col overflow-hidden lg:min-h-[calc(100svh-1.5rem)]">
        <div className="relative mx-auto max-w-5xl px-4 pt-28 text-center sm:pt-32 lg:pt-36">
          <p className="inline-flex items-center gap-2 text-[13px] text-muted">
            Built for
            <span className="inline-flex items-center gap-1.5 font-medium text-ink">
              <span className="grid h-4 w-4 place-items-center rounded-[3px] bg-brand-500 text-[10px] leading-none text-ink">✓</span>
              privacy-first verification
            </span>
          </p>
          <h1 className="mt-6 font-display text-[2.7rem] font-normal leading-[0.98] tracking-[-0.055em] text-ink sm:text-7xl lg:text-[5.6rem]">
            Understand where
            <br />
            <span className={SOFT}>your content</span> comes from
          </h1>
          <p className="mx-auto mt-6 max-w-md text-[15px] text-muted">
            Inspect metadata, verify Content Credentials and remove what you don&apos;t want to share — in one calm workspace.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
            <Link href="/analyzer" className="btn-primary">Analyze an image</Link>
            <Link href="/text" className="btn-ghost">Analyze text</Link>
          </div>
        </div>

        <div className="relative mx-auto mt-14 h-[230px] w-full max-w-[1400px] shrink-0 sm:h-[300px] lg:flex-1 lg:mt-6 lg:min-h-[330px]">
          <span className="absolute left-[calc(50%-190px)] top-4 hidden items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs text-ink shadow-[0_2px_8px_rgb(22_18_15/0.1)] ring-1 ring-line sm:inline-flex lg:left-[calc(50%-260px)] lg:top-10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Processed in memory
          </span>
          <div className="absolute bottom-10 left-8 hidden max-w-sm text-left lg:block">
            <p className="flex items-center gap-1.5 text-xs text-muted"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />/how-it-works</p>
            <p className="mt-3 text-xl leading-snug tracking-tight text-ink">
              OriginLens reads every metadata block, <span className={SOFT}>verifies Content Credentials</span> and strips what you
              don&apos;t want to share — <span className={SOFT}>without touching a pixel.</span>
            </p>
          </div>
          <div className="absolute bottom-6 right-6 hidden gap-3 xl:flex" aria-label="Sample report preview">
            <MetadataCard />
            <CleanCard />
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center text-milk sm:px-6 sm:py-32">
        <span className="pill-label"><span className="text-brand-500">✱</span> Why OriginLens</span>
        <h2 className="mx-auto mt-8 max-w-4xl font-display text-3xl font-normal leading-[1.15] tracking-[-0.04em] text-dim sm:text-5xl lg:text-[3.3rem]">
          OriginLens{" "}
          <span className="inline-flex translate-y-1 -space-x-3 align-middle" aria-hidden="true">
            {["bg-ink-2", "bg-[#2b231d]", "bg-[#3a2f27]"].map((bg, i) => (
              <span key={bg} className={`grid h-11 w-12 place-items-center rounded-md ${bg} ring-1 ring-milk/10 sm:h-14 sm:w-16`}>
                {i === 0 ? <LogoMark className="h-6 w-6" /> : <span className="text-base text-milk/80">{i === 1 ? "⌖" : "✓"}</span>}
              </span>
            ))}
          </span>{" "}
          <span className="text-milk">shows what a file really carries</span> — camera, location, edits and Content Credentials —{" "}
          <span className="text-milk">and removes</span> what you don&apos;t want to share.
        </h2>
        <dl className="mt-20 grid grid-cols-2 gap-y-10 lg:grid-cols-4 lg:divide-x lg:divide-milk/10">
          {STATS.map(([v, l]) => (
            <div key={l} className="px-4">
              <dt className="sr-only">{l}</dt>
              <dd className="font-display text-4xl font-light tracking-[-0.04em] sm:text-5xl">{v}</dd>
              <dd className="mt-2 text-sm text-dim">{l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Inside the app */}
      <section className="texture-grid-dark relative overflow-hidden rounded-xl bg-ink-2 px-4 py-20 text-milk sm:px-10 sm:py-28">
        <div className="relative mx-auto max-w-5xl">
          <div className="text-center">
            <span className="pill-label">Inside the app</span>
            <h2 className="mt-6 font-display text-4xl font-normal tracking-[-0.045em] sm:text-5xl">Every metadata block, one clear view</h2>
            <p className="mx-auto mt-4 max-w-lg text-dim">Grouped by source, sensitive fields flagged, and one click to remove them.</p>
          </div>
          <div className="mt-14 overflow-hidden rounded-lg bg-ink/80 text-left shadow-2xl ring-1 ring-milk/10">
            <div className="flex items-center gap-2 border-b border-milk/10 px-4 py-3">
              <span className="flex gap-1.5" aria-hidden="true">{[1, 2, 3].map((i) => <span key={i} className="h-2.5 w-2.5 rounded-full bg-milk/15" />)}</span>
              <span className="ml-2 text-xs text-dim">Image Analyzer · photo_0412.jpg</span>
              <span className="ml-auto"><SampleTag /></span>
            </div>
            <div className="grid md:grid-cols-[190px_1fr]">
              <ul className="hidden space-y-0.5 border-r border-milk/10 p-3 text-[13px] md:block">
                {["Overview", "Metadata", "Provenance", "AI Signals", "Privacy Clean"].map((t) => (
                  <li key={t} className={`rounded-[4px] px-2.5 py-1.5 ${t === "Metadata" ? "bg-milk/10 text-milk" : "text-dim"}`}>{t}</li>
                ))}
              </ul>
              <div className="p-4 sm:p-6">
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {["JPEG", "4032 × 3024", "2.4 MB", "sRGB"].map((c) => <span key={c} className="rounded-[3px] bg-milk/10 px-1.5 py-0.5 text-dim">{c}</span>)}
                </div>
                <table className="mt-4 w-full text-[13px]">
                  <caption className="sr-only">Sample metadata table</caption>
                  <tbody className="divide-y divide-milk/10">
                    {ROWS.map(([g, k, v, s]) => (
                      <tr key={k}>
                        <td className="w-16 py-2.5 font-mono text-[11px] text-dim">{g}</td>
                        <th scope="row" className="py-2.5 text-left font-medium">{k}</th>
                        <td className="py-2.5 text-right font-mono text-xs text-milk/80">
                          {s && <span className="mr-2 rounded-[3px] bg-brand-500/15 px-1.5 py-0.5 font-sans text-[10px] text-brand-300">sensitive</span>}
                          {v}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-5 flex gap-2">
                  <span className="btn-primary py-2 text-[13px]">Remove GPS</span>
                  <span className="btn-ghost-dark py-2 text-[13px]">Download clean copy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-milk sm:px-6" aria-labelledby="features">
        <span className="pill-label">What you get</span>
        <h2 id="features" className="mt-6 max-w-2xl font-display text-4xl font-normal tracking-[-0.045em] sm:text-5xl">Evidence, not guesses</h2>
        <div className="mt-12 grid border-l border-t border-milk/10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([t, b], i) => (
            <div key={t} className="border-b border-r border-milk/10 p-6 sm:p-8">
              <span className="font-mono text-xs text-brand-400">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-medium tracking-tight">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-dim">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <Faq />

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center text-milk sm:px-6">
        <div className="relative overflow-hidden rounded-xl bg-ink-2 px-6 py-20 ring-1 ring-milk/10 sm:py-24">
          <h2 className="relative mx-auto max-w-3xl font-display text-4xl font-normal leading-[1.02] tracking-[-0.05em] sm:text-6xl">
            Know what your files say <span className="text-dim">before you share them.</span>
          </h2>
          <p className="relative mt-5 text-dim">Free to start. No card. Nothing stored.</p>
          <div className="relative mt-8 flex flex-col justify-center gap-2 sm:flex-row">
            <Link href="/analyzer" className="btn-primary">Analyze an image</Link>
            <Link href="/text" className="btn-ghost-dark">Analyze text</Link>
          </div>
        </div>
      </section>
    </>
  );
}
