import type { Metadata } from "next";
import Link from "next/link";
import ServiceLayout from "@shared/components/ui/ServiceLayout";
import PrimaryButton from "@shared/components/ui/PrimaryButton";

export const metadata: Metadata = {
  title: "DataZip 소개 | DataZip",
  description:
    "DataZip은 누구나 쉽게 데이터를 찾고 활용할 수 있도록 만든 서비스입니다. 농수축산물 시세·아파트 실거래가·관리비 정보를 매일 업데이트합니다.",
  keywords: ['DataZip', '데이터 조회 서비스', '공공데이터', '시세 확인'],
  alternates: { canonical: "/about" },
  openGraph: {
    title: "DataZip 소개",
    description:
      "누구나 쉽게 데이터를 찾고 활용할 수 있도록 만든 서비스. 농수축산물 시세·아파트 실거래가·관리비 정보를 무료로 제공합니다.",
    url: "/about",
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "DataZip 소개",
  description:
    "DataZip은 누구나 쉽게 데이터를 찾고 활용할 수 있도록 만든 서비스입니다.",
  author: { "@type": "Organization", name: "DataZip" },
  publisher: { "@type": "Organization", name: "DataZip", url: "https://datazip.net" },
  url: "https://datazip.net/about",
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: "https://datazip.net" },
    { "@type": "ListItem", position: 2, name: "소개" },
  ],
};

export default function AboutPage() {
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
        <span className="text-gray-600 font-medium">소개</span>
      </nav>

      <article className="prose prose-sm max-w-none space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">
            DataZip 소개
          </h1>
          <p className="mt-3 text-gray-500 text-sm leading-relaxed">
            DataZip은 데이터를 누구나 쉽게 쓸 수 있게 만드는 서비스입니다.
            복잡하게 흩어진 데이터를 모아 3초 안에 확인할 수 있도록 정리합니다.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            1. DataZip이란?
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            오늘 딸기가 싼지, 우리 동네 아파트가 얼마에 팔렸는지, 관리비가 비싼 편인지 — 이런 정보는
            알고 싶지만 찾기가 번거롭습니다. DataZip은 이처럼 실생활에 필요한 데이터를 모아
            누구나 즉시 확인할 수 있도록 제공합니다.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            공공기관 데이터부터 민간 데이터까지, 유용한 데이터라면 출처를 가리지 않습니다.
            앞으로도 계속 새로운 데이터와 서비스를 추가할 예정입니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            2. 제공 서비스
          </h2>
          <ul className="space-y-3 text-sm text-gray-600">
            {[
              {
                name: "장바구니 시세",
                href: "/market",
                desc: "오늘 저렴한 농수축산물을 한눈에 확인하세요. 과거 대비 몇 % 수준인지 즉시 파악할 수 있습니다.",
              },
              {
                name: "아파트 실거래가",
                href: "/apt",
                desc: "서울 전체 130만건 이상의 매매 거래 이력을 무료로 검색할 수 있습니다.",
              },
              {
                name: "관리비 지킴이",
                href: "/apt-mgmt",
                desc: "우리 아파트 관리비가 동네·구·서울 평균 대비 어느 수준인지 비교합니다.",
              },
            ].map(({ name, href, desc }) => (
              <li key={href} className="flex gap-2">
                <span className="shrink-0 text-orange-500 font-medium">
                  <Link href={href} className="hover:underline" style={{ color: 'var(--ds-accent)' }}>{name}</Link>
                </span>
                <span>— {desc}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            3. 데이터 출처
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            현재 DataZip이 활용하는 데이터 출처는 다음과 같습니다. 앞으로도 계속 확장할 예정입니다.
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              { term: "한국농수산식품유통공사(aT)", desc: "농수축산물 도매·소매 시세 데이터" },
              { term: "국토교통부", desc: "아파트 실거래가 공개 데이터 (2006년~현재)" },
              { term: "K-APT (공동주택관리정보시스템)", desc: "아파트 관리비 공시 데이터" },
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
            4. 업데이트 주기
          </h2>
          <div className="rounded-xl p-4 text-sm space-y-2" style={{ background: 'var(--ds-accent-faint)' }}>
            <ul className="space-y-1" style={{ color: 'var(--ds-ink-muted)' }}>
              {[
                { service: "장바구니 시세", cycle: "매일 (평일 오전 자동 수집)" },
                { service: "아파트 실거래가", cycle: "월 1회 이상 (국토부 공개 주기에 따라)" },
                { service: "관리비", cycle: "분기 1회 (K-APT 공시 주기에 따라)" },
              ].map(({ service, cycle }) => (
                <li key={service} className="flex gap-2">
                  <span className="font-medium shrink-0">{service}:</span>
                  <span>{cycle}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            5. 운영 방식
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            DataZip은 개인이 운영하는 무료 서비스입니다. 광고 수익으로 서버 비용과 개발을 유지합니다.
            데이터 오류 발견이나 서비스 제안은{" "}
            <Link href="/contact" className="hover:underline" style={{ color: 'var(--ds-accent)' }}>문의 페이지</Link>를
            통해 언제든지 보내주세요.
          </p>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <PrimaryButton href="/market">시세 확인하기 →</PrimaryButton>
        </div>
      </article>
    </ServiceLayout>
  );
}
