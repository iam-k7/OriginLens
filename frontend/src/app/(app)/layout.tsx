/** Tool and content pages: one light panel inside the dark frame, clear of the floating navbar. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <div className="panel min-h-[calc(100svh-1rem)] pt-16 sm:min-h-[calc(100svh-1.5rem)] sm:pt-20">{children}</div>;
}
