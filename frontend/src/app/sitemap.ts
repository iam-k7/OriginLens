import type { MetadataRoute } from "next";
import { POSTS } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/analyzer", "/text", "/blog", "/privacy"].map((path) => ({ url: `${SITE_URL}${path}` }));
  const posts = POSTS.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.date }));
  return [...pages, ...posts];
}
