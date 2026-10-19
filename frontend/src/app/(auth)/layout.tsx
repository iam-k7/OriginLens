/** Plain dark backdrop with the site's grid texture for sign-in and sign-up. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="texture-grid-dark flex min-h-[calc(100svh-1rem)] flex-col rounded-xl bg-ink sm:min-h-[calc(100svh-1.5rem)]">
      {children}
    </div>
  );
}
