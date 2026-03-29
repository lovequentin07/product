import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "알뜰 장보기 완벽 가이드 — 오늘 뭐가 싼지 찾는 법",
  description:
    "장바구니 물가 지수란 무엇인지, 오늘 저렴한 농산물 찾는 법, 채소·과일·수산물별 선택 기준과 보관 방법을 알려드립니다.",
  keywords: ['알뜰 장보기', '오늘 싼 채소', '저렴한 과일', '장보기 꿀팁'],
  alternates: { canonical: "/guide/market-shopping-guide" },
  openGraph: {
    title: "알뜰 장보기 완벽 가이드 — 오늘 뭐가 싼지 찾는 법",
    description:
      "장바구니 물가 지수란 무엇인지, 오늘 저렴한 농산물 찾는 법, 채소·과일·수산물별 선택 기준과 보관 방법을 알려드립니다.",
    url: "/guide/market-shopping-guide",
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "알뜰 장보기 완벽 가이드",
  description:
    "저렴한 농산물을 찾고, 품질 좋은 제품을 선택하고, 신선하게 보관하는 방법을 배우세요.",
  author: { "@type": "Organization", name: "DataZip" },
  publisher: { "@type": "Organization", name: "DataZip", url: "https://datazip.net" },
  url: "https://datazip.net/guide/market-shopping-guide",
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: "https://datazip.net" },
    { "@type": "ListItem", position: 2, name: "알뜰 장보기 완벽 가이드" },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "장바구니 물가 지수란 무엇인가요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "장바구니 물가 지수는 대표 농산물의 가격 변화를 통해 식재료 가격 수준을 종합적으로 나타내는 지표입니다. 이를 통해 현재 물가가 평년 대비 비싼지 저렴한지 판단할 수 있습니다.",
      },
    },
    {
      "@type": "Question",
      name: "오늘 저렴한 농산물은 어떻게 찾나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "DataZip 시세 정보(/market)에 접속하면 오늘 저렴한 품목 TOP 6을 실시간으로 확인할 수 있습니다. 각 품목의 percentile(하위 N%)을 보고, 하위 20-30% 수준의 제품들을 우선 구매하면 알뜰하게 장을 볼 수 있습니다.",
      },
    },
    {
      "@type": "Question",
      name: "채소와 과일 고를 때 주의할 점은?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "채소는 싱싱한 초록색과 적절한 무게감이 있는지 확인하세요. 과일은 색깔이 선명하고, 눌렀을 때 약간의 탄력이 있으면서 흠집이 없는 것을 고르세요. 냄새도 신선한 특유의 향기가 나는지 확인하는 것이 좋습니다.",
      },
    },
    {
      "@type": "Question",
      name: "농산물 보관은 어떻게 해야 하나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "채소는 냉장 보관(2-5℃)이 기본입니다. 과일은 종류에 따라 다르므로 포장지를 확인하고, 포도·베리류 등은 냉장, 수박·당뇨은 실온에서 보관하세요. 새로 구매한 것부터 먼저 사용하는 것을 권장합니다.",
      },
    },
  ],
};

export default function MarketShoppingGuidePage() {
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
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <nav className="text-xs text-gray-400 mt-4 mb-6 flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-gray-600">
          홈
        </Link>
        <span>›</span>
        <span className="text-gray-600 font-medium">
          알뜰 장보기 완벽 가이드
        </span>
      </nav>

      <article className="space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">
            알뜰 장보기 완벽 가이드
          </h1>
          <p className="mt-3 text-gray-500 text-sm leading-relaxed">
            저렴한 시기를 찾고, 신선한 제품을 고르고, 오래 보관하는 방법까지.
            현명한 장보기의 모든 것을 배워보세요.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            1. 장바구니 물가 지수란
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            장바구니 물가 지수는 대표 농산물(채소, 과일, 수산물, 곡물 등)의 가격 변화를
            종합적으로 보여주는 경제 지표입니다. 이를 통해 현재 식재료 가격 수준이
            평년보다 비싼지 저렴한지 한눈에 파악할 수 있습니다.
          </p>
          <div className="mt-4 p-4 rounded-lg bg-blue-50 text-sm text-gray-700">
            <p className="font-medium text-blue-900 mb-2">
              💡 장바구니 물가 지수가 높으면
            </p>
            <ul className="space-y-1">
              {[
                "대부분의 농산물 가격이 평년보다 비싸다",
                "장을 보는 가정의 식비 부담이 커진다",
                "가격이 저렴한 제품들을 더 찾아봐야 한다",
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
          <h2 className="text-lg font-semibold text-gray-800">
            2. 오늘 저렴한 품목 찾는 법
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            DataZip의 시세 정보를 활용하면 오늘 기준 가장 저렴한 농산물을 실시간으로
            확인할 수 있습니다. 이를 활용해 알뜰하게 장을 보는 방법을 소개합니다.
          </p>
          <div className="mt-4 p-4 rounded-lg bg-blue-50 text-sm text-gray-700">
            <p className="font-medium text-blue-900 mb-3">
              📍 DataZip으로 저렴한 품목 찾기
            </p>
            <div className="space-y-2">
              {[
                "① /market 방문 → 오늘 저렴한 상품 TOP 6 확인",
                "② 각 품목의 percentile(하위 N%) 확인",
                "③ 하위 20-30% 수준의 제품들 우선 구매",
                "④ 제철 상품과 함께라면 더욱 저렴함",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="shrink-0 font-medium">{item.slice(0, 2)}</span>
                  <span>{item.slice(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            3. 채소 고르는 법
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            신선한 채소는 맛과 영양가가 모두 높습니다. 다음의 체크리스트를 참고해 좋은
            채소를 선택하세요.
          </p>
          <div className="mt-4 p-4 rounded-lg bg-gray-50 text-sm text-gray-700">
            <p className="font-medium text-gray-800 mb-3">
              ✓ 신선한 채소 선택 체크리스트
            </p>
            <ul className="space-y-1.5">
              {[
                "색깔: 선명하고 생생한 초록색 (시든 회색이 아님)",
                "무게: 알맞은 무게감이 있고 들었을 때 무거운 느낌",
                "상태: 시들거나 물러지지 않고 팽팽함",
                "향기: 신선한 채소 특유의 향기가 남",
                "흠집: 곰팡이나 검은 점, 눈에 띄는 상처 없음",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="shrink-0 text-green-500">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            여름에는 상한 채소가 더 빨리 나타나므로, 구매 후 2-3일 내에 사용하는 것을
            권장합니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            4. 과일·수산물 고르는 법
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            과일과 수산물은 신선도가 맛을 좌우합니다. 카테고리별 선택 기준을 알아두면
            장을 볼 때 큰 도움이 됩니다.
          </p>
          <div className="mt-4 space-y-3">
            <div className="p-3 rounded-lg bg-blue-50">
              <p className="font-semibold text-gray-800 text-sm mb-2">
                🍎 과일 선택 기준
              </p>
              <ul className="text-xs text-gray-700 space-y-1">
                {[
                  "색깔: 자연스러운 색감, 너무 밝거나 어두우면 탈색·병해 의심",
                  "향기: 과일 특유의 향기가 살짝 나야 익은 정도가 좋음",
                  "탄력: 약간의 탄력이 있되, 너무 물렀거나 딱딱하면 좋지 않음",
                  "무게: 같은 크기에 무거울수록 과즙이 많음",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <p className="font-semibold text-gray-800 text-sm mb-2">
                🐟 수산물 선택 기준
              </p>
              <ul className="text-xs text-gray-700 space-y-1">
                {[
                  "신선도: 눈이 투명하고, 아가미 색이 선명한 빨간색",
                  "냄새: 비린내가 너무 심하지 않고, 신선한 수산물 냄새",
                  "몸: 몸이 팽팽하고, 헐렁해 보이지 않음",
                  "배: 배가 납작하고 팽팽함 (물러 보이면 상한 것)",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            5. 식재료 보관 방법
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            올바른 보관 방법은 식재료의 신선도와 맛을 유지하는 핵심입니다.
            카테고리별 보관 팁을 알아두세요.
          </p>
          <div className="mt-4 space-y-2">
            {[
              {
                category: "채소",
                tips: ["냉장 보관(2-5℃) 필수", "물로 씻은 후 물기 제거", "깨끗한 용기에 정렬 보관", "2-3일 내 사용"],
              },
              {
                category: "과일",
                tips: [
                  "사과·배·배추: 냉장",
                  "수박·참외: 실온 (먹기 2시간 전 냉장)",
                  "바나나·키위: 실온 후 숙성도에 따라 냉장",
                  "포도·딸기: 냉장, 씻지 말고 먹을 때 씻기",
                ],
              },
              {
                category: "수산물",
                tips: ["구매 후 2일 내 조리", "냉장이 아닌 냉동 보관 추천", "얼음팩과 함께 보관", "냉동 시 1개월 이내 사용"],
              },
            ].map(({ category, tips }) => (
              <div key={category} className="p-3 rounded-lg bg-gray-50">
                <p className="font-semibold text-gray-800 text-sm mb-2">
                  {category}
                </p>
                <ul className="text-xs text-gray-700 space-y-1">
                  {tips.map((tip) => (
                    <li key={tip} className="flex gap-2">
                      <span className="shrink-0">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-100">
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
