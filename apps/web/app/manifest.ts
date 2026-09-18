import type { MetadataRoute } from "next";
import { siteConfig } from "@codeformattools/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f3",
    theme_color: "#245f49",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" }
    ]
  };
}
