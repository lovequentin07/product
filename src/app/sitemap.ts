import type { MetadataRoute } from "next";
import { getDistinctApartments, getLatestDealDate } from "@/lib/db/apt";
import { regions } from "@/data/regions";

const BASE_URL = "https://datazip.net";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const latestDate = await getLatestDealDate();

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: latestDate,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/apt`,
      lastModified: latestDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: new Date("2026-02-21"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const regionUrls: MetadataRoute.Sitemap = regions
    .filter((r) => r.parent === '서울특별시')
    .map((r) => ({
      url: `${BASE_URL}/apt/${encodeURIComponent(r.name)}`,
      lastModified: latestDate,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));

  const apartments = await getDistinctApartments();
  const aptUrls: MetadataRoute.Sitemap = apartments
    .filter(({ sgg_nm }) => sgg_nm)
    .map(({ sgg_nm, apt_nm }) => ({
      url: `${BASE_URL}/apt/${encodeURIComponent(sgg_nm)}/${encodeURIComponent(apt_nm)}`,
      lastModified: latestDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  return [...staticUrls, ...regionUrls, ...aptUrls];
}
