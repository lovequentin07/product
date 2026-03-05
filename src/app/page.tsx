import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DataZip — 아파트 관리비·실거래가 비교",
  description:
    "우리 아파트 관리비가 동네·구·서울 전체 대비 어느 수준인지 확인하고, 실거래가까지 한눈에 조회하세요. K-apt·국토부 공공데이터 기반.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "DataZip — 아파트 관리비·실거래가 비교",
    description:
      "우리 아파트 관리비가 동네·구·서울 전체 대비 어느 수준인지 확인하고, 실거래가까지 한눈에 조회하세요.",
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
      urlTemplate: "https://datazip.net/apt?searchTerm={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const services = [
  {
    href: "/apt-mgmt",
    icon: "💡",
    title: "관리비 지킴이",
    description:
      "우리 아파트 관리비가 같은 동네 대비 어느 수준인지 확인하세요. K-apt 공공데이터 기반.",
  },
  {
    href: "/apt",
    icon: "📊",
    title: "아파트 실거래가",
    description:
      "서울 131만건 이상의 아파트 매매 이력을 조회하세요. 국토교통부 실거래가 데이터.",
  },
];

const stats = [
  { value: "131만건+", label: "실거래 데이터" },
  { value: "3,335개", label: "단지 관리비" },
  { value: "2006년~", label: "데이터 기간" },
  { value: "매월", label: "데이터 업데이트" },
];

const howToSteps = [
  {
    step: "1",
    title: "서비스 선택",
    desc: "관리비 비교 또는 실거래가 조회 중 필요한 서비스를 선택합니다.",
  },
  {
    step: "2",
    title: "아파트 검색",
    desc: "아파트 이름이나 지역구를 입력해 원하는 단지를 찾습니다.",
  },
  {
    step: "3",
    title: "결과 확인",
    desc: "관리비 등급·순위, 실거래 이력을 차트와 표로 한눈에 비교합니다.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl p-4">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <header className="mt-12 text-center">
        <div className="text-5xl">🏠</div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">DataZip</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          아파트 관리비 · 실거래가 비교
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
          K-apt · 국토교통부 공공데이터 기반
        </p>
      </header>

      <main className="mt-8 space-y-10">
        {/* 서비스 카드 */}
        <section aria-label="서비스 목록" className="space-y-4">
          {services.map((svc) => (
            <a
              key={svc.href}
              href={svc.href}
              className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
            >
              <span className="text-3xl">{svc.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-semibold">{svc.title}</div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {svc.description}
                </div>
              </div>
              <span className="shrink-0 text-sm text-blue-500 font-medium self-center">
                바로가기 →
              </span>
            </a>
          ))}
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
            DataZip은 공공데이터를 활용해 서울 아파트 시장 정보를 쉽게 파악할 수 있도록 만든 서비스입니다.
            국토교통부 실거래가 공개시스템과 K-apt(공동주택관리정보시스템)의 공식 데이터를 바탕으로,
            누구나 자신의 아파트 실거래 이력과 관리비 수준을 무료로 확인할 수 있습니다.
          </p>
          <p>
            아파트를 구매하거나 이사를 고려할 때 실거래가 추이를 파악하는 것은 필수입니다.
            또한 매달 납부하는 관리비가 같은 동네 다른 단지와 비교해 적정 수준인지 알기 어려운 경우가 많습니다.
            DataZip은 이러한 정보 비대칭 문제를 해소하고, 합리적인 주거 결정을 돕기 위해 만들어졌습니다.
          </p>
          <p>
            2006년부터 현재까지 축적된 131만건 이상의 실거래 데이터와 서울 3,335개 단지의 관리비 공시 데이터를
            직관적인 차트와 비교 표로 제공합니다. 모든 데이터는 공공데이터포털을 통해 정기적으로 업데이트됩니다.
          </p>
        </section>

        {/* 이용 가이드 */}
        <section aria-label="이용 방법">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">이용 방법</h2>
          <ol className="space-y-3">
            {howToSteps.map(({ step, title, desc }) => (
              <li key={step} className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-sm flex items-center justify-center">
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

        {/* 가이드 링크 */}
        <section className="border-t border-gray-100 dark:border-gray-800 pt-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            가이드
          </h2>
          <div className="space-y-2">
            <Link
              href="/guide/apt-price-guide"
              className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-gray-700 dark:text-gray-300">아파트 실거래가 보는 법 완벽 가이드</span>
              <span className="text-gray-400">→</span>
            </Link>
            <Link
              href="/guide/mgmt-fee-guide"
              className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-gray-700 dark:text-gray-300">적정 관리비 판단 기준과 절약 방법</span>
              <span className="text-gray-400">→</span>
            </Link>
          </div>
        </section>

        <p className="pt-2 text-center text-xs text-gray-400 dark:text-gray-600">
          공공데이터포털 · K-apt · 국토교통부 실거래가 공개시스템 데이터 제공
        </p>
      </main>
    </div>
  );
}
