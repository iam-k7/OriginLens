import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted">
            Understand where your content comes from. Images are processed in memory and never stored.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Product</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link className="hover:text-ink" href="/analyzer">Image Analyzer</Link></li>
            <li><Link className="hover:text-ink" href="/text">Text and Blog Intelligence</Link></li>
            <li><Link className="hover:text-ink" href="/pricing">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Trust</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>No uploads stored</li>
            <li>No fabricated scores</li>
            <li>C2PA-aware provenance</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">
        © OriginLens. Signals are evidence, not verdicts.
      </div>
    </footer>
  );
}
