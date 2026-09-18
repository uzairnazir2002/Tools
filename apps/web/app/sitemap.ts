import type { MetadataRoute } from "next";
import { categories, tools } from "@codeformattools/tool-registry";
import { siteOrigin } from "@codeformattools/seo";
export default function sitemap(): MetadataRoute.Sitemap { const base = siteOrigin(); return ["", "/about", "/privacy", "/terms", "/contact", ...categories.map(category => `/tools/${category.id}`), ...tools.map(tool => `/${tool.slug}`)].map(path => ({ url: `${base}${path}`, changeFrequency: "monthly" as const, priority: path === "" ? 1 : path.startsWith("/json-") ? 0.8 : 0.4 })); }
