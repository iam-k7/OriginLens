"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

const KEY = "originlens-privacy-choice";
const listeners = new Set<() => void>();
let memory: string | null = null; // used when localStorage is blocked, so the banner still closes

function read(): string | null {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

function choose(value: "accepted" | "rejected") {
  memory = value;
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* storage blocked: the in-memory choice lasts for this page view */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function PrivacyBanner() {
  // Server snapshot is non-null so nothing renders until the browser has read the saved choice.
  const choice = useSyncExternalStore(subscribe, read, () => "pending");
  if (choice !== null) return null;
  return (
    <div
      role="region"
      aria-label="Privacy notice"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-white/80 bg-milk/95 p-4 shadow-md backdrop-blur-xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:mx-0"
    >
      <p className="text-sm text-muted">
        We use only essential browser storage to keep you signed in. No ads, no tracking. See our{" "}
        <Link href="/privacy" className="font-medium text-brand-600 underline">Privacy Policy</Link>.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => choose("rejected")} className="btn-ghost px-3 py-1.5 text-xs">Reject</button>
        <button type="button" onClick={() => choose("accepted")} className="btn-primary px-3 py-1.5 text-xs">Accept</button>
      </div>
    </div>
  );
}
