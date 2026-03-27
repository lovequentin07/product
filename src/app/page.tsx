import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getCheapItemsByRegion } from "@market/lib/market-data";
import { detectRegion } from "@market/lib/region";

export const metadata: Metadata = {
  title: "DataZip — 오늘의 장바구니. 지금 뭐가 싼지",
  description:
    "오늘 저렴해진 채소·과일·수산·곡물·식품을 한눈에 확인하세요. 공공데이터 기반 소매가 비교와 1년 평균 대비 가격 변동을 제공합니다.",
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

const secondaryServices = [
  {
    href: "/apt-mgmt",
    icon: "💡",
    title: "관리비 지킴이",
    description: "우리 아파트 관리비가 동네 대비 어느 수준인지 확인하세요.",
  },
  {
    href: "/apt",
    icon: "📊",
    title: "아파트 실거래가",
    description: "131만건 이상의 아파트 매매 이력을 조회하세요.",
  },
];

const stats = [
  { value: "54,462건+", label: "농산물 데이터" },
  { value: "38,972건", label: "소매가 기준" },
  { value: "13개월", label: "이력 데이터" },
  { value: "매일", label: "자동 업데이트" },
];

const howToSteps = [
  {
    step: "1",
    title: "오늘 저렴한 품목 확인",
    desc: "홈에서 지금 저렴해진 채소·과일·수산 상위 6개를 바로 확인합니다.",
  },
  {
    step: "2",
    title: "품목 상세 페이지 방문",
    desc: "특정 품목을 선택해 과거 1년간의 가격 변동, 등급별 가격 비교를 봅니다.",

  },
  {
    step: "3",
    title: "알뜰 장보기 실천",
    desc: "제철 식재료와 저가 상품을 정확히 파악해 합리적으로 장을 봅니다.",
  },
];

export default async function HomePage() {
  const headersList = await headers();
  const sgg_cd = detectRegion(headersList);
  const cheapItems = await getCheapItemsByRegion(sgg_cd, 6);

  return (
    <div className="mx-auto max-w-2xl p-4">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <header className="mt-12 text-center">
        <div className="text-5xl">🛒</div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">DataZip</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          오늘의 장바구니 · 지금 뭐가 싼지
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
          공공데이터 기반 농수축산물 실시간 시세
        </p>
      </header>

      <main className="mt-8 space-y-10">
        {/* 오늘 저렴한 품목 */}
        <section aria-label="오늘 저렴한 품목">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
            🎯 지금 저렴한 품목 (상위 6개)
          </h2>
          {cheapItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {cheapItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/market/${item.id}`}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-3 text-center hover:border-green-400 dark:hover:border-green-600 transition-colors"
                >
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.name}</div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {item.kinds[0]?.retailPrice.toLocaleString()}원
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.unit}</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
              데이터 로드 중입니다...
            </div>
          )}
        </section>

        {/* 통계 하이라이트 */}
        <section aria-label="서비스 통계" className="bg-blue-50 dark:bg-blue-950 rounded-2xl p-6">
          <h2 className="text-center text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-4">
            DataZip 데이터 현황
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{value}</div>
                <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 서비스 소개 */}
        <section className="space-y-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">DataZip이란?</h2>
          <p>
            DataZip은 공공데이터포털의 농산물 가격 정보를 활용해 합리적인 장보기를 돕는 서비스입니다.
            한국농수산식품유통공사의 공식 소매가 데이터를 기반으로, 누구나 매일 갱신되는 최신 시세를 무료로 확인할 수 있습니다.
          </p>
          <p>
            장을 볼 때마다 가격이 어떻게 변하는지 궁금하셨나요? 제철 식재료는 언제쯤 저렴한지 모르셨나요?
            DataZip은 과거 1년간의 가격 변동을 차트로 보여주고, 오늘 저렴한 상품을 한눈에 추천합니다.
            정확한 데이터에 기반한 알뜰한 장보기를 시작하세요.
          </p>
          <p>
            평일 매일 오전 10시에 자동으로 최신 데이터가 수집되어 업데이트됩니다.
            지난 13개월간의 수집 데이터를 기반으로 계절별 가격 변동, 등급별 상품 가격, percentile(상대적 가격 수준) 정보를 제공합니다.
          </p>
        </section>

        {/* 이용 가이드 */}
        <section aria-label="이용 방법">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">이용 방법</h2>
          <ol className="space-y-3">
            {howToSteps.map(({ step, title, desc }) => (
              <li key={step} className="flex gap-4 items-start">
                <span className="shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-sm flex items-center justify-center">
                  {step}
                </span>
                <div>
                  <div className="font-medium text-sm text-gray-800 dark:text-gray-200">{title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 가이드 링크*/}
        <section className="border-t border-gray-100 dark:border-gray-800 pt-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            📚 가이드
          </h2>
          <div className="space-y-2">
            <Link
              href="/guide/market-price-guide"
              className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-gray-700 dark:text-gray-300">농산물 가격 정보 활용 가이드</span>
              <span className="text-gray-400">→</span>
            </Link>
            <Link
              href="/guide/market-shopping-guide"
              className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-gray-700 dark:text-gray-300">알뜰 장보기 완벽 가이드</span>
              <span className="text-gray-400">→</span>
            </Link>
          </div>
        </section>

        {/* 보조 서비스 */}
        <section className="border-t border-gray-100 dark:border-gray-800 pt-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            🔗 기타 서비스
          </h2>
          <div className="space-y-3">
            {secondaryServices.map((svc) => (
              <a
                key={svc.href}
                href={svc.href}
                className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <span className="text-xl shrink-0">{svc.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{svc.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{svc.description}</div>
                </div>
                <span className="text-gray-400 shrink-0">→</span>
              </a>
            ))}
          </div>
        </section>

        <p className="pt-2 text-center text-xs text-gray-400 dark:text-gray-600">
          공공데이터포털 농산물 가격 정보 제공
        </p>
      </main>
    </div>
  );
}
