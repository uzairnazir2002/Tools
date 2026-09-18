export const siteConfig = {
  name: "Code Format Tools",
  shortName: "CodeFormatterTools",
  domain: "codeformattertools.com",
  url: "https://codeformattertools.com",
  description: "Fast, private developer tools for formatting, validating, minifying, sorting, and converting structured data.",
  storagePrefix: "codeformattools",
  legacyStoragePrefix: "formatbase",
  xmlEnvelopeFormat: "codeformattools.xml.v1",
  legacyXmlEnvelopeFormat: "formatbase.xml.v1",
} as const;

export function contactEmail(): string {
  return process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";
}
