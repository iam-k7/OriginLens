"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ErrorAlert, KV, Limitations, Section, Spinner, Tabs } from "@/components/ui";
import { api, ApiError, base64ToBlob, formatBytes } from "@/lib/api";
import { readMetadata, type Details } from "@/lib/readMetadata";
import { readCredentials, type Credentials } from "@/lib/c2paRead";
import { checkAiSignals, type AiSignals } from "@/lib/aiSignals";
import { MODEL_MB, pixelAiScore } from "@/lib/pixelCheck";
import { cleanBytes, findMetadata, sniffFormat, type CleanCategory, type Found } from "@/lib/cleanImage";

/* eslint-disable @typescript-eslint/no-explicit-any -- API payloads are rendered generically */
type TabId = "overview" | "metadata" | "provenance";
type Job = { name: string; size: number };

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
  "GPS lives inside EXIF, so it goes with EXIF.",
  "Works for JPEG, PNG and WEBP.",
];

const SENSITIVE = /gps|latitude|longitude|serial|owner|artist|author|creator|copyright|datetime|make|model|lens|software/i;

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
  const [details, setDetails] = useState<{ file: File; data: Details } | null>(null);
  const [credentials, setCredentials] = useState<{ file: File; data: Credentials } | null>(null);
  const [aiCheck, setAiCheck] = useState<{ file: File; result: AiSignals } | null>(null);
  const [found, setFound] = useState<{ file: File; items: Found[]; supported: boolean } | null>(null);
  const [cats, setCats] = useState<CleanCategory[]>([]);
  const [cleaned, setCleaned] = useState<{ url: string; filename: string; before: number; after: number; removed: Found[] } | null>(null);
  const [tab, setTab] = useState<TabId>("overview");
  const input = useRef<HTMLInputElement>(null);
  const current = useRef<File | null>(null); // the file on screen, so late results for an older file are dropped
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => () => { if (cleaned) URL.revokeObjectURL(cleaned.url); }, [cleaned]);

  // Everything is read on this device; nothing is sent to a server.
  const load = useCallback((f: File) => {
    current.current = f;
    const creds = readCredentials(f);
    creds.then((data) => setCredentials({ file: f, data })).catch(() => undefined);
    creds.then((c) => checkAiSignals(f, c)).then((result) => setAiCheck({ file: f, result })).catch(() => undefined);
    readMetadata(f).then((data) => setDetails({ file: f, data })).catch(() => {
      if (current.current === f) setError(new ApiError(0, "read_failed", "Could not read this image's metadata."));
    });
    f.arrayBuffer().then((buf) => {
      const bytes = new Uint8Array(buf);
      const items = findMetadata(bytes);
      setFound({ file: f, items, supported: sniffFormat(bytes) !== undefined });
      setCats(items.map((x) => x.category));
    }).catch(() => undefined);
  }, []);

  const reset = useCallback(() => {
    current.current = null;
    setFile(null); setPreview(null); setDetails(null); setCredentials(null); setAiCheck(null); setFound(null); setCats([]); setCleaned(null); setError(null); setJob(null); setTab("overview");
    if (input.current) input.current.value = "";
  }, []);

  const analyzeFile = useCallback(async (f: File) => {
    if (!ACCEPT.includes(f.type) && f.type !== "") {
      setError(new ApiError(0, "invalid_file", "Supported formats: JPEG, PNG, WEBP, GIF. SVG is not accepted."));
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) { setError(new ApiError(0, "invalid_file", `Images must be at most ${MAX_MB} MB.`)); return; }
    reset();
    // Logged-out visitors get one image check a day; the server counts it.
    try { await api("/usage/claim", { method: "POST", body: JSON.stringify({ tool: "image" }) }); } catch (e) { setError(e); return; }
    setFile(f); setPreview(URL.createObjectURL(f));
    setJob({ name: f.name, size: f.size });
    load(f);
  }, [reset, load]);

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
      const r = await api<{ image: { mime_type: string; base64: string } }>("/images/analyze-url", {
        method: "POST", body: JSON.stringify({ url: url.trim() }),
      });
      const blob = base64ToBlob(r.image.base64, r.image.mime_type);
      const name = new URL(url.trim()).pathname.split("/").pop() || "remote-image";
      const f = new File([blob], name, { type: r.image.mime_type });
      setFile(f);
      setPreview(URL.createObjectURL(blob));
      setJob({ name, size: blob.size });
      load(f);
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

  const d = details && details.file === file ? details.data : null;
  const ai = aiCheck && aiCheck.file === file ? aiCheck.result : null;
  const cr = credentials && credentials.file === file ? credentials.data : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Image Analyzer</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">Inspect, verify and clean an image</h1>
      <p className="mt-2 max-w-2xl text-muted">Metadata, Content Credentials and AI signals — read from the file itself, in your browser. Nothing is uploaded.</p>

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
                      {formatBytes(job.size)} · <span className="font-medium text-emerald-700">Ready</span>
                    </p>
                  </div>
                  <Icon d={CHECK_CIRCLE} className="h-6 w-6 shrink-0 text-emerald-600" />
                  <button type="button" onClick={reset} aria-label="Remove file" className={ICON_BTN}>
                    <Icon d={TRASH} />
                  </button>
                </div>
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
              <AiResult ai={ai} file={file} />
            </div>
          )}
          {found && found.file === file && (
            <CleanPanel items={found.items} supported={found.supported} cats={cats} setCats={setCats} onClean={runClean} cleaned={cleaned} />
          )}
          {!d && !busy && !error && !ai && !found && (
            <div className="card flex min-h-64 items-center justify-center p-8 text-center text-muted">
              Results appear here after you add an image.
            </div>
          )}

          {d && (
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
                    <KV data={{ Format: d.format, Dimensions: d.width ? `${d.width} × ${d.height}` : null, "File size": formatBytes(d.bytes), "SHA-256": d.sha256 }} />
                  </Section>
                  <Section title="Key details"><KV data={d.highlights} /></Section>
                  <Section title="Location">
                    {d.gps ? (
                      <>
                        <Alert kind="warn">This image reveals where it was taken.</Alert>
                        <div className="mt-3"><KV data={d.gps} /></div>
                        <a className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline" target="_blank" rel="noopener noreferrer"
                          href={`https://www.openstreetmap.org/?mlat=${d.gps.latitude}&mlon=${d.gps.longitude}#map=14/${d.gps.latitude}/${d.gps.longitude}`}>
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
                    {d.blocks.length ? (
                      <div className="flex flex-wrap gap-2">
                        {d.blocks.map((b) => (
                          <span key={b.category} className="chip border-line bg-surface">{CATEGORY_INFO[b.category].label} · {formatBytes(b.bytes)}</span>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted">No metadata blocks found.</p>}
                  </Section>
                  <Section title="All fields">
                    <KV data={d.fields} sensitive={Object.keys(d.fields).filter((k) => SENSITIVE.test(k))} />
                  </Section>
                  {!d.blocks.length && !Object.keys(d.fields).length && (
                    <Alert kind="info">No embedded metadata. This is common for screenshots and images saved from social platforms.</Alert>
                  )}
                </div>
              )}

              {tab === "provenance" && <Provenance present={d.blocks.some((b) => b.category === "c2pa")} creds={cr} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Provenance({ present, creds }: { present: boolean; creds: Credentials | null }) {
  if (!present) {
    return (
      <Section title="Content Credentials (C2PA)">
        <p className="text-sm text-muted">No Content Credentials found. Many cameras and apps don&apos;t add them, and most platforms strip them — absence is not evidence either way.</p>
      </Section>
    );
  }
  if (!creds) return <Section title="Content Credentials (C2PA)"><Spinner label="Reading Content Credentials" /></Section>;
  const verified = creds.validation === "Valid" || creds.validation === "Trusted";
  return (
    <Section title="Content Credentials (C2PA)" aside={creds.validation && (
      <span className={`chip ${verified ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-brand-200 bg-brand-50 text-brand-700"}`}>{creds.validation}</span>
    )}>
      {creds.error && <Alert kind="warn">{creds.error}</Alert>}
      <KV data={{
        "Claim generator": creds.generator, Title: creds.title, "Signed by": creds.issuer, "Signed at": creds.signedAt,
        "Digital source": creds.sourceTypes, "Validation issues": creds.issues,
      }} />
    </Section>
  );
}

const VERDICT: Record<string, string> = {
  declared_ai: "The file declares AI generation",
  ai_indicators: "The file contains AI-related indicators",
  camera_indicators: "The file contains camera capture data",
  inconclusive: "No AI label written in the file",
};

function AiResult({ ai, file }: { ai: any; file: File | null }) {
  const stripped = ai.verdict === "inconclusive" && ai.evidence.some((e: any) => e.signal === "No embedded metadata");
  return (
    <>
      <Section title="File labels" aside={<span className="chip border-line">Confidence: {ai.confidence}</span>}>
        <p className="font-display text-xl font-semibold">{stripped ? "Can't tell: no metadata is left in this file" : VERDICT[ai.verdict]}</p>
        {stripped && (
          <Alert kind="warn">
            Chat apps, screenshots and converters remove the labels that say how an image was made, so an AI image and a real photo look the same here.
            This result reads the file&apos;s labels only; the pixel check below looks at the picture itself.
          </Alert>
        )}
        {!stripped && (
          <p className="mt-1 text-sm text-muted">This reads only the labels written into the file. The pixel check below looks at the picture itself, so the two can disagree.</p>
        )}
      </Section>
      {file && <PixelCheck key={`${file.name}-${file.size}-${file.lastModified}`} file={file} />}
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

/** Experimental pixel model, run on request because the model is an 87 MB download the first time. */
function PixelCheck({ file }: { file: File }) {
  const [state, setState] = useState<{ step: "idle" | "download" | "run" | "done" | "error"; progress?: number; score?: number; error?: string }>({ step: "idle" });

  async function run() {
    setState({ step: "download", progress: 0 });
    try {
      const score = await pixelAiScore(file, (progress) => setState({ step: progress < 1 ? "download" : "run", progress }));
      setState({ step: "done", score });
    } catch (e) {
      setState({ step: "error", error: e instanceof Error ? e.message : String(e) });
    }
  }

  const pct = state.score === undefined ? 0 : Math.round(state.score * 100);
  return (
    <Section title="Pixel check" aside={<span className="chip border-line">Experimental</span>}>
      {state.step === "idle" && (
        <>
          <p className="text-sm text-muted">
            Looks at the picture itself with an open AI-image model (Community Forensics). It runs on your device; the image is not uploaded.
          </p>
          <button onClick={run} className="btn-dark mt-3">Run pixel check · {MODEL_MB} MB download the first time</button>
        </>
      )}
      {state.step === "download" && <Spinner label={`Downloading the model… ${Math.round((state.progress ?? 0) * 100)}%`} />}
      {state.step === "run" && <Spinner label="Checking the picture…" />}
      {state.step === "error" && <Alert kind="error">The pixel check failed: {state.error}</Alert>}
      {state.step === "done" && (
        <>
          <p className="font-display text-xl font-semibold">AI likelihood: {pct}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface" role="img" aria-label={`AI likelihood ${pct}%`}>
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
          </div>
          <Alert kind="warn">
            Experimental. In our tests it flagged no real photos as AI, but it missed some AI images with a very low score.
            A low score does not prove an image is real, and a high score is not proof on its own.
          </Alert>
        </>
      )}
    </Section>
  );
}
