import type { MetadataRoute } from "next";
import { getLatestDealDate } from "@/lib/db/apt";
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
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: new Date("2026-02-21"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // 구 단위 지역 페이지만 포함 (개별 아파트 URL은 구글이 지역 페이지 크롤링 후 자연 발견)
  // getDistinctApartments()는 131만 건 SELECT DISTINCT → Cloudflare Workers CPU 제한 초과
  const regionUrls: MetadataRoute.Sitemap = regions
    .filter((r) => r.parent === '서울특별시')
    .map((r) => ({
      url: `${BASE_URL}/apt/${encodeURIComponent(r.name)}`,
      lastModified: latestDate,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  // 관리비 지킴이 — 랜딩 페이지만 포함 (단지별 페이지는 D1 데이터 로드 후 추가)
  const mgmtUrls: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/apt-mgmt`,
      lastModified: new Date('2026-02-26'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  return [...staticUrls, ...regionUrls, ...mgmtUrls];
}
