import type { Metadata } from "next";
import Link from "next/link";
import ServiceLayout from "@shared/components/ui/ServiceLayout";

export const metadata: Metadata = {
  title: "문의하기 | DataZip",
  description:
    "DataZip 서비스 관련 문의, 데이터 오류 신고, 서비스 제안을 보내주세요. 영업일 기준 2~3일 이내 답변드립니다.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "문의하기 | DataZip",
    description: "DataZip 서비스 관련 문의, 데이터 오류 신고, 서비스 제안을 보내주세요.",
    url: "/contact",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: "https://datazip.net" },
    { "@type": "ListItem", position: 2, name: "문의" },
  ],
};

export default function ContactPage() {
  return (
    <ServiceLayout>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* 브레드크럼 */}
      <nav className="text-xs text-gray-400 mt-4 mb-6 flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-gray-600">홈</Link>
        <span>›</span>
        <span className="text-gray-600 font-medium">문의</span>
      </nav>

      <article className="prose prose-sm max-w-none space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">
            문의하기
          </h1>
          <p className="mt-3 text-gray-500 text-sm leading-relaxed">
            DataZip 서비스 이용 중 궁금한 점이 있거나 개선 의견이 있으시면 이메일로 보내주세요.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">이메일 문의</h2>
          <div className="rounded-xl p-5 space-y-1" style={{ background: 'var(--ds-accent-faint)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--ds-ink-muted)' }}>문의 이메일</p>
            <p className="text-base font-semibold text-gray-800">
              <a
                href="mailto:datazip.help@gmail.com"
                className="hover:underline"
                style={{ color: 'var(--ds-accent)' }}
              >
                datazip.help@gmail.com
              </a>
            </p>
            <p className="text-xs text-gray-400 mt-2">영업일 기준 2~3일 이내 답변드립니다.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">문의 유형 안내</h2>
          <ul className="space-y-4 text-sm text-gray-600">
            {[
              {
                icon: "📊",
                title: "데이터 오류 신고",
                desc: "시세나 실거래가 등 데이터에 오류가 있다고 판단되는 경우 알려주세요. 해당 페이지 URL과 내용을 함께 보내주시면 빠르게 확인하겠습니다.",
              },
              {
                icon: "💬",
                title: "서비스 이용 문의",
                desc: "서비스 이용 방법이나 데이터 해석이 궁금하신 경우 문의해주세요.",
              },
              {
                icon: "💡",
                title: "서비스 제안",
                desc: "추가됐으면 하는 서비스나 기능이 있다면 자유롭게 제안해주세요. 모든 의견을 검토합니다.",
              },
            ].map(({ icon, title, desc }) => (
              <li key={title} className="flex gap-3">
                <span className="shrink-0 text-base">{icon}</span>
                <div className="space-y-1">
                  <p className="font-medium text-gray-700">{title}</p>
                  <p className="leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </ServiceLayout>
  );
}
