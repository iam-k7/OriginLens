import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, POSTS } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guides on spotting AI-generated images, reading Content Credentials (C2PA) and protecting the metadata in your photos.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="eyebrow">Blog</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Guides and explainers</h1>
      <p className="mt-3 text-muted">Practical, honest guides to image provenance, AI detection and photo privacy.</p>

      <ul className="mt-10 space-y-4">
        {POSTS.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="card block p-6 hover:border-brand-300">
              <time dateTime={p.date} className="text-sm text-muted">{formatDate(p.date)}</time>
              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">{p.title}</h2>
              <p className="mt-2 text-muted">{p.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
