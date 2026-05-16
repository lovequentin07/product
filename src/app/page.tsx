import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getCheapItemsByRegion } from "@market/lib/market-data";
import { detectRegion } from "@market/lib/region";
import type { ItemDetail } from "@market/types/market";
import ServiceLayout from "@shared/components/ui/ServiceLayout";

export const metadata: Metadata = {
  title: "DataZip — 아파트 실거래가 · 관리비 · 장바구니 시세",
  description:
    "장바구니 시세, 아파트 실거래가, 관리비 분석까지. 매일 업데이트되는 생활 데이터를 한눈에 확인하세요.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "DataZip — 아파트 실거래가 · 관리비 · 장바구니 시세",
    description:
      "장바구니 시세, 아파트 실거래가, 관리비 분석. 매일 업데이트.",
    url: "/",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "DataZip",
  url: "https://datazip.net",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://datazip.net/market?searchTerm={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const secondaryServices = [
  {
    href: "/apt",
    label: "아파트 실거래가",
    desc: "우리 동네 아파트, 실제로 얼마에 팔렸나",
    tag: "REAL ESTATE",
  },
  {
    href: "/apt-mgmt",
    label: "관리비 지킴이",
    desc: "우리 단지 관리비, 비싼 편인지 확인",
    tag: "MGMT FEE",
  },
];

function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR");
}

function PercentileBadge({ percentile }: { percentile: number }) {
  const pct = Math.round(percentile * 100);
  const isLow = pct <= 20;
  return (
    <span
      className="inline-flex items-center text-xs font-mono font-semibold px-1.5 py-0.5 rounded"
      style={{
        color: isLow ? "#047857" : "#9A9085",
        background: isLow ? "#ECFDF5" : "#F3F0EB",
      }}
    >
      하위 {pct}%
    </span>
  );
}

export default async function HomePage() {
  const headersList = await headers();
  const sgg_cd = detectRegion(headersList);

  let liveItems: ItemDetail[] = [];
  try {
    liveItems = await getCheapItemsByRegion(sgg_cd, 6);
  } catch {
    liveItems = [];
  }

  return (
    <ServiceLayout>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

        <h1
          className="text-2xl font-bold mb-5 leading-tight"
          style={{ fontFamily: "var(--font-noto-serif-kr)", color: "#1A1918" }}
        >
          아파트 실거래가 · 관리비 · 장바구니 시세
        </h1>

        {/* 장바구니 시세 — 풀너비 카드 */}
        <section
          className="rounded-2xl p-6 mb-4"
          style={{ background: "#FFFFFF", border: "1px solid #E8E3DC" }}
        >
          {/* 카드 헤더 */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p
                className="text-xs font-mono font-semibold tracking-widest mb-1.5"
                style={{ color: "#C94B1A", letterSpacing: "0.15em" }}
              >
                MARKET
              </p>
              <h2
                className="text-xl font-bold leading-tight mb-1"
                style={{
                  fontFamily: "var(--font-noto-serif-kr)",
                  color: "#1A1918",
                }}
              >
                장바구니 시세
              </h2>
              <p className="text-sm" style={{ color: "#4A4540" }}>
                지금 사면 이득인 식재료들을 3초만에 확인하세요
              </p>
            </div>
            <span
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: "rgba(201,75,26,0.08)",
                color: "#C94B1A",
              }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full animate-live-pulse" style={{ background: "#C94B1A" }} />
              LIVE
            </span>
          </div>

          {/* 가격 목록 */}
          {liveItems.length > 0 ? (
            <div className="mb-6">
              {liveItems.map((item, i) => {
                const price = item.kinds?.[0]?.retailPrice ?? 0;
                const percentile = item.percentile ?? 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2.5 animate-stagger-in"
                    style={{
                      borderBottom: i < liveItems.length - 1 ? "1px solid #F0EBE4" : "none",
                      animationDelay: `${i * 60}ms`,
                    }}
                  >
                    <span className="text-sm" style={{ color: "#1A1918" }}>
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold" style={{ color: "#1A1918" }}>
                        {formatPrice(price)}
                        <span className="text-xs font-normal" style={{ color: "#9A9085" }}>
                          원/{item.unit}
                        </span>
                      </span>
                      <PercentileBadge percentile={percentile} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mb-6 py-4 text-center text-sm" style={{ color: "#9A9085" }}>
              데이터를 불러오는 중입니다
            </div>
          )}

          <div style={{ borderTop: "1px solid #E8E3DC", paddingTop: "16px" }}>
            <Link
              href="/market"
              className="text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: "#C94B1A" }}
            >
              전체 시세 보기 →
            </Link>
          </div>
        </section>

        {/* 2열 서비스 카드 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {secondaryServices.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="flex flex-col rounded-2xl p-5 transition-shadow hover:shadow-md"
              style={{ background: "#FFFFFF", border: "1px solid #E8E3DC", minHeight: "140px" }}
            >
              <p
                className="text-xs font-mono font-semibold tracking-widest mb-2"
                style={{ color: "#C94B1A", letterSpacing: "0.15em" }}
              >
                {s.tag}
              </p>
              <h3
                className="font-bold text-sm leading-snug mb-1"
                style={{
                  fontFamily: "var(--font-noto-serif-kr)",
                  color: "#1A1918",
                }}
              >
                {s.label}
              </h3>
              <p className="text-xs flex-1" style={{ color: "#9A9085" }}>
                {s.desc}
              </p>
              <span
                className="inline-block text-xs font-semibold mt-4 px-3 py-1.5 rounded-lg self-start"
                style={{ background: "#F7F4EF", color: "#C94B1A" }}
              >
                조회 →
              </span>
            </Link>
          ))}
        </div>

        {/* 추가 예정 카드 */}
        <div
          className="rounded-2xl px-5 py-4 text-center text-sm"
          style={{
            border: "1.5px dashed #DDD8D0",
            color: "#B5AFA7",
          }}
        >
          · · · &nbsp; 곧 추가됩니다
        </div>

    </ServiceLayout>
  );
}
