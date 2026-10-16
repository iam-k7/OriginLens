"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { LogoMark } from "./Logo";
import { Alert } from "./ui";
import { supabase } from "@/lib/supabase";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const signup = mode === "signup";

  // OAuth providers redirect back here; supabase-js reads the session from the URL on load.
  const oauthError = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(location.search + "&" + location.hash.slice(1)).get("error_description"),
    () => null,
  );
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_e, session) => { if (session) router.replace("/analyzer"); });
    return () => data.subscription.unsubscribe();
  }, [router]);

  async function oauth(provider: "google" | "github") {
    if (!supabase) { setError("Sign-in is not configured on this deployment."); return; }
    setBusy(true); setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}/login` } });
    if (error) { setError(error.message); setBusy(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) { setError("Sign-in is not configured on this deployment."); return; }
    setBusy(true); setError(null); setInfo(null);
    const { data, error } = signup
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/analyzer` } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setError(error.message); return; }
    if (signup && !data.session) { setInfo("Check your inbox to confirm your email, then log in."); return; }
    router.push("/analyzer");
  }

  return (
    <div className="relative">
      <div className="texture-lines pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-md flex-col px-4 py-16">
        <LogoMark className="mx-auto h-12 w-12" />
        <h1 className="mt-5 text-center font-display text-3xl font-semibold tracking-tight">
          {signup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          {signup ? "Free plan included. No card required." : "Log in to see your plan and usage."}
        </p>
        <form onSubmit={submit} className="card mt-8 space-y-4 p-6">
          {(error ?? oauthError) && <Alert>{error ?? oauthError}</Alert>}
          {info && <Alert kind="info">{info}</Alert>}
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" disabled={busy} onClick={() => oauth("google")} className="btn-ghost">
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 01-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
                <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0012 24z" />
                <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 010-4.6V6.6H1.3a12 12 0 000 10.8l4-3.1z" />
                <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 001.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
              </svg>
              Continue with Google
            </button>
            <button type="button" disabled={busy} onClick={() => oauth("github")} className="btn-ghost">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M12 .5a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 016 0C17.3 4.7 18.3 5 18.3 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0012 .5z" />
              </svg>
              Continue with GitHub
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />or with email<span className="h-px flex-1 bg-line" />
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input id="password" type="password" required minLength={signup ? 10 : undefined}
              autoComplete={signup ? "new-password" : "current-password"} value={password}
              onChange={(e) => setPassword(e.target.value)} className="input" aria-describedby={signup ? "pw-hint" : undefined} />
            {signup && <p id="pw-hint" className="mt-1 text-xs text-muted">At least 10 characters.</p>}
          </div>
          <button disabled={busy} className="btn-primary w-full">{busy ? "Please wait…" : signup ? "Sign up" : "Log in"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          {signup ? "Already have an account? " : "New to OriginLens? "}
          <Link href={signup ? "/login" : "/signup"} className="font-medium text-brand-600 hover:underline">
            {signup ? "Log in" : "Create an account"}
          </Link>
        </p>
      </div>
    </div>
  );
}
