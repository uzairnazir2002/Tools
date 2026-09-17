import type { Tool } from "@formatbase/tool-registry";

export function siteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  return (configured || "http://localhost:3000").replace(/\/$/, "");
}

export function toolMetadata(tool: Tool) {
  return { title: tool.seo.title, description: tool.seo.description, alternates: { canonical: `/${tool.slug}` } };
}

export function toolSchemas(tool: Tool) {
  return [
    { "@context": "https://schema.org", "@type": "WebApplication", name: tool.name, description: tool.seo.description, applicationCategory: "DeveloperApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteOrigin() },
      { "@type": "ListItem", position: 2, name: `${tool.category.toUpperCase()} tools`, item: `${siteOrigin()}/tools/${tool.category}` },
      { "@type": "ListItem", position: 3, name: tool.name, item: `${siteOrigin()}/${tool.slug}` }
    ] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: tool.faq.map(item => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) }
  ];
}
