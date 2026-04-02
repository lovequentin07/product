import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/*opengraph-image*"] }],
    sitemap: "https://datazip.net/sitemap.xml",
  };
}
