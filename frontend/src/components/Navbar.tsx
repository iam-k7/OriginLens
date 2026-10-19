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

const chip = "pointer-events-auto rounded-md bg-white/90 shadow-[0_1px_2px_rgb(0_0_0/0.08)] ring-1 ring-line";

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
    `rounded-[4px] px-2.5 py-1.5 text-[13px] font-medium transition ${
      path === href ? "bg-surface text-ink" : "text-muted hover:text-ink"
    }`;

  // The sign-in screens have their own header, like the reference.
  if (path === "/login" || path === "/signup") return null;

  return (
    // Floating chips over the page panel, like the reference; the header itself lets clicks through.
    <header className="pointer-events-none fixed inset-x-4 top-4 z-40 sm:inset-x-6 sm:top-5">
      <nav className="flex items-start justify-between gap-3" aria-label="Main">
        <div className={`${chip} flex items-center gap-1 p-1.5 pl-2`}>
          <Logo size="sm" />
          <span className="mx-1.5 hidden h-5 w-px bg-line lg:block" aria-hidden="true" />
          <div className="hidden items-center gap-0.5 lg:flex">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkCls(l.href)} aria-current={path === l.href ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
          </div>
          <button
            className="ml-2 grid h-7 w-7 place-items-center rounded-[4px] bg-ink text-milk focus-visible:outline-2 focus-visible:outline-brand-500 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(!open)}
          >
            <span className="sr-only">Toggle menu</span>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M5 9h14M5 15h14" />}
            </svg>
          </button>
        </div>

        <div className="pointer-events-auto hidden items-center gap-1.5 lg:flex">
          {session ? (
            <>
              <span className={`${chip} max-w-48 truncate px-3 py-2 text-[13px] text-muted`} title={session.user.email}>
                {session.user.email}
              </span>
              <button onClick={signOut} className="btn-ghost py-2 text-[13px]">Log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost py-2 text-[13px]">Log in</Link>
              <Link href="/signup" className="btn-primary py-2 text-[13px]">Sign up</Link>
            </>
          )}
        </div>
      </nav>

      {open && (
        <div id="mobile-nav" className={`${chip} mt-2 max-w-sm p-2 lg:hidden`}>
          <div className="flex flex-col">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={`${linkCls(l.href)} py-2.5 text-sm`} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-2 flex gap-2 border-t border-line pt-2">
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
      )}
    </header>
  );
}
