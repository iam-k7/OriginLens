/** Full-bleed dark backdrop with blurred glows for sign-in and sign-up, after the reference screen. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative isolate flex min-h-[calc(100svh-1rem)] flex-col overflow-hidden rounded-xl bg-ink sm:min-h-[calc(100svh-1.5rem)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand-500/60 blur-[130px]" />
        <div className="absolute -bottom-56 -left-44 h-[38rem] w-[38rem] rounded-full bg-brand-300/45 blur-[140px]" />
        <div className="absolute -bottom-44 -right-32 h-[30rem] w-[30rem] rounded-full bg-[#b3341a]/70 blur-[130px]" />
        <div className="absolute left-1/4 top-1/2 h-80 w-80 rounded-full bg-brand-800/50 blur-[120px]" />
      </div>
      {children}
    </div>
  );
}
