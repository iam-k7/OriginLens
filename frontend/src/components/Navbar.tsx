"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/analyzer", label: "Image Analyzer" },
  { href: "/text", label: "Text and Blog Intelligence" },
  { href: "/blog", label: "Blog" },
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
              <UserMenu user={session.user} onSignOut={signOut} />
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
              <>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Avatar user={session.user} />
                  <span className="truncate text-sm text-muted">{session.user.email}</span>
                </div>
                <button onClick={signOut} className="btn-ghost">Log out</button>
              </>
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

const displayName = (user: User): string => (user.user_metadata.full_name || user.user_metadata.name || user.email || "").trim();

/** Google/GitHub profile photo when there is one, otherwise the initials of the name or email. */
function Avatar({ user }: { user: User }) {
  const [broken, setBroken] = useState(false);
  const photo: string | undefined = user.user_metadata.avatar_url || user.user_metadata.picture;
  const initials = displayName(user).split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

  if (photo && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small remote avatar; next/image would add an optimiser round trip
      <img src={photo} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-line" />
    );
  }
  return (
    <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500 text-[12px] font-semibold text-ink">
      {initials}
    </span>
  );
}

function UserMenu({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on a click outside the menu or on Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const name = displayName(user);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`${chip} grid place-items-center rounded-full p-1 focus-visible:outline-2 focus-visible:outline-brand-500`}
      >
        <span className="sr-only">Account menu for {name}</span>
        <Avatar user={user} />
      </button>
      {open && (
        <div role="menu" className={`${chip} absolute right-0 mt-2 w-64 p-2`}>
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar user={user} />
            <div className="min-w-0">
              {name !== user.email && <p className="truncate text-sm font-semibold text-ink">{name}</p>}
              <p className="truncate text-[13px] text-muted">{user.email}</p>
            </div>
          </div>
          <button role="menuitem" onClick={onSignOut} className="mt-1 w-full rounded-[4px] px-2 py-2 text-left text-[13px] font-medium text-ink hover:bg-surface">
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
