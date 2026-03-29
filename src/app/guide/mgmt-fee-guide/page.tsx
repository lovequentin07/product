import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "적정 관리비 판단 기준과 절약 방법 | DataZip",
  description:
    "아파트 관리비가 적정한지 판단하는 기준과 관리비를 절약하는 실전 방법을 알아보세요. K-apt 공시 데이터를 활용한 관리비 비교 가이드.",
  keywords: ['아파트 관리비 절감', '관리비 비교', '관리비 항목별 분석'],
  alternates: { canonical: "/guide/mgmt-fee-guide" },
  openGraph: {
    title: "적정 관리비 판단 기준과 절약 방법",
    description:
      "관리비 적정 수준 판단 기준, 항목별 구성, 절약 실전 방법을 알기 쉽게 설명합니다.",
    url: "/guide/mgmt-fee-guide",
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "적정 관리비 판단 기준과 절약 방법",
  description:
    "아파트 관리비가 적정한지 판단하는 기준과 관리비를 절약하는 실전 방법을 알아보세요.",
  author: { "@type": "Organization", name: "DataZip" },
  publisher: { "@type": "Organization", name: "DataZip", url: "https://datazip.net" },
  url: "https://datazip.net/guide/mgmt-fee-guide",
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: "https://datazip.net" },
    { "@type": "ListItem", position: 2, name: "가이드", item: "https://datazip.net/guide" },
    { "@type": "ListItem", position: 3, name: "관리비 가이드" },
  ],
};

export default function MgmtFeeGuidePage() {
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

      {/* 브레드크럼 */}
      <nav className="text-xs text-gray-400 mt-4 mb-6 flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-gray-600">홈</Link>
        <span>›</span>
        <span className="text-gray-600 font-medium">관리비 가이드</span>
      </nav>

      <article className="space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">
            적정 관리비 판단 기준과 절약 방법
          </h1>
          <p className="mt-3 text-gray-500 text-sm leading-relaxed">
            매달 고정 지출인 아파트 관리비, 우리 아파트는 비싼 편일까요, 저렴한 편일까요?
            이 가이드에서는 관리비 구성 요소와 적정 수준 판단 기준, 절약 방법까지 설명합니다.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            1. 아파트 관리비란?
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            아파트 관리비는 공동주택을 유지·관리하기 위해 입주민이 매달 납부하는 비용입니다.
            크게 <strong>공용관리비</strong>와 <strong>개별 사용료</strong>로 구분됩니다.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            공용관리비는 경비비, 청소비, 승강기 유지비, 조경비, 일반관리비 등 단지 전체에 공통으로 발생하는 비용을
            세대수로 나눠 부과합니다. 반면 개별 사용료는 난방·냉방비, 전기·수도·가스 사용량에 따라 세대별로 다르게 부과됩니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            2. 관리비 항목별 구성
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left px-4 py-2 text-gray-700 font-medium">항목</th>
                  <th className="text-left px-4 py-2 text-gray-700 font-medium">구분</th>
                  <th className="text-left px-4 py-2 text-gray-700 font-medium">설명</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["일반관리비", "공용", "관리사무소 인건비, 사무용품 등 기본 운영비"],
                  ["경비비", "공용", "경비원 인건비. 무인 경비 단지는 낮음"],
                  ["청소비", "공용", "복도·계단·주차장 청소 비용"],
                  ["승강기 유지비", "공용", "엘리베이터 점검·수리비. 고층·세대수 많을수록 높음"],
                  ["난방비", "개별", "세대별 난방 사용량 기준. 지역난방 vs 개별난방"],
                  ["전기료", "개별", "한전 요금 + 공용 전기 배분"],
                  ["수도료", "개별", "상수도·하수도 사용량 기준"],
                  ["장기수선충당금", "공용", "미래 외벽·지붕·엘리베이터 교체를 위한 적립금"],
                ].map(([item, type, desc]) => (
                  <tr key={item} className="text-gray-600">
                    <td className="px-4 py-2 font-medium text-gray-700">{item}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${type === "공용" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                        {type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            3. 적정 관리비 수준은?
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            서울 아파트 세대당 월 평균 관리비는 K-apt 공시 데이터 기준 약 <strong>7~9만원 수준</strong>입니다.
            그러나 단지 특성에 따라 편차가 크므로, 단순 금액보다 <strong>동일 조건 비교</strong>가 중요합니다.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
            <p className="font-medium text-gray-700">관리비에 영향을 주는 주요 요인</p>
            <ul className="space-y-1.5 text-gray-600">
              {[
                "세대수: 세대가 많을수록 공용 비용이 분산되어 세대당 부담 감소",
                "난방 방식: 지역난방 단지는 중앙난방보다 효율적으로 난방비가 낮은 경향",
                "준공연도: 노후 단지는 설비 유지비·장기수선충당금이 높음",
                "경비 방식: 유인 경비 단지는 무인 CCTV 대비 경비비 높음",
                "편의시설: 수영장·헬스장 등 커뮤니티 시설이 많을수록 관리비 상승",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            같은 동(洞)·구(區)의 비슷한 규모 단지와 비교했을 때 관리비가 20% 이상 높다면 원인을 파악할 필요가 있습니다.
            DataZip의 <Link href="/apt-mgmt" className="text-blue-500 hover:underline">관리비 지킴이</Link> 서비스에서
            우리 아파트의 동·구·서울 전체 순위를 무료로 확인할 수 있습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            4. 관리비 절약 방법
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            관리비는 개인 사용량을 줄이는 방법과 공동체 차원에서 비용을 낮추는 방법으로 나눌 수 있습니다.
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">개인이 할 수 있는 절약 방법</h3>
              <ul className="space-y-1.5 text-sm text-gray-600">
                {[
                  "에너지 절약 가전 사용: LED 조명, 인버터 에어컨 등으로 전기료 절감",
                  "난방 온도 1~2도 낮추기: 실내 18~20°C 유지만으로도 난방비 10% 이상 절약 가능",
                  "수도 누수 점검: 세면대·변기 누수는 수도료를 크게 높이므로 정기 점검 필요",
                  "장기수선충당금 환급: 이사 시 그동안 납부한 충당금을 퇴거 전에 반드시 환급받을 것",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="shrink-0 text-green-500">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">입주자대표회의를 통한 절약</h3>
              <ul className="space-y-1.5 text-sm text-gray-600">
                {[
                  "경비 방식 전환 검토: 유인→무인 CCTV 전환 시 경비비 30~50% 절감 가능",
                  "청소 주기·인원 조정: 실태 조사 후 적정 청소 빈도 협의",
                  "에너지 절약 공사: LED 교체, 인버터 펌프 도입으로 공용 전기료 절감",
                  "관리비 내역 투명화: K-apt 공시 데이터와 우리 단지 내역을 정기적으로 비교",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="shrink-0 text-blue-500">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            5. 이사 전 관리비 미리 확인하기
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            이사를 고려하는 아파트가 있다면, 계약 전 관리비를 반드시 확인하세요.
            월세·전세 계약 시 관리비는 임대 비용에 추가되는 고정 지출이므로, 총 주거비를 계산할 때 반드시 포함해야 합니다.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            DataZip 관리비 지킴이에서 후보 단지를 검색하면 최근 공시 관리비와 동·구 순위를 즉시 확인할 수 있습니다.
            관리비가 같은 지역 평균보다 높다면 입주 전에 이유를 파악하고, 단지 입주자대표회의 회의록(K-apt 공개)도 살펴보세요.
          </p>
          <div className="bg-orange-50 rounded-xl p-4 text-sm text-orange-800">
            <p className="font-medium mb-1">체크리스트</p>
            <ul className="space-y-1 text-orange-700">
              {[
                "K-apt 또는 DataZip에서 최근 3개월 관리비 확인",
                "관리비 항목별 금액 확인 (공용 vs 개별 비중)",
                "동·구 평균 대비 순위 파악",
                "난방 방식 확인 (지역난방·개별난방·중앙난방)",
                "입주자대표회의 운영 여부 확인",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="shrink-0">☐</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <Link
            href="/apt-mgmt"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            우리 아파트 관리비 확인하기 →
          </Link>
        </div>
      </article>
    </div>
  );
}
