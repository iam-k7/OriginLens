import type { ReactNode } from "react";
import { ApiError } from "@/lib/api";

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" aria-hidden="true" />
      {label}
    </span>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "info" | "warn"; children: ReactNode }) {
  const cls = {
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-line bg-surface text-muted",
    warn: "border-brand-200 bg-brand-50 text-brand-800",
  }[kind];
  return (
    <div role={kind === "error" ? "alert" : "note"} className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  );
}

export function ErrorAlert({ error }: { error: unknown }) {
  if (!error) return null;
  const e = error instanceof ApiError ? error : null;
  return (
    <Alert>
      {e ? e.message : "Something went wrong."}
      {e?.requestId && <span className="mt-1 block text-xs opacity-70">Reference: {e.requestId}</span>}
    </Alert>
  );
}

function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.map(fmt).join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function KV({ data, sensitive = [] }: { data: Record<string, unknown>; sensitive?: string[] }) {
  const entries = Object.entries(data ?? {});
  if (!entries.length) return <p className="text-sm text-muted">None found.</p>;
  return (
    <dl className="divide-y divide-line text-sm">
      {entries.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-2">
          <dt className="flex items-center gap-1.5 truncate font-medium text-ink" title={k}>
            {k}
            {sensitive.includes(k) && <span className="chip border-brand-200 bg-brand-50 text-brand-700">sensitive</span>}
          </dt>
          <dd className="break-words font-mono text-xs text-muted">{fmt(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-brand-500 ${
            value === t.id ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Limitations({ items }: { items: string[] }) {
  return (
    <details className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium">Limitations</summary>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        {items.map((l) => <li key={l}>{l}</li>)}
      </ul>
    </details>
  );
}
