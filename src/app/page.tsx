import type { Metadata } from "next";

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

      <main className="mt-8 space-y-4">
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

        <p className="pt-2 text-center text-xs text-gray-400 dark:text-gray-600">
          공공데이터포털 · K-apt · 국토교통부 실거래가 공개시스템 데이터 제공
        </p>
      </main>
    </div>
  );
}
