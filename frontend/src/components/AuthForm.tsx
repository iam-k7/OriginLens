"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { Logo } from "./Logo";

// Country names from the browser's built-in region list; these codes are not countries.
const NOT_COUNTRIES = new Set(["AC", "AN", "BU", "CP", "CS", "DD", "DG", "EA", "EU", "EZ", "IC", "NT", "QO", "SU", "TA", "TP", "UN", "YU", "ZR"]);
const COUNTRIES = (() => {
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const list = new Set<string>();
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b);
      const name = names.of(code) ?? code;
      if (name !== code && !NOT_COUNTRIES.has(code)) list.add(name);
    }
  }
  return [...list].sort((x, y) => x.localeCompare(y));
})();

// The list is built in the browser only: server and browser ICU data name some countries differently.
const noCountries: string[] = [];
const subscribeNone = () => () => {};
const countriesSnapshot = () => COUNTRIES;

const FIELD = "h-14 w-full rounded-full border border-milk/15 bg-ink-2 px-6 text-[15px] text-milk outline-none transition placeholder:text-milk/40 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-45";
const SOCIAL = "flex h-12 flex-1 items-center justify-center gap-2.5 rounded-full border border-milk/15 bg-ink-2 px-5 text-[15px] font-medium text-milk transition hover:border-milk/35 focus-visible:outline-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-50";
const PRIMARY = "h-12 w-full rounded-full bg-brand-500 px-6 text-[15px] font-semibold text-ink transition hover:bg-brand-400 focus-visible:outline-2 focus-visible:outline-milk disabled:cursor-not-allowed disabled:opacity-45";
const SUB_BTN = "rounded-full border border-milk/15 bg-ink-2 px-5 text-sm font-medium text-milk transition hover:border-milk/35 disabled:cursor-not-allowed disabled:opacity-40";
const LINK = "font-medium text-brand-300 underline-offset-4 hover:underline";
const MAIL_ICON = "pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-milk/60";
// Matches the Email OTP expiry set in Supabase (Auth → Providers → Email) and its 60s resend limit.
const CODE_SECONDS = 60;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const signup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [verified, setVerified] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // OAuth providers send failures back to this page as an error in the URL.
  const oauthError = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(location.search + "&" + location.hash.slice(1)).get("error_description"),
    () => null,
  );

  const countries = useSyncExternalStore(subscribeNone, countriesSnapshot, () => noCountries);

  // Signed in already, or just returned from Google/GitHub: go to the analyzer.
  // Runs once on load only, so the sign-up steps are not skipped after the code is verified.
  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/analyzer");
    });
  }, [router]);

  // Tick once a second while a code is waiting to be entered.
  useEffect(() => {
    if (sentAt === null || verified) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [sentAt, verified]);

  const codeSent = sentAt !== null;
  const secondsLeft = codeSent ? Math.max(0, CODE_SECONDS - Math.floor((now - sentAt) / 1000)) : 0;
  const canSend = name.trim().length > 1 && /^\S+@\S+\.\S+$/.test(email) && secondsLeft === 0;
  const canCreate = verified && name.trim() !== "" && country !== "" && password !== "" && confirm !== "";

  async function oauth(provider: "google" | "github") {
    if (!supabase) { setError("Sign-in is not configured on this deployment."); return; }
    setBusy(true); setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}/login` } });
    if (error) { setError(error.message); setBusy(false); }
  }

  // Sign-up step 1: email a 6-digit code. This creates the account without a password yet.
  async function sendCode() {
    if (!supabase) return;
    setBusy(true); setError(null); setInfo(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, data: { full_name: name.trim() } },
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    const t = Date.now();
    setSentAt(t); setNow(t); setCode("");
    setInfo(`We sent a 6-digit code to ${email}.`);
  }

  // Sign-up step 2: check the code. A verified code signs the user in.
  async function verifyCode() {
    if (!supabase) return;
    setBusy(true); setError(null);
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setVerified(true);
    setInfo("Email verified. Finish setting up your account below.");
  }

  // Sign-up step 3: set the password and profile details on the verified account.
  async function createAccount(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (password.length < 10) { setError("Use at least 10 characters for your password."); return; }
    if (password !== confirm) { setError("The passwords do not match."); return; }
    setBusy(true); setError(null);
    // Saving the country completes the profile, which makes Supabase send the welcome email.
    const { error } = await supabase.auth.updateUser({ password, data: { full_name: name.trim(), country } });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setInfo(null);
    setDone(true);
  }

  async function login(e: FormEvent) {
    e.preventDefault();
    if (!supabase) { setError("Sign-in is not configured on this deployment."); return; }
    setBusy(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setError(error.message); return; }
    router.replace("/analyzer");
  }

  const shownError = error ?? oauthError;

  return (
    <div className="relative z-10 flex flex-1 flex-col items-center px-4 pb-16 pt-10 text-milk sm:pt-14">
      <Logo tone="light" />

      <h1 className="mt-16 max-w-3xl text-balance text-center font-serif text-5xl leading-[1.02] sm:mt-24 sm:text-7xl">
        {signup ? "Get started with OriginLens" : "Welcome back"}
      </h1>
      <p className="mt-6 text-sm text-dim">{signup ? "Continue with" : "Log in with"}</p>

      <div className="mt-3 flex w-full max-w-md gap-3">
        <button type="button" disabled={busy} onClick={() => oauth("google")} className={SOCIAL}>
          <GoogleIcon /> Google
        </button>
        <button type="button" disabled={busy} onClick={() => oauth("github")} className={SOCIAL}>
          <GithubIcon /> GitHub
        </button>
      </div>

      <div className="my-7 flex w-full max-w-md items-center gap-4 text-[11px] font-semibold tracking-[0.2em] text-dim" aria-hidden="true">
        <span className="h-px flex-1 bg-white/15" />
        OR
        <span className="h-px flex-1 bg-white/15" />
      </div>

      {shownError && (
        <p role="alert" className="mb-4 w-full max-w-md rounded-2xl border border-red-300/30 bg-red-500/10 px-5 py-3 text-sm text-red-100">
          {shownError}
        </p>
      )}
      {info && (
        <p role="status" className="mb-4 w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm text-milk/85">
          {info}
        </p>
      )}

      {signup && done ? (
        <div role="status" className="flex w-full max-w-md flex-col items-center rounded-3xl border border-emerald-300/30 bg-emerald-500/10 px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300"><CheckIcon /></span>
          <h2 className="mt-4 font-serif text-3xl">Your account is ready</h2>
          <p className="mt-3 text-sm text-milk/80">
            Welcome to OriginLens, {name.trim()}. We&apos;ve sent a welcome email to <strong className="text-milk">{email}</strong>.
          </p>
          <Link href="/analyzer" className={`${PRIMARY} mt-7 flex items-center justify-center`}>Start analysing</Link>
        </div>
      ) : signup ? (
        <form onSubmit={createAccount} className="flex w-full max-w-md flex-col gap-3">
          <input aria-label="Full name" autoComplete="name" placeholder="Full name" value={name} disabled={verified}
            onChange={(e) => setName(e.target.value)} className={FIELD} />

          <div className="relative">
            <MailIcon className={MAIL_ICON} />
            <input type="email" aria-label="Email address" autoComplete="email" placeholder="you@gmail.com" value={email}
              disabled={verified} onChange={(e) => {
                setEmail(e.target.value);
                // A sent code belongs to the old address: start over so the new one can get its own code.
                if (codeSent) { setSentAt(null); setCode(""); setInfo(null); }
              }} className={`${FIELD} pl-14 pr-36`} />
            {verified ? (
              <span className="absolute right-6 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-sm font-medium text-emerald-300">
                <CheckIcon /> Verified
              </span>
            ) : (
              <button type="button" onClick={sendCode} disabled={busy || !canSend} className={`${SUB_BTN} absolute right-1.5 top-1.5 h-11`}>
                {!codeSent ? "Send code" : secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Resend code"}
              </button>
            )}
          </div>

          {codeSent && !verified && (
            <div className="flex gap-2">
              <input aria-label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code"
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={FIELD} />
              <button type="button" onClick={verifyCode} disabled={busy || code.length !== 6 || secondsLeft === 0} className={`${SUB_BTN} h-14 shrink-0`}>
                Verify
              </button>
            </div>
          )}
          {codeSent && !verified && (
            <p className="px-6 text-xs text-dim">
              {secondsLeft > 0 ? `The code expires in ${secondsLeft}s.` : "This code has expired. Send a new one."}
            </p>
          )}

          {/* Options get their own colours: Windows browsers draw the open list with the select's dark background. */}
          <select aria-label="Country" value={country} onChange={(e) => setCountry(e.target.value)} className={`${FIELD} pr-12`}>
            <option value="" disabled className="bg-ink-2 text-milk">Select your country</option>
            {countries.map((c) => <option key={c} value={c} className="bg-ink-2 text-milk">{c}</option>)}
          </select>

          <input type="password" aria-label="Create password" autoComplete="new-password" placeholder="Create password" minLength={10}
            value={password} disabled={!verified} onChange={(e) => setPassword(e.target.value)} className={FIELD} />
          <input type="password" aria-label="Confirm password" autoComplete="new-password" placeholder="Confirm password"
            value={confirm} disabled={!verified} onChange={(e) => setConfirm(e.target.value)} className={FIELD} />
          <p className="px-6 text-xs text-dim">At least 10 characters.</p>

          <button type="submit" disabled={busy || !canCreate} className={`${PRIMARY} mt-1`}>
            {busy ? "Please wait…" : "Create account"}
          </button>
          <p className="mt-2 text-center text-sm text-dim">
            Already have an account? <Link href="/login" className={LINK}>Log in</Link>
          </p>
          <p className="text-center text-xs text-dim">
            By creating an account you agree to our <Link href="/privacy" className={LINK}>Privacy Policy</Link>.
          </p>
        </form>
      ) : (
        <form onSubmit={login} className="flex w-full max-w-md flex-col gap-3">
          <div className="relative">
            <MailIcon className={MAIL_ICON} />
            <input type="email" aria-label="Email" autoComplete="email" placeholder="Email" value={email} required
              onChange={(e) => setEmail(e.target.value)} className={`${FIELD} pl-14`} />
          </div>
          <input type="password" aria-label="Password" autoComplete="current-password" placeholder="Password" value={password} required
            onChange={(e) => setPassword(e.target.value)} className={FIELD} />
          <button type="submit" disabled={busy || !email || !password} className={`${PRIMARY} mt-1`}>
            {busy ? "Please wait…" : "Log in"}
          </button>
          <p className="mt-2 text-center text-sm text-dim">
            New here? <Link href="/signup" className={LINK}>Create your own account</Link>
          </p>
        </form>
      )}
    </div>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7.5 8 5.5 8-5.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.2 4.2L19 7.5" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 01-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0012 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 010-4.6V6.6H1.3a12 12 0 000 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 001.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 016 0C17.3 4.7 18.3 5 18.3 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0012 .5z" />
    </svg>
  );
}
