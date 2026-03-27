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

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <div className="text-center">
        <h1
          className="font-bold text-gray-900 leading-tight mb-8"
          style={{ fontSize: "32px" }}
        >
          오늘 장바구니 시세<br />
          3초 만에 파악하세요
        </h1>

        <Link
          href="/market"
          className="inline-block bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-8 py-4 text-white font-semibold rounded-lg transition-colors"
        >
          시세 확인하기 →
        </Link>
      </div>
    </div>
  );
}
