"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorAlert, Spinner } from "@/components/ui";
import { api } from "@/lib/api";

type Plan = { id: string; name: string; description: string; price: { USD: number; INR: number }; limits_per_day: Record<string, number> };
type Pricing = { currency: { usd_inr_rate: number; rate_source: string }; plans: Plan[] };

const LIMIT_LABELS: Record<string, string> = { image: "image analyses / day", text: "text scans / day", llm: "AI rewrites & deep scans / day" };

export default function PricingPage() {
  const [data, setData] = useState<Pricing | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [cur, setCur] = useState<"USD" | "INR">("USD");

  useEffect(() => { api<Pricing>("/pricing").then(setData).catch(setError); }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <p className="eyebrow">Pricing</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Simple, fair plans</h1>
        <p className="mt-3 text-muted">Clear daily limits keep the service fast and affordable for everyone.</p>
        <div role="radiogroup" aria-label="Currency" className="mt-6 inline-flex rounded-xl border border-line bg-surface p-1">
          {(["USD", "INR"] as const).map((c) => (
            <button key={c} role="radio" aria-checked={cur === c} onClick={() => setCur(c)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium ${cur === c ? "bg-white shadow-sm" : "text-muted"}`}>{c}</button>
          ))}
        </div>
      </div>
      <div className="mt-10">
        <ErrorAlert error={error} />
        {!data && !error && <div className="text-center"><Spinner label="Loading plans" /></div>}
        {data && (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              {data.plans.map((p) => {
                const pro = p.id === "pro";
                return (
                  <div key={p.id} className={`card relative p-8 ${pro ? "border-brand-300 ring-4 ring-brand-50" : ""}`}>
                    {pro && <span className="chip absolute right-6 top-6 border-brand-200 bg-brand-50 text-brand-700">Most popular</span>}
                    <h2 className="font-display text-xl font-semibold">{p.name}</h2>
                    <p className="mt-1 text-sm text-muted">{p.description}</p>
                    <p className="mt-6 font-display text-4xl font-semibold">
                      {cur === "USD" ? `$${p.price.USD}` : `₹${p.price.INR}`}
                      <span className="text-base font-normal text-muted">/month</span>
                    </p>
                    <ul className="mt-6 space-y-2 text-sm">
                      {Object.entries(p.limits_per_day).map(([k, v]) => (
                        <li key={k} className="flex gap-2"><span className="text-brand-500" aria-hidden="true">✓</span>{v} {LIMIT_LABELS[k] ?? k}</li>
                      ))}
                      <li className="flex gap-2"><span className="text-brand-500" aria-hidden="true">✓</span>No daily image limit</li>
                      <li className="flex gap-2"><span className="text-brand-500" aria-hidden="true">✓</span>Lossless Privacy Clean</li>
                      <li className="flex gap-2"><span className="text-brand-500" aria-hidden="true">✓</span>C2PA provenance checks</li>
                    </ul>
                    {pro ? (
                      <button disabled className="btn-primary mt-8 w-full" title="Checkout is not yet available">Upgrade — coming soon</button>
                    ) : (
                      <Link href="/signup" className="btn-ghost mt-8 w-full">Get started free</Link>
                    )}
                  </div>
                );
              })}
            </div>
            {cur === "INR" && (
              <p className="mt-6 text-center text-xs text-muted">
                INR prices use a rate of ₹{data.currency.usd_inr_rate} per USD ({data.currency.rate_source === "live" ? "live, refreshed every 12 hours" : "fallback rate"}).
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
