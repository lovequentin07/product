import type { Metadata } from "next";
import Link from "next/link";
import ServiceLayout from "@shared/components/ui/ServiceLayout";
import PrimaryButton from "@shared/components/ui/PrimaryButton";

export const metadata: Metadata = {
  title: "아파트 실거래가 보는 법 완벽 가이드 | DataZip",
  description:
    "아파트 실거래가 조회 방법부터 시세 분석, 층·면적별 가격 차이까지 알기 쉽게 설명합니다. 국토교통부 공개 데이터를 활용한 실전 가이드.",
  keywords: ['아파트 시세 조회', '실거래가 보는 법', '부동산 가격 확인'],
  alternates: { canonical: "/guide/apt-price-guide" },
  openGraph: {
    title: "아파트 실거래가 보는 법 완벽 가이드",
    description:
      "실거래가 조회 방법, 시세 분석 요령, 층·면적별 가격 차이를 쉽게 설명하는 실전 가이드.",
    url: "/guide/apt-price-guide",
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "아파트 실거래가 보는 법 완벽 가이드",
  description:
    "아파트 실거래가 조회 방법부터 시세 분석, 층·면적별 가격 차이까지 알기 쉽게 설명합니다.",
  author: { "@type": "Organization", name: "DataZip" },
  publisher: { "@type": "Organization", name: "DataZip", url: "https://datazip.net" },
  url: "https://datazip.net/guide/apt-price-guide",
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: "https://datazip.net" },
    { "@type": "ListItem", position: 2, name: "가이드", item: "https://datazip.net/guide" },
    { "@type": "ListItem", position: 3, name: "아파트 실거래가 보는 법" },
  ],
};

export default function AptPriceGuidePage() {
  return (
    <ServiceLayout>
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

      {/* 브레드크럼 */}
      <nav className="text-xs text-gray-400 mt-4 mb-6 flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-gray-600">홈</Link>
        <span>›</span>
        <span className="text-gray-600 font-medium">아파트 실거래가 가이드</span>
      </nav>

      <article className="prose prose-sm max-w-none space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">
            아파트 실거래가 보는 법 완벽 가이드
          </h1>
          <p className="mt-3 text-gray-500 text-sm leading-relaxed">
            아파트를 사거나 팔 때, 또는 이사를 준비할 때 가장 먼저 확인해야 할 것이 실거래가입니다.
            이 가이드에서는 실거래가 데이터를 읽는 방법과 올바르게 활용하는 요령을 설명합니다.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            1. 실거래가란 무엇인가?
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            실거래가는 아파트 매매 계약이 체결된 후 국토교통부에 신고된 실제 거래 금액입니다.
            2006년 부동산거래신고제도 도입 이후 모든 부동산 거래는 의무적으로 신고해야 하므로,
            허위 신고 시 과태료가 부과됩니다. 따라서 실거래가는 부동산 시세를 파악하는 가장 객관적인 기준입니다.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            부동산 플랫폼에서 보이는 <strong>호가(매도 희망가)</strong>는 판매자가 원하는 금액이지만,
            실거래가는 매수자와 매도자가 합의한 실제 가격입니다.
            시장이 약세일 때는 호가보다 실거래가가 훨씬 낮을 수 있으므로, 반드시 실거래가를 기준으로 비교해야 합니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            2. 실거래가 데이터 구성 요소
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            실거래가 정보에는 다음과 같은 항목이 포함됩니다.
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              { term: "거래 금액", desc: "실제 매매 계약금액 (단위: 만원)" },
              { term: "전용면적", desc: "방·거실·욕실 등 실제 사용 가능한 면적 (㎡). 발코니·공용복도 제외" },
              { term: "층", desc: "해당 거래의 층수. 고층일수록 통상 가격이 높음" },
              { term: "거래일", desc: "계약 체결 연월. 신고는 최대 30일 이내" },
              { term: "준공연도", desc: "아파트가 처음 완공된 연도. 구축일수록 할인 요인" },
              { term: "취소 여부", desc: "계약 해제(취소)된 거래는 별도 표시. 시세 분석 시 제외 권장" },
            ].map(({ term, desc }) => (
              <li key={term} className="flex gap-2">
                <span className="font-medium text-gray-700 shrink-0">{term}:</span>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            3. 실거래가로 시세 파악하는 방법
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            특정 아파트의 적정 시세를 파악하려면 <strong>같은 면적대의 최근 3~6개월 거래</strong>를 확인하세요.
            거래 건수가 적은 소규모 단지라면 최근 1~2년치 데이터를 참고하되, 시장 흐름도 함께 고려해야 합니다.
          </p>
          <div className="rounded-xl p-4 text-sm space-y-2" style={{ background: 'var(--ds-accent-faint)' }}>
            <p className="font-medium" style={{ color: 'var(--ds-ink-muted)' }}>시세 분석 순서</p>
            <ol className="list-decimal list-inside space-y-1" style={{ color: 'var(--ds-ink-muted)' }}>
              <li>아파트 이름 검색 후 최근 6개월 거래 확인</li>
              <li>같은 전용면적 거래만 필터링</li>
              <li>취소 거래 제외 후 평균·최고·최저 확인</li>
              <li>층수 차이(저층 ↔ 고층)로 인한 가격 편차 파악</li>
              <li>1년 전과 비교해 가격 추세(상승/하락) 판단</li>
            </ol>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            4. 층수·면적별 가격 차이
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            같은 아파트라도 층수와 면적에 따라 가격이 크게 다릅니다.
            일반적으로 <strong>고층(상층부)</strong>은 조망권·채광 우위로 저층보다 5~15% 높게 거래됩니다.
            1~2층은 특수 상황(정원 전유, 노인 거주 등)을 제외하면 보통 할인 거래됩니다.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            면적은 <strong>전용면적(㎡)</strong>을 기준으로 비교하세요. 공급면적(분양 면적)은 공용 복도·계단을 포함해
            체감 크기와 다를 수 있습니다. 보통 전용 59㎡ = 구 25평형, 84㎡ = 구 34평형으로 통용됩니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            5. 실거래가 활용 시 주의사항
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              "최신 거래가 없는 단지는 1년 이상 공백이 있을 수 있어 시세 정확도가 떨어짐",
              "특수 관계인(친족 간) 거래나 증여성 거래는 시세와 다를 수 있음",
              "재건축·리모델링 호재가 있는 단지는 기대감이 가격에 선반영되기도 함",
              "입주 직후 단지는 거래량이 적어 표본이 부족할 수 있음",
              "계약 해제(취소) 거래는 시세 분석에서 반드시 제외해야 함",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="shrink-0 text-orange-400">⚠</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            6. DataZip에서 실거래가 조회하기
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            DataZip의 <Link href="/apt" className="hover:underline" style={{ color: 'var(--ds-accent)' }}>아파트 실거래가 조회</Link> 서비스에서는
            서울 전체 131만건 이상의 실거래 데이터를 무료로 검색할 수 있습니다.
            아파트 이름으로 검색하거나, 지역(구)과 거래 연월을 선택해 원하는 조건의 거래 내역을 확인하세요.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            평균 거래가, 최고·최저가, 평당 가격(㎡당 환산)을 한눈에 볼 수 있어
            빠른 시세 파악과 단지 간 비교가 가능합니다. 데이터는 국토교통부 공개 데이터를 기반으로 정기 업데이트됩니다.
          </p>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <PrimaryButton href="/apt">실거래가 조회하기 →</PrimaryButton>
        </div>
      </article>
    </ServiceLayout>
  );
}
