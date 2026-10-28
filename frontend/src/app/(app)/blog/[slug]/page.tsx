import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getPost, POSTS } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

const PROSE =
  "mt-8 space-y-4 text-[1.02rem] leading-relaxed text-muted [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-ink [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_code]:rounded [&_code]:bg-surface [&_code]:px-1 [&_code]:text-sm";

// Every post is prerendered from generateStaticParams; only unknown slugs render on request, and they 404.
export const instant = false;

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.description, publishedTime: post.date, url: `/blog/${post.slug}`,
      images: "/opengraph-image" }, // a page-level openGraph replaces the inherited one, image included
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const post = getPost((await params).slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    author: { "@type": "Organization", name: "OriginLens" },
    publisher: { "@type": "Organization", name: "OriginLens", logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-mark.svg` } },
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/blog" className="text-sm text-muted hover:text-ink">← All posts</Link>
      <h1 className="mt-4 font-display text-4xl font-medium tracking-tight">{post.title}</h1>
      <p className="mt-3 text-sm text-muted">
        <time dateTime={post.date}>{formatDate(post.date)}</time> · OriginLens
      </p>
      <div className={PROSE}>{post.body}</div>
      <div className="card mt-12 p-6">
        <p className="font-display text-xl font-semibold">Check an image now</p>
        <p className="mt-1 text-muted">Free, no sign-up, and your image never leaves your browser.</p>
        <Link href="/analyzer" className="btn-primary mt-4 inline-flex">Open the Image Analyzer</Link>
      </div>
    </article>
  );
}
