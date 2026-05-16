import type { MetadataRoute } from "next";
import { getLatestDealDate } from "@apt/lib/db/apt";
import { getMgmtFeeAptUrlList } from "@apt-mgmt/lib/db/management-fee";
import { regions } from "@shared/data/regions";
import marketStatsRaw from "@market/data/market-stats-by-region.json";

const BASE_URL = "https://datazip.net";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const latestDate = await getLatestDealDate();
  const mgmtApts = await getMgmtFeeAptUrlList();

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: latestDate,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/market`,
      lastModified: latestDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/apt`,
      lastModified: latestDate,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/guide/market-price-guide`,
      lastModified: new Date("2026-03-27"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/guide/market-shopping-guide`,
      lastModified: new Date("2026-03-27"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date("2026-03-30"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date("2026-03-30"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/guide/apt-price-guide`,
      lastModified: new Date("2026-03-27"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/guide/mgmt-fee-guide`,
      lastModified: new Date("2026-03-27"),
      changeFrequency: "monthly",
      priority: 0.7,
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
      priority: 0.5,
    }));

  // 관리비 지킴이 — 랜딩 + 개별 아파트 (apt_meta 상위 500개)
  const mgmtAptUrls: MetadataRoute.Sitemap = mgmtApts.map(({ sgg_nm, apt_nm, billing_ym }) => {
    // billing_ym 형식: "202501" → "2025-01-01"
    const lastMod = billing_ym
      ? new Date(`${billing_ym.slice(0, 4)}-${billing_ym.slice(4, 6)}-01`)
      : new Date('2026-02-26');
    return {
      url: `${BASE_URL}/apt-mgmt/${encodeURIComponent(sgg_nm)}/${encodeURIComponent(apt_nm)}`,
      lastModified: lastMod,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    };
  });

  const mgmtUrls: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/apt-mgmt`,
      lastModified: new Date('2026-02-26'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...mgmtAptUrls,
  ];

  // 농수축산물 품목 상세 페이지 (정적 JSON → 94개 품목, DB 쿼리 불필요)
  const codeToNmMap = new Map((marketStatsRaw as { item_cd: string; item_nm: string }[]).map(e => [e.item_cd, e.item_nm]));
  const marketItemUrls: MetadataRoute.Sitemap = [...codeToNmMap.values()].filter(Boolean).map((item_nm) => ({
    url: `${BASE_URL}/market/${encodeURIComponent(item_nm)}`,
    lastModified: latestDate,
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  return [...staticUrls, ...regionUrls, ...mgmtUrls, ...marketItemUrls];
}
