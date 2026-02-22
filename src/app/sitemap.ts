import type { MetadataRoute } from "next";
import { getDistinctApartments } from "@/lib/db/apt";

const BASE_URL = "https://datazip.net";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/apt`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const apartments = await getDistinctApartments();
  const aptUrls: MetadataRoute.Sitemap = apartments
    .filter(({ sgg_nm }) => sgg_nm)
    .map(({ sgg_nm, apt_nm }) => ({
      url: `${BASE_URL}/apt/${encodeURIComponent(sgg_nm)}/${encodeURIComponent(apt_nm)}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  return [...staticUrls, ...aptUrls];
}
