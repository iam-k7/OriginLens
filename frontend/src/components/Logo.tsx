import Link from "next/link";

/** Vector redraw of the OriginLens mark: lens inside an arch, with an "L" foot. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ol-mark" gradientUnits="userSpaceOnUse" x1="8" y1="94" x2="94" y2="4">
          <stop offset="0" stopColor="#FF5A00" />
          <stop offset="1" stopColor="#FFA41F" />
        </linearGradient>
      </defs>
      <g fill="url(#ol-mark)">
        <path d="M43.75 82.45 A36 36 0 1 1 86 47 L86 68" fill="none" stroke="url(#ol-mark)" strokeWidth="18" />
        <circle cx="48" cy="49" r="17" />
        <rect x="50" y="49" width="12" height="45" rx="1.5" />
        <rect x="50" y="76" width="47" height="18" rx="2.5" />
      </g>
      <path d="M38.2 45.5 A11 11 0 0 1 45.5 38.3" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const lg = size === "lg";
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-brand-500" aria-label="OriginLens home">
      <LogoMark className={lg ? "h-11 w-11" : "h-8 w-8"} />
      <span className={`font-logo font-semibold tracking-tight text-ink ${lg ? "text-3xl" : "text-[1.35rem]"}`}>
        OriginLens
      </span>
    </Link>
  );
}
