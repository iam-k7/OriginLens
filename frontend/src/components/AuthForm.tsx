"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
        <form onSubmit={submit} className="card mt-8 space-y-4 p-6" noValidate={false}>
          {error && <Alert>{error}</Alert>}
          {info && <Alert kind="info">{info}</Alert>}
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
