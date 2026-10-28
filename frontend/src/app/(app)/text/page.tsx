"use client";

import { useState } from "react";
import { Alert, ErrorAlert, KV, Limitations, Section, Spinner, Tabs } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { analyzeText } from "@/lib/textAnalysis";

/* eslint-disable @typescript-eslint/no-explicit-any -- API payloads are rendered generically */
const MAX = 20000;
const TONES = ["neutral", "friendly", "formal", "concise", "academic", "humanize"] as const;
type Mode = "analyze" | "rewrite";

export default function TextPage() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("analyze");
  const [deep, setDeep] = useState(false);
  const [tone, setTone] = useState<(typeof TONES)[number]>("neutral");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [rewrite, setRewrite] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  async function onFile(f: File | undefined) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".txt") || f.size > 200_000) {
      setError(new ApiError(0, "invalid_file", "Upload a .txt file up to 200 KB."));
      return;
    }
    setText((await f.text()).slice(0, MAX));
  }

  async function run() {
    setBusy(true); setError(null);
    try {
      if (mode === "analyze") {
        // The counting runs here in the browser; Deep Scan is an AI call, counted by its own route.
        const deepScan = deep
          ? await api("/text/deep-scan", { method: "POST", body: JSON.stringify({ text }) })
          : await api("/usage/claim", { method: "POST", body: JSON.stringify({ tool: "text" }) }).then(() => undefined);
        setAnalysis({ ...analyzeText(text), mode: deep ? "deep" : "standard", deep_scan: deepScan });
      } else {
        setRewrite(await api("/text/rewrite", { method: "POST", body: JSON.stringify({ text, tone }) }));
      }
    } catch (e) { setError(e); } finally { setBusy(false); }
  }

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Text and Blog Intelligence</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">Read your writing clearly</h1>
      <p className="mt-2 max-w-2xl text-muted">Explainable style signals, sentence by sentence — and a rewrite that keeps your meaning. Your text is not stored.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Tabs<Mode> value={mode} onChange={setMode} tabs={[{ id: "analyze", label: "Analyze" }, { id: "rewrite", label: "Rewrite Naturally" }]} />
          <div className="card p-4">
            <label htmlFor="text" className="sr-only">Your text</label>
            <textarea id="text" value={text} maxLength={MAX} onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type your text here…" className="input min-h-80 resize-y border-0 p-1 focus:ring-0" />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
              <span>{words} words · {text.length}/{MAX}</span>
              <div className="flex gap-2">
                <label className="btn-ghost cursor-pointer px-3 py-1.5 text-xs">
                  Upload .txt
                  <input type="file" accept=".txt,text/plain" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
                </label>
                <button className="btn-ghost px-3 py-1.5 text-xs" onClick={async () => setText((await navigator.clipboard.readText()).slice(0, MAX))}>Paste</button>
                <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => { setText(""); setAnalysis(null); setRewrite(null); }}>Clear</button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {mode === "analyze" ? (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={deep} onChange={(e) => setDeep(e.target.checked)} className="accent-brand-500" />
                Deep Scan <span className="text-muted">(adds an AI style review; uses an AI credit)</span>
              </label>
            ) : (
              <label className="flex items-center gap-2 text-sm">
                Tone
                <select value={tone} onChange={(e) => setTone(e.target.value as typeof tone)} className="input w-auto py-1.5 capitalize">
                  {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            )}
            <button onClick={run} disabled={busy || !text.trim()} className="btn-primary ml-auto">
              {mode === "analyze" ? (deep ? "Run Deep Scan" : "Run Standard Scan") : "Rewrite"}
            </button>
          </div>
        </div>

        <div className="min-w-0 space-y-4" aria-live="polite">
          {busy && <div className="card p-5"><Spinner label={mode === "analyze" ? "Analyzing" : "Rewriting"} /></div>}
          <ErrorAlert error={error} />
          {mode === "analyze" && analysis && <AnalysisView a={analysis} />}
          {mode === "rewrite" && rewrite && (
            <Section title="Rewritten text" aside={
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={async () => { await navigator.clipboard.writeText(rewrite.text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                {copied ? "Copied" : "Copy"}
              </button>
            }>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{rewrite.text}</p>
              <p className="mt-4 text-xs text-muted">{rewrite.note}</p>
            </Section>
          )}
          {!busy && !error && !(mode === "analyze" ? analysis : rewrite) && (
            <div className="card flex min-h-64 items-center justify-center p-8 text-center text-muted">Results appear here.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalysisView({ a }: { a: any }) {
  return (
    <>
      <Alert kind="info">
        <strong className="text-ink">AI detection score: unavailable.</strong> {a.detector.reason} Signal reliability for this length: <strong className="text-ink">{a.signal_reliability}</strong>.
      </Alert>
      <Section title="Overview">
        <KV data={{ Words: a.stats.words, Sentences: a.stats.sentences, "Avg. sentence length": `${a.stats.avg_sentence_words} words`,
          "Reading ease (Flesch)": a.stats.flesch_reading_ease, "Reading time": `${a.stats.reading_time_min} min` }} />
      </Section>
      <Section title="Style signals">
        <ul className="divide-y divide-line">
          {a.signals.map((s: any) => (
            <li key={s.name} className="py-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{s.name}</span>
                <span className="chip border-line">{s.observation}</span>
              </div>
              <p className="mt-1 text-muted">{s.explanation}</p>
            </li>
          ))}
        </ul>
      </Section>
      {a.deep_scan && (
        <Section title="Deep Scan — style review">
          <Alert kind="warn">{a.deep_scan.disclaimer}</Alert>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{a.deep_scan.observations.map((o: string) => <li key={o}>{o}</li>)}</ul>
          {a.deep_scan.suggestions.length > 0 && (
            <>
              <h4 className="mt-4 text-sm font-semibold">Suggestions</h4>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">{a.deep_scan.suggestions.map((o: string) => <li key={o}>{o}</li>)}</ul>
            </>
          )}
        </Section>
      )}
      <Section title="Sentences">
        <ol className="space-y-2 text-sm">
          {a.sentences.map((s: any) => {
            const note = a.deep_scan?.sentence_notes?.find((n: any) => n.index === s.index)?.note;
            return (
              <li key={s.index} className={`rounded-lg border px-3 py-2 ${s.flags.length || note ? "border-brand-200 bg-brand-50/60" : "border-line"}`}>
                <p>{s.text}</p>
                <p className="mt-1 text-xs text-muted">
                  {s.words} words{s.flags.length ? ` · ${s.flags.join(", ")}` : ""}{note ? ` · ${note}` : ""}
                </p>
              </li>
            );
          })}
        </ol>
      </Section>
      <Limitations items={a.limitations} />
    </>
  );
}
