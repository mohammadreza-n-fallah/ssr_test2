import type { MetadataRoute } from "next";
import { fakeSitemapData } from "@/lib/fake-data";

export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const USE_FAKE_DATA = process.env.NEXT_PUBLIC_FAKE_DATA === "true";

interface SlugEntry {
  slug: string;
  updated_at?: string;
}

interface SitemapData {
  products: SlugEntry[];
  categories: SlugEntry[];
  posts: SlugEntry[];
  blog_categories: SlugEntry[];
}

// Pulls slug + lastmod lists from the backend SEO feed. Revalidates hourly so a
// build with the API offline still produces (at least) the static routes, and
// fresh catalogue entries appear without a redeploy.
async function fetchSitemapData(): Promise<SitemapData | null> {
  if (USE_FAKE_DATA) return fakeSitemapData();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_URL}/seo/sitemap-data/`, {
      next: { revalidate: 3600 },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return (await res.json()) as SitemapData;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ];

  const data = await fetchSitemapData();
  if (!data) return staticRoutes;

  const lastmod = (value?: string) => (value ? new Date(value) : now);

  const products: MetadataRoute.Sitemap = data.products.map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: lastmod(p.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categories: MetadataRoute.Sitemap = data.categories.map((c) => ({
    url: `${SITE_URL}/categories/${c.slug}`,
    lastModified: lastmod(c.updated_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const posts: MetadataRoute.Sitemap = data.posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: lastmod(p.updated_at),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const blogCategories: MetadataRoute.Sitemap = data.blog_categories.map((c) => ({
    url: `${SITE_URL}/blog/category/${c.slug}`,
    lastModified: lastmod(c.updated_at),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...products, ...categories, ...posts, ...blogCategories];
}
