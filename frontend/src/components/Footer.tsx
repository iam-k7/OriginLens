import Link from "next/link";
import { Logo } from "./Logo";

const COLS = [
  { title: "Product", links: [["/analyzer", "Image Analyzer"], ["/text", "Text and Blog Intelligence"], ["/pricing", "Pricing"]] },
  { title: "Account", links: [["/login", "Log in"], ["/signup", "Sign up"]] },
  { title: "Legal", links: [["/privacy", "Privacy Policy"]] },
];

export function Footer() {
  return (
    <footer className="text-milk">
      <div className="mx-auto grid max-w-6xl gap-10 border-t border-milk/10 px-4 pb-10 pt-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="light" size="sm" />
          <p className="mt-3 max-w-xs text-sm text-dim">Images are processed in memory and never stored. Signals are evidence, not verdicts.</p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h2 className="text-xs text-dim">{c.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map(([href, label]) => (
                <li key={href}><Link className="text-milk/90 hover:text-milk" href={href}>{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-6 text-xs text-dim sm:px-6">© OriginLens</p>
    </footer>
  );
}
