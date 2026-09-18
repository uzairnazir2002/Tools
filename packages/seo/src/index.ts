import type { Tool } from "@codeformattools/tool-registry";
import { siteConfig } from "./site-config.ts";

export { contactEmail, siteConfig } from "./site-config.ts";

export function siteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  return (configured || siteConfig.url).replace(/\/$/, "");
}

export function toolMetadata(tool: Tool) {
  const url = `${siteOrigin()}/${tool.slug}`;
  return {
    title: tool.seo.title,
    description: tool.seo.description,
    alternates: { canonical: `/${tool.slug}` },
    openGraph: { title: tool.seo.title, description: tool.seo.description, url, siteName: siteConfig.name, type: "website", images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: siteConfig.name }] },
    twitter: { card: "summary_large_image", title: tool.seo.title, description: tool.seo.description, images: ["/og-image.svg"] }
  };
}

export function toolSchemas(tool: Tool) {
  return [
    { "@context": "https://schema.org", "@type": "WebApplication", name: tool.name, description: tool.seo.description, url: `${siteOrigin()}/${tool.slug}`, applicationCategory: "DeveloperApplication", operatingSystem: "Any", publisher: { "@type": "Organization", name: siteConfig.name, url: siteOrigin() }, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteOrigin() },
      { "@type": "ListItem", position: 2, name: `${tool.category.toUpperCase()} tools`, item: `${siteOrigin()}/tools/${tool.category}` },
      { "@type": "ListItem", position: 3, name: tool.name, item: `${siteOrigin()}/${tool.slug}` }
    ] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: tool.faq.map(item => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) }
  ];
}

export function homeSchemas() {
  return [
    { "@context": "https://schema.org", "@type": "WebSite", name: siteConfig.name, url: siteOrigin(), description: siteConfig.description },
    { "@context": "https://schema.org", "@type": "Organization", name: siteConfig.name, url: siteOrigin(), logo: `${siteOrigin()}/icon.svg` }
  ];
}
