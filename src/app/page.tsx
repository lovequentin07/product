import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DataZip — 오늘의 장바구니. 지금 뭐가 싼지",
  description:
    "오늘 저렴해진 채소·과일·수산·곡물·식품을 한눈에 확인하세요. 공공데이터 기반 소매가 비교.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "DataZip — 오늘의 장바구니. 지금 뭐가 싼지",
    description:
      "오늘 저렴해진 식재료를 확인하고 알뜰 장을 보세요. 공공데이터 기반 농산물 시세.",
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

const services = [
  {
    emoji: "🥦",
    title: "농수축산물 시세",
    desc: "오늘 저렴한 식재료 한눈에",
    href: "/market",
  },
  {
    emoji: "🏢",
    title: "아파트 실거래가",
    desc: "서울 아파트 실거래가 조회",
    href: "/apt",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <div className="max-w-xl mx-auto px-4">
        {/* Hero */}
        <section className="text-center pt-24 pb-16">
          <h1
            className="font-bold text-gray-900 leading-tight mb-3"
            style={{ fontSize: "36px" }}
          >
            오늘 장바구니 시세<br />
            3초 만에 파악하세요
          </h1>
          <p className="text-gray-400 text-sm mb-10">
            공공데이터 기반 농수축산물 소매가 · 매일 업데이트
          </p>
          <Link
            href="/market"
            className="inline-block bg-gray-900 text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors"
          >
            시세 확인하기 →
          </Link>
        </section>

        {/* 서비스 소개 */}
        <section className="pb-20">
          <p className="text-xs text-gray-400 mb-3">서비스</p>
          <div className="grid grid-cols-2 gap-3">
            {services.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="block border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition-shadow"
              >
                <div className="text-2xl mb-3">{s.emoji}</div>
                <div className="font-semibold text-gray-900 text-sm">
                  {s.title}
                </div>
                <div className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {s.desc}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
