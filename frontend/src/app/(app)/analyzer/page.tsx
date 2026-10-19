"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ErrorAlert, KV, Limitations, Section, Spinner, Tabs } from "@/components/ui";
import { api, ApiError, base64ToBlob, formatBytes } from "@/lib/api";

/* eslint-disable @typescript-eslint/no-explicit-any -- API payloads are rendered generically */
type Analysis = { metadata: any; c2pa: any; privacy_clean_supported: boolean };
type TabId = "overview" | "metadata" | "provenance" | "ai" | "clean";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_MB = 15;
const CATEGORIES: { id: string; label: string; hint: string }[] = [
  { id: "gps", label: "GPS location", hint: "Coordinates and altitude inside EXIF" },
  { id: "exif", label: "All EXIF", hint: "Camera, lens, timestamps, software, serials (includes GPS)" },
  { id: "xmp", label: "XMP", hint: "Editing history, creator tool, rights" },
  { id: "iptc", label: "IPTC", hint: "Captions, keywords, by-line, copyright" },
  { id: "c2pa", label: "Content Credentials", hint: "C2PA provenance manifest" },
  { id: "comments", label: "Comments & text", hint: "JPEG comments, PNG text chunks, timestamps" },
];

export default function AnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [ai, setAi] = useState<any>(null);
  const [clean, setClean] = useState<any>(null);
  const [cats, setCats] = useState<string[]>(["gps"]);
  const [tab, setTab] = useState<TabId>("overview");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const reset = useCallback(() => {
    setFile(null); setPreview(null); setResult(null); setAi(null); setClean(null); setError(null); setTab("overview");
    if (input.current) input.current.value = "";
  }, []);

  const analyzeFile = useCallback(async (f: File) => {
    if (!ACCEPT.includes(f.type) && f.type !== "") {
      setError(new ApiError(0, "invalid_file", "Supported formats: JPEG, PNG, WEBP, GIF. SVG is not accepted."));
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) { setError(new ApiError(0, "invalid_file", `Images must be at most ${MAX_MB} MB.`)); return; }
    reset();
    setFile(f); setPreview(URL.createObjectURL(f)); setBusy("Analyzing image");
    try {
      const fd = new FormData(); fd.append("file", f);
      setResult(await api<Analysis>("/images/analyze", { method: "POST", body: fd }));
    } catch (e) { setError(e); } finally { setBusy(null); }
  }, [reset]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"));
      const f = item?.getAsFile();
      if (f) analyzeFile(new File([f], `pasted.${f.type.split("/")[1]}`, { type: f.type }));
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [analyzeFile]);

  async function analyzeUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    reset(); setBusy("Fetching image");
    try {
      const r = await api<Analysis & { image: { mime_type: string; base64: string } }>("/images/analyze-url", {
        method: "POST", body: JSON.stringify({ url: url.trim() }),
      });
      const blob = base64ToBlob(r.image.base64, r.image.mime_type);
      const name = new URL(url.trim()).pathname.split("/").pop() || "remote-image";
      setFile(new File([blob], name, { type: r.image.mime_type }));
      setPreview(URL.createObjectURL(blob));
      setResult(r);
    } catch (err) { setError(err); } finally { setBusy(null); }
  }

  async function runAi() {
    if (!file) return;
    setBusy("Analyzing AI signals"); setError(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      setAi((await api<any>("/images/ai-signals", { method: "POST", body: fd })).ai_signals);
    } catch (e) { setError(e); } finally { setBusy(null); }
  }

  async function runClean() {
    if (!file || !cats.length) return;
    setBusy("Cleaning metadata"); setError(null);
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("categories", cats.join(","));
      setClean(await api<any>("/images/clean", { method: "POST", body: fd }));
    } catch (e) { setError(e); } finally { setBusy(null); }
  }

  function download() {
    const blob = base64ToBlob(clean.file.base64, clean.file.mime_type);
    const href = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href, download: clean.file.filename });
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  const m = result?.metadata;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Image Analyzer</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">Inspect, verify and clean an image</h1>
      <p className="mt-2 max-w-2xl text-muted">Metadata, Content Credentials and AI signals — read from the file itself. Nothing is stored.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) analyzeFile(f); }}
            className={`card relative flex min-h-64 flex-col items-center justify-center overflow-hidden border-2 border-dashed p-6 text-center transition ${
              drag ? "border-brand-400 bg-brand-50" : "border-line"
            }`}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
              <img src={preview} alt="Selected image preview" className="max-h-72 w-auto rounded-lg object-contain" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-10 w-10 text-brand-500" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
                <p className="mt-3 font-medium">Drag and drop an image</p>
                <p className="mt-1 text-sm text-muted">or paste from clipboard · JPG, PNG, WEBP, GIF · max {MAX_MB} MB</p>
              </>
            )}
            <input ref={input} type="file" accept={ACCEPT.join(",")} className="sr-only" id="file"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) analyzeFile(f); }} />
          </div>
          <div className="flex gap-2">
            <label htmlFor="file" className="btn-primary flex-1 cursor-pointer">Browse files</label>
            {file && <button onClick={reset} className="btn-ghost">Remove</button>}
          </div>
          {file && <p className="truncate text-sm text-muted">{file.name} · {formatBytes(file.size)}</p>}

          <form onSubmit={analyzeUrl} className="card space-y-2 p-4">
            <label htmlFor="url" className="label">Or analyze an image URL</label>
            <div className="flex gap-2">
              <input id="url" type="url" required placeholder="https://example.com/photo.jpg" value={url}
                onChange={(e) => setUrl(e.target.value)} className="input" />
              <button className="btn-dark" disabled={!!busy}>Fetch</button>
            </div>
            <p className="text-xs text-muted">Public http(s) addresses only. Private networks are blocked.</p>
          </form>
        </div>

        <div className="min-w-0 space-y-4" aria-live="polite">
          {busy && <div className="card p-5"><Spinner label={busy} /></div>}
          <ErrorAlert error={error} />
          {!result && !busy && !error && (
            <div className="card flex min-h-64 items-center justify-center p-8 text-center text-muted">
              Results appear here after you add an image.
            </div>
          )}

          {m && (
            <>
              <Tabs<TabId>
                value={tab}
                onChange={setTab}
                tabs={[
                  { id: "overview", label: "Overview" },
                  { id: "metadata", label: "Metadata" },
                  { id: "provenance", label: "Provenance" },
                  { id: "ai", label: "AI Signals" },
                  { id: "clean", label: "Privacy Clean" },
                ]}
              />

              {tab === "overview" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Section title="Technical">
                    <KV data={{
                      Format: m.technical.format, Dimensions: `${m.technical.width} × ${m.technical.height}`,
                      Megapixels: m.technical.megapixels, "File size": formatBytes(m.technical.file_size_bytes),
                      Frames: m.technical.frames, DPI: m.technical.dpi, Progressive: m.technical.progressive ? "Yes" : "No",
                      "SHA-256": m.technical.sha256,
                    }} />
                  </Section>
                  <Section title="Color">
                    <KV data={{ Mode: m.color.mode, Alpha: m.color.has_alpha ? "Yes" : "No",
                      "ICC profile": m.color.icc_profile?.description ?? "None" }} />
                    <div className="mt-3 flex gap-2" aria-label="Dominant colors">
                      {m.color.dominant_colors.map((c: string) => (
                        <span key={c} title={c} className="h-8 w-8 rounded-lg border border-line" style={{ background: c }} />
                      ))}
                    </div>
                  </Section>
                  <Section title="Key details">
                    <KV data={{
                      Camera: [m.highlights.camera_make, m.highlights.camera_model].filter(Boolean).join(" ") || null,
                      Lens: m.highlights.lens, Software: m.highlights.software, Author: m.highlights.author,
                      Copyright: m.highlights.copyright, Captured: m.highlights.captured_at,
                    }} />
                  </Section>
                  <Section title="Location">
                    {m.highlights.gps ? (
                      <>
                        <Alert kind="warn">This image reveals where it was taken.</Alert>
                        <div className="mt-3"><KV data={m.highlights.gps} /></div>
                        <a className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline" target="_blank" rel="noopener noreferrer"
                          href={`https://www.openstreetmap.org/?mlat=${m.highlights.gps.latitude}&mlon=${m.highlights.gps.longitude}#map=14/${m.highlights.gps.latitude}/${m.highlights.gps.longitude}`}>
                          View on map ↗
                        </a>
                      </>
                    ) : <p className="text-sm text-muted">No GPS data found.</p>}
                  </Section>
                </div>
              )}

              {tab === "metadata" && (
                <div className="space-y-4">
                  <Section title="Metadata blocks in file">
                    {m.blocks.length ? (
                      <div className="flex flex-wrap gap-2">
                        {m.blocks.map((b: any, i: number) => (
                          <span key={i} className="chip border-line bg-surface">{b.category} · {b.container} · {formatBytes(b.bytes)}</span>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted">No metadata blocks found.</p>}
                  </Section>
                  {Object.entries(m.exif as Record<string, any>).map(([g, d]) => (
                    <Section key={g} title={`EXIF · ${g}`}>
                      <KV data={d} sensitive={m.sensitive_fields.filter((s: string) => s.startsWith(g + ".")).map((s: string) => s.slice(g.length + 1))} />
                    </Section>
                  ))}
                  {Object.keys(m.xmp).length > 0 && <Section title="XMP"><KV data={m.xmp} /></Section>}
                  {Object.keys(m.iptc).length > 0 && <Section title="IPTC"><KV data={m.iptc} /></Section>}
                  {Object.keys(m.text_chunks).length > 0 && <Section title="PNG text"><KV data={m.text_chunks} /></Section>}
                  {m.comment && <Section title="Comment"><p className="font-mono text-xs text-muted">{m.comment}</p></Section>}
                  {m.exiftool && <Section title="ExifTool (deep read)"><KV data={m.exiftool} /></Section>}
                  {!Object.keys(m.exif).length && !Object.keys(m.xmp).length && !m.blocks.length && (
                    <Alert kind="info">No embedded metadata. This is common for screenshots and images saved from social platforms.</Alert>
                  )}
                </div>
              )}

              {tab === "provenance" && <Provenance c2pa={result!.c2pa} />}

              {tab === "ai" && (
                <div className="space-y-4">
                  {!ai ? (
                    <Section title="AI signals">
                      <p className="text-sm text-muted">Checks Content Credentials, IPTC/XMP declarations, generator fingerprints and technical hints.</p>
                      <button onClick={runAi} disabled={!!busy} className="btn-primary mt-4">Analyze AI Signals</button>
                    </Section>
                  ) : <AiResult ai={ai} />}
                </div>
              )}

              {tab === "clean" && (
                <div className="space-y-4">
                  {!result!.privacy_clean_supported ? (
                    <Alert kind="info">Privacy Clean supports JPEG, PNG and WEBP.</Alert>
                  ) : (
                    <Section title="Privacy Clean">
                      <fieldset>
                        <legend className="text-sm text-muted">Choose what to remove. Pixels are copied unchanged; color profiles are kept.</legend>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {CATEGORIES.map((c) => {
                            const present = c.id === "gps" ? !!m.exif.GPS : m.blocks.some((b: any) => b.category === c.id) || (c.id === "comments" && !!m.comment);
                            return (
                              <label key={c.id} className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition ${cats.includes(c.id) ? "border-brand-300 bg-brand-50" : "border-line"}`}>
                                <input type="checkbox" className="mt-0.5 accent-brand-500" checked={cats.includes(c.id)}
                                  onChange={(e) => setCats(e.target.checked ? [...cats, c.id] : cats.filter((x) => x !== c.id))} />
                                <span>
                                  <span className="font-medium">{c.label}</span>
                                  {present && <span className="chip ml-2 border-brand-200 text-brand-700">found</span>}
                                  <span className="block text-xs text-muted">{c.hint}</span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => setCats(CATEGORIES.map((c) => c.id))} className="btn-ghost">Select all</button>
                        <button onClick={runClean} disabled={!!busy || !cats.length} className="btn-primary">Clean image</button>
                      </div>
                    </Section>
                  )}
                  {clean && <CleanResult clean={clean} onDownload={download} />}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Provenance({ c2pa }: { c2pa: any }) {
  if (!c2pa.present) {
    return (
      <Section title="Content Credentials (C2PA)">
        <p className="text-sm text-muted">No Content Credentials found. Many cameras and apps don&apos;t add them, and most platforms strip them — absence is not evidence either way.</p>
      </Section>
    );
  }
  const man = c2pa.manifest;
  return (
    <Section title="Content Credentials (C2PA)" aside={
      <span className={`chip ${c2pa.verified ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-brand-200 bg-brand-50 text-brand-700"}`}>
        {c2pa.verified ? "Signature valid" : c2pa.validation_state ?? "Not verified"}
      </span>
    }>
      {c2pa.error && <Alert kind="warn">{c2pa.error}</Alert>}
      {man && <KV data={{
        "Claim generator": man.claim_generator, Title: man.title, "Signed by": man.signature_issuer, "Signed at": man.signed_at,
        "Digital source": man.digital_source_types, Assertions: man.assertions, Manifests: man.num_manifests,
        "Validation issues": man.validation_issues,
      }} />}
    </Section>
  );
}

const VERDICT: Record<string, string> = {
  declared_ai: "The file declares AI generation",
  ai_indicators: "The file contains AI-related indicators",
  camera_indicators: "The file contains camera capture data",
  inconclusive: "No conclusive evidence in the file",
};

function AiResult({ ai }: { ai: any }) {
  return (
    <>
      <Section title="Result" aside={<span className="chip border-line">Confidence: {ai.confidence}</span>}>
        <p className="font-display text-xl font-semibold">{VERDICT[ai.verdict]}</p>
        <Alert kind="info">
          <strong className="text-ink">AI probability score: unavailable.</strong> {ai.detector.reason} The result above is based only on evidence found in the file.
        </Alert>
      </Section>
      <Section title="Evidence">
        {ai.evidence.length ? (
          <ul className="divide-y divide-line">
            {ai.evidence.map((e: any, i: number) => (
              <li key={i} className="flex flex-wrap items-start justify-between gap-2 py-2.5 text-sm">
                <span><span className="font-medium">{e.signal}</span> <span className="text-muted">— {e.detail}</span></span>
                <span className="flex gap-1.5">
                  <span className="chip border-line">{e.source}</span>
                  <span className={`chip ${e.strength === "strong" ? "border-brand-300 bg-brand-50 text-brand-700" : "border-line text-muted"}`}>{e.strength}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">No signals found.</p>}
      </Section>
      <Limitations items={ai.limitations} />
    </>
  );
}

function CleanResult({ clean, onDownload }: { clean: any; onDownload: () => void }) {
  const b = clean.before.technical, a = clean.after.technical;
  const removedKeys = (meta: any) => Object.values(meta.exif as Record<string, object>).reduce((n, g) => n + Object.keys(g).length, 0)
    + Object.keys(meta.xmp).length + Object.keys(meta.iptc).length + Object.keys(meta.text_chunks).length + (meta.comment ? 1 : 0);
  return (
    <>
      <Section title="Cleaned image" aside={<button onClick={onDownload} className="btn-primary">Download {clean.file.filename}</button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted"><tr><th className="py-2 font-medium" scope="col"></th><th scope="col" className="font-medium">Before</th><th scope="col" className="font-medium">After</th></tr></thead>
            <tbody className="divide-y divide-line">
              <tr><th scope="row" className="py-2 font-medium">File size</th><td>{formatBytes(b.file_size_bytes)}</td><td>{formatBytes(a.file_size_bytes)}</td></tr>
              <tr><th scope="row" className="py-2 font-medium">Dimensions</th><td>{b.width} × {b.height}</td><td>{a.width} × {a.height}</td></tr>
              <tr><th scope="row" className="py-2 font-medium">Metadata fields</th><td>{removedKeys(clean.before)}</td><td>{removedKeys(clean.after)}</td></tr>
              <tr><th scope="row" className="py-2 font-medium">GPS</th><td>{clean.before.highlights.gps ? "Present" : "None"}</td><td>{clean.after.highlights.gps ? "Present" : "None"}</td></tr>
              <tr><th scope="row" className="py-2 font-medium">Content Credentials</th><td>—</td><td>{clean.c2pa_after.present ? "Present" : "None"}</td></tr>
              <tr><th scope="row" className="py-2 font-medium">ICC profile</th><td>{clean.before.color.icc_profile ? "Kept" : "None"}</td><td>{clean.after.color.icc_profile ? "Kept" : "None"}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">Removed: {clean.removed.length ? clean.removed.map((r: any) => `${r.category} (${formatBytes(r.bytes)})`).join(", ") : "nothing — the selected metadata wasn't present."}</p>
      </Section>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Before"><KV data={Object.assign({}, ...Object.values(clean.before.exif as object), clean.before.xmp, clean.before.iptc)} /></Section>
        <Section title="After"><KV data={Object.assign({}, ...Object.values(clean.after.exif as object), clean.after.xmp, clean.after.iptc)} /></Section>
      </div>
      <Limitations items={clean.limitations} />
    </>
  );
}
