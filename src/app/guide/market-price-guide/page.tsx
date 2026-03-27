import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "농산물 가격 정보 활용 가이드 — 소매가·등급·percentile 완벽 이해",
  description:
    "농산물 소매가란 무엇인지, 등급(상/중/하)의 의미, 하위 N%(percentile) 읽는 법을 알기 쉽게 설명합니다.",
  alternates: { canonical: "/guide/market-price-guide" },
  openGraph: {
    title: "농산물 가격 정보 활용 가이드 — 소매가·등급·percentile 완벽 이해",
    description:
      "농산물 소매가란 무엇인지, 등급(상/중/하)의 의미, 하위 N%(percentile) 읽는 법을 알기 쉽게 설명합니다.",
    url: "/guide/market-price-guide",
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "농산물 가격 정보 활용 가이드",
  description:
    "농산물 소매가, 등급, percentile(하위 N%) 등 시세 정보를 이해하는 완벽한 가이드입니다.",
  author: { "@type": "Organization", name: "DataZip" },
  publisher: { "@type": "Organization", name: "DataZip", url: "https://datazip.net" },
  url: "https://datazip.net/guide/market-price-guide",
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: "https://datazip.net" },
    { "@type": "ListItem", position: 2, name: "농산물 가격 정보 활용 가이드" },
  ],
};

export default function MarketPriceGuidePage() {
  return (
    <div className="mx-auto max-w-2xl p-4 pb-16">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="text-xs text-gray-400 dark:text-gray-500 mt-4 mb-6 flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-gray-600 dark:hover:text-gray-300">
          홈
        </Link>
        <span>›</span>
        <span className="text-gray-600 dark:text-gray-300 font-medium">
          농산물 가격 정보 활용 가이드
        </span>
      </nav>

      <article className="space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
            농산물 가격 정보 활용 가이드
          </h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            소매가·등급·percentile 등 시세 데이터를 정확하게 이해하고, 현명한 장보기에 활용하세요.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            1. 소매가란 무엇인가
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            소매가는 마트나 전통시장에서 일반 소비자가 실제로 지불하는 가격입니다.
            생산지에서 소비자에게 도달하기까지 중간 비용(운송, 보관, 판매 마진)이 포함되어 있습니다.
          </p>
          <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium text-blue-900 dark:text-blue-200 mb-2">
              ℹ️ 도매가 vs 소매가
            </p>
            <ul className="space-y-1.5">
              {[
                "도매가: 농산물 거래소에서 대량 구매 시 적용되는 가격",
                "소매가: 마트·시장에서 소비자가 실제 구매하는 가격",
                "소매가가 도매가보다 높은 이유: 중간 유통 과정의 비용 포함",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            2. 등급(상/중/하)의 의미
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            농산물의 등급은 크기, 신선도, 외관 등 여러 기준에 따라 상(上)·중(中)·하(下)로 분류됩니다.
            일반적으로 상 등급이 가장 비싸고, 하 등급은 저렴합니다.
          </p>
          <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium text-gray-800 dark:text-gray-200 mb-3">
              등급별 특성
            </p>
            <div className="space-y-2">
              {[
                { grade: "상(上)", desc: "크기가 크고 신선하며 외관이 우수함. 최고 품질" },
                { grade: "중(中)", desc: "평균적인 크기와 신선도. 가정 구매에 적합" },
                { grade: "하(下)", desc: "크기가 작거나 약간의 결점 있음. 가장 저렴" },
              ].map(({ grade, desc }) => (
                <div key={grade} className="flex gap-3">
                  <span className="shrink-0 font-semibold text-gray-800 dark:text-gray-200 w-12">
                    {grade}:
                  </span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            실제 구매 시에는 상 등급 제품만 고집할 필요는 없습니다.
            중·하 등급이라도 신선하고 충분히 맛있는 제품이 많으므로,
            용도에 맞게 선택하면 절약과 맛 모두 잡을 수 있습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            3. 하위 N%(percentile) 읽는 법
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            percentile은 과거 1년간의 가격 이력 중 현재 가격이 어느 수준에 위치하는지를 보여줍니다.
            예를 들어 "하위 20%"는 과거 1년 중 가장 저렴한 하위 20% 구간에 속한다는 뜻입니다.
          </p>
          <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium text-blue-900 dark:text-blue-200 mb-3">
              📊 percentile 활용 사례
            </p>
            <div className="space-y-2">
              {[
                "하위 10% → 거의 최저가 수준. 매우 저렴한 시기",
                "하위 30% → 낮은 가격대. 구매하기 좋은 시기",
                "50%(중간) → 평년 수준. 평상시 가격",
                "상위 20% → 높은 가격대. 비싼 시기",
                "상위 5% → 거의 최고가 수준. 가격이 매우 비쌈",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="shrink-0">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            장을 볼 때 percentile이 낮을수록 저렴한 가격에 구매할 수 있으므로,
            하위 20-30% 수준의 제품들을 우선 구매하면 알뜰하게 장을 볼 수 있습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            4. 가격 데이터 출처 및 신뢰도
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            DataZip의 시세 정보는 한국농수산식품유통공사(aT)의 공공데이터포털에서 제공하는
            소매가 기준 데이터를 활용합니다. 이는 통계청·한국은행 등 공식 기관에서도
            참고하는 신뢰도 높은 자료입니다.
          </p>
          <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium text-gray-800 dark:text-gray-200 mb-3">
              ✓ 데이터 신뢰도
            </p>
            <ul className="space-y-1.5">
              {[
                "한국농수산식품유통공사(aT) 공공데이터포털 제공",
                "매일 평일 오전 10시에 자동으로 최신 데이터 수집",
                "전국 시장 및 대형마트 소매가 기반",
                "13개월 이상의 가격 이력 보관",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="shrink-0 text-green-500">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            5. 제철 식재료 장보기 팁
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            제철은 그 철에 자연 재배되는 농산물이 가장 많이 생산되는 시기입니다.
            수급이 많으면 가격이 내려가므로, 제철 식재료를 사는 것이 가장 경제적입니다.
          </p>
          <div className="mt-4 space-y-3">
            {[
              {
                season: "봄 (3-5월)",
                items: ["새로운 감자", "시금치", "더덕", "냉이", "미나리"],
              },
              {
                season: "여름 (6-8월)",
                items: ["수박", "참외", "옥수수", "오이", "가지", "토마토"],
              },
              {
                season: "가을 (9-11월)",
                items: ["포도", "배", "사과", "밤", "배추", "버섯"],
              },
              {
                season: "겨울 (12-2월)",
                items: ["귤", "딸기", "무", "당근", "시금치", "유채"],
              },
            ].map(({ season, items }) => (
              <div key={season} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-2">
                  {season}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {items.join(" · ")}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            제철 식재료는 맛이 좋을 뿐 아니라 영양가도 높고 가격도 저렴합니다.
            DataZip 시세 정보에서 현재 가장 저렴한 품목들을 확인하고,
            위 제철 가이드와 함께 참고하면 더욱 현명한 장보기가 가능합니다.
          </p>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
          <Link
            href="/market"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            시세 정보 보기 →
          </Link>
        </div>
      </article>
    </div>
  );
}
