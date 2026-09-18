import type { NextConfig } from "next";
const scriptSources = [
  "'self'",
  "'unsafe-inline'",
  ...(process.env.NODE_ENV === "production" ? [] : ["'unsafe-eval'"]),
  "https://va.vercel-scripts.com",
  "https://*.vercel-scripts.com"
].join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src ${scriptSources}`,
  "connect-src 'self' https://vitals.vercel-insights.com https://*.vercel-insights.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'"
].join("; ");

const nextConfig: NextConfig = {
  transpilePackages: ["@codeformattools/tool-core", "@codeformattools/tool-registry", "@codeformattools/json-engine", "@codeformattools/sql-engine", "@codeformattools/yaml-engine", "@codeformattools/xml-engine", "@codeformattools/csv-engine", "@codeformattools/conversion-engine", "@codeformattools/analytics", "@codeformattools/worker-runtime", "@codeformattools/seo", "@codeformattools/editor"],
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
        { key: "X-Frame-Options", value: "DENY" }
      ]
    }];
  }
};
export default nextConfig;
