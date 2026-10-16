"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/analyzer", label: "Image Analyzer" },
  { href: "/text", label: "Text and Blog Intelligence" },
  { href: "/pricing", label: "Pricing" },
];

export function Navbar() {
  const path = usePathname();
  const router = useRouter();
  const { session } = useSession();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase?.auth.signOut();
    router.push("/");
  }

  const linkCls = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      path === href ? "text-brand-600" : "text-muted hover:text-ink"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Main">
        <Logo />
        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls(l.href)} aria-current={path === l.href ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          {session ? (
            <>
              <span className="max-w-44 truncate text-sm text-muted" title={session.user.email}>{session.user.email}</span>
              <button onClick={signOut} className="btn-ghost">Log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Log in</Link>
              <Link href="/signup" className="btn-primary">Sign up</Link>
            </>
          )}
        </div>
        <button
          className="btn-ghost px-3 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(!open)}
        >
          <span className="sr-only">Toggle menu</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>
      {open && (
        <div id="mobile-nav" className="border-t border-line bg-white px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkCls(l.href)} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {session ? (
                <button onClick={signOut} className="btn-ghost flex-1">Log out</button>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost flex-1" onClick={() => setOpen(false)}>Log in</Link>
                  <Link href="/signup" className="btn-primary flex-1" onClick={() => setOpen(false)}>Sign up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
