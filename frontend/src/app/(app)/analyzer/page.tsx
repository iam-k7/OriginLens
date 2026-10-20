"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ErrorAlert, KV, Limitations, Section, Spinner, Tabs } from "@/components/ui";
import { api, ApiError, base64ToBlob, formatBytes, uploadFile } from "@/lib/api";
import { checkAiSignals, type AiSignals } from "@/lib/aiSignals";
import { cleanBytes, findMetadata, sniffFormat, type CleanCategory, type Found } from "@/lib/cleanImage";

/* eslint-disable @typescript-eslint/no-explicit-any -- API payloads are rendered generically */
type Analysis = { metadata: any; c2pa: any; privacy_clean_supported: boolean };
type TabId = "overview" | "metadata" | "provenance";
type Job = { name: string; size: number; sent: number; status: "uploading" | "analyzing" | "done" | "failed" };

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_MB = 15;
const CATEGORY_INFO: Record<CleanCategory, { label: string; hint: string }> = {
  exif: { label: "EXIF", hint: "Camera, lens, timestamps, software and GPS location" },
  xmp: { label: "XMP", hint: "Editing history, creator tool, rights" },
  iptc: { label: "IPTC", hint: "Captions, keywords, by-line, copyright" },
  c2pa: { label: "Content Credentials", hint: "C2PA provenance manifest" },
  comments: { label: "Comments & text", hint: "JPEG comments, PNG text chunks, timestamps" },
};
const CLEAN_LIMITS = [
  "Color profiles are kept, and pixel data is copied unchanged.",
  "Removing metadata does not change where an image came from. AI-generated images stay AI-generated.",
  "GPS lives inside EXIF, so it goes with EXIF. Removing only GPS needs the server.",
  "Works for JPEG, PNG and WEBP.",
];

const CLOUD = "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9M16 16l-4-4-4 4";
const CHECK_CIRCLE = "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-12.5.5 2.5 2.5 4.5-5";
const TRASH = "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6";
const CLOSE = "M18 6 6 18M6 6l12 12";
const ICON_BTN = "grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted transition hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-500";

function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function AnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [aiCheck, setAiCheck] = useState<{ file: File; result: AiSignals } | null>(null);
  const [found, setFound] = useState<{ file: File; items: Found[]; supported: boolean } | null>(null);
  const [cats, setCats] = useState<CleanCategory[]>([]);
  const [cleaned, setCleaned] = useState<{ url: string; filename: string; before: number; after: number; removed: Found[] } | null>(null);
  const [tab, setTab] = useState<TabId>("overview");
  const input = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => () => { if (cleaned) URL.revokeObjectURL(cleaned.url); }, [cleaned]);

  const readFound = useCallback((f: File) => {
    f.arrayBuffer().then((buf) => {
      const bytes = new Uint8Array(buf);
      const items = findMetadata(bytes);
      setFound({ file: f, items, supported: sniffFormat(bytes) !== undefined });
      setCats(items.map((x) => x.category));
    }).catch(() => undefined);
  }, []);

  const reset = useCallback(() => {
    abort.current?.abort();
    setFile(null); setPreview(null); setResult(null); setAiCheck(null); setFound(null); setCats([]); setCleaned(null); setError(null); setJob(null); setTab("overview");
    if (input.current) input.current.value = "";
  }, []);

  const analyzeFile = useCallback(async (f: File) => {
    if (!ACCEPT.includes(f.type) && f.type !== "") {
      setError(new ApiError(0, "invalid_file", "Supported formats: JPEG, PNG, WEBP, GIF. SVG is not accepted."));
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) { setError(new ApiError(0, "invalid_file", `Images must be at most ${MAX_MB} MB.`)); return; }
    reset();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setFile(f); setPreview(URL.createObjectURL(f));
    setJob({ name: f.name, size: f.size, sent: 0, status: "uploading" });
    checkAiSignals(f).then((result) => setAiCheck({ file: f, result })).catch(() => undefined);
    readFound(f);
    try {
      const fd = new FormData(); fd.append("file", f);
      const r = await uploadFile<Analysis>("/images/analyze", fd, (loaded, total) =>
        setJob((j) => j && { ...j, sent: (loaded / total) * f.size, status: loaded >= total ? "analyzing" : "uploading" }), ctrl.signal);
      if (ctrl.signal.aborted) return;
      setResult(r);
      setJob((j) => j && { ...j, sent: f.size, status: "done" });
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setError(e instanceof ApiError && e.code === "network_error"
        ? new ApiError(0, "server_offline", "Metadata details need the OriginLens server, which is not connected yet. The AI check above runs in your browser.")
        : e);
      setJob((j) => j && { ...j, status: "failed" });
    }
  }, [reset, readFound]);

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
      const f = new File([blob], name, { type: r.image.mime_type });
      setFile(f);
      checkAiSignals(f).then((result) => setAiCheck({ file: f, result })).catch(() => undefined);
      readFound(f);
      setPreview(URL.createObjectURL(blob));
      setResult(r);
      setJob({ name, size: blob.size, sent: blob.size, status: "done" });
    } catch (err) { setError(err); } finally { setBusy(null); }
  }

  async function runClean() {
    if (!file || !cats.length) return;
    setError(null);
    try {
      const before = new Uint8Array(await file.arrayBuffer());
      const { bytes, removed } = cleanBytes(before, cats);
      const dot = file.name.lastIndexOf(".");
      const filename = dot > 0 ? `${file.name.slice(0, dot)}-clean${file.name.slice(dot)}` : `${file.name}-clean`;
      setCleaned({ url: URL.createObjectURL(new Blob([bytes], { type: file.type })), filename, before: before.length, after: bytes.length, removed });
    } catch (e) {
      setError(new ApiError(0, "clean_failed", e instanceof Error ? e.message : "Could not clean this image."));
    }
  }

  const m = result?.metadata;
  const pct = job?.size ? Math.round((job.sent / job.size) * 100) : 0;
  const ai = aiCheck && aiCheck.file === file ? aiCheck.result : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Image Analyzer</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">Inspect, verify and clean an image</h1>
      <p className="mt-2 max-w-2xl text-muted">Metadata, Content Credentials and AI signals — read from the file itself. Nothing is stored.</p>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[440px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) analyzeFile(f); }}
            className="card p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface">
                  <Icon d={CLOUD} className="h-6 w-6 text-ink" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-tight">Upload files</h2>
                  <p className="text-sm text-muted">Select and upload the image you want to inspect</p>
                </div>
              </div>
              {job && (
                <button type="button" onClick={reset} aria-label="Clear" className={ICON_BTN}>
                  <Icon d={CLOSE} />
                </button>
              )}
            </div>

            <div className={`mt-6 flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${drag ? "border-brand-400 bg-brand-50" : "border-ink/20"}`}>
              <Icon d={CLOUD} className="h-14 w-14 text-muted" />
              <p className="mt-4 text-lg font-semibold">Choose a file or drag &amp; drop it here.</p>
              <p className="mt-1 text-sm text-muted">JPEG, PNG, WEBP and GIF, up to {MAX_MB} MB.</p>
              <button type="button" onClick={() => input.current?.click()} className="btn-ghost mt-5">Browse File</button>
              <input ref={input} type="file" accept={ACCEPT.join(",")} className="sr-only" tabIndex={-1} aria-hidden="true"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) analyzeFile(f); }} />
            </div>

            {job && (
              <div className="mt-6 border-t border-line pt-6">
                <div className="flex items-center gap-4">
                  <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface">
                    {preview && (
                      // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                      <img src={preview} alt="" className="h-full w-full object-cover" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium" title={job.name}>{job.name}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {job.status === "uploading" && `${formatBytes(Math.round(job.sent))} of ${formatBytes(job.size)} · Uploading…`}
                      {job.status === "analyzing" && `${formatBytes(job.size)} · Analyzing…`}
                      {job.status === "done" && <>{formatBytes(job.size)} · <span className="font-medium text-emerald-700">Completed</span></>}
                      {job.status === "failed" && <>{formatBytes(job.size)} · <span className="font-medium text-red-700">Failed</span></>}
                    </p>
                  </div>
                  {job.status === "done" ? (
                    <>
                      <Icon d={CHECK_CIRCLE} className="h-6 w-6 shrink-0 text-emerald-600" />
                      <button type="button" onClick={reset} aria-label="Remove file" className={ICON_BTN}>
                        <Icon d={TRASH} />
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={reset} aria-label={job.status === "failed" ? "Dismiss" : "Cancel upload"} className={ICON_BTN}>
                      <Icon d={CLOSE} />
                    </button>
                  )}
                </div>
                {(job.status === "uploading" || job.status === "analyzing") && (
                  <div role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100}
                    aria-valuenow={job.status === "uploading" ? pct : undefined}
                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
                    <div className={`h-full rounded-full bg-ink ${job.status === "analyzing" ? "w-full animate-pulse" : ""}`}
                      style={job.status === "uploading" ? { width: `${pct}%` } : undefined} />
                  </div>
                )}
              </div>
            )}
          </div>

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
          {ai && (
            <div className="space-y-4">
              <p className="eyebrow">AI check · runs in your browser</p>
              <AiResult ai={ai} />
            </div>
          )}
          {found && found.file === file && (
            <CleanPanel items={found.items} supported={found.supported} cats={cats} setCats={setCats} onClean={runClean} cleaned={cleaned} />
          )}
          {!result && !busy && !error && !ai && !found && (
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
  inconclusive: "No AI markers found in the file",
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

function CleanPanel({ items, supported, cats, setCats, onClean, cleaned }: {
  items: Found[]; supported: boolean; cats: CleanCategory[]; setCats: (c: CleanCategory[]) => void; onClean: () => void;
  cleaned: { url: string; filename: string; before: number; after: number; removed: Found[] } | null;
}) {
  return (
    <>
      <p className="eyebrow">Privacy Clean · runs in your browser</p>
      <Section title="Remove metadata">
        {!supported ? (
          <Alert kind="info">Privacy Clean supports JPEG, PNG and WEBP.</Alert>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted">No removable metadata found in this file.</p>
        ) : (
          <>
            <fieldset>
              <legend className="text-sm text-muted">Choose what to remove.</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {items.map(({ category, bytes }) => (
                  <label key={category} className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition ${cats.includes(category) ? "border-brand-300 bg-brand-50" : "border-line"}`}>
                    <input type="checkbox" className="mt-0.5 accent-brand-500" checked={cats.includes(category)}
                      onChange={(e) => setCats(e.target.checked ? [...cats, category] : cats.filter((x) => x !== category))} />
                    <span>
                      <span className="font-medium">{CATEGORY_INFO[category].label}</span>
                      <span className="chip ml-2 border-line">{formatBytes(bytes)}</span>
                      <span className="block text-xs text-muted">{CATEGORY_INFO[category].hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button onClick={onClean} disabled={!cats.length} className="btn-primary mt-4">Clean image</button>
          </>
        )}
        {cleaned && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm">
            <p className="text-muted">
              Removed {cleaned.removed.map((r) => `${CATEGORY_INFO[r.category].label} (${formatBytes(r.bytes)})`).join(", ") || "nothing"} ·{" "}
              {formatBytes(cleaned.before)} → {formatBytes(cleaned.after)}
            </p>
            <a href={cleaned.url} download={cleaned.filename} className="btn-primary">Download {cleaned.filename}</a>
          </div>
        )}
      </Section>
      <Limitations items={CLEAN_LIMITS} />
    </>
  );
}
