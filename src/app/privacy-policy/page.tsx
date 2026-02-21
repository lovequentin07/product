import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "DataZip 개인정보처리방침",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "2026년 2월 21일";

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">개인정보처리방침</h1>
      <p className="text-sm text-gray-500 mb-8">최종 수정일: {lastUpdated}</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">1. 수집하는 개인정보</h2>
        <p className="text-gray-700 leading-relaxed">
          본 서비스(datazip.net)는 별도의 회원가입 없이 이용 가능하며, 개인정보를 직접 수집하지 않습니다.
          다만, 서비스 품질 향상을 위해 아래와 같은 도구를 통해 익명의 사용 데이터가 자동 수집될 수 있습니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">2. 제3자 서비스</h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <div>
            <h3 className="font-medium mb-1">Google Analytics (GA4)</h3>
            <p>
              페이지 조회수, 방문자 수 등 익명의 통계 데이터를 수집합니다.
              수집된 데이터는 Google의 개인정보처리방침에 따라 처리됩니다.
              자세한 내용은{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Google 개인정보처리방침
              </a>
              을 참고하세요.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Microsoft Clarity</h3>
            <p>
              사용자 행동 분석(클릭, 스크롤 등)을 위한 익명 데이터를 수집합니다.
              자세한 내용은{" "}
              <a
                href="https://privacy.microsoft.com/privacystatement"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Microsoft 개인정보처리방침
              </a>
              을 참고하세요.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Google AdSense</h3>
            <p>
              맞춤형 광고 제공을 위해 쿠키를 사용할 수 있습니다.
              광고 쿠키 사용을 원하지 않는 경우{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Google 광고 설정
              </a>
              에서 조정하실 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">3. 쿠키</h2>
        <p className="text-gray-700 leading-relaxed">
          본 서비스는 광고 및 분석 목적으로 쿠키를 사용할 수 있습니다.
          브라우저 설정에서 쿠키를 비활성화할 수 있으나, 일부 기능이 제한될 수 있습니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">4. 데이터 보안</h2>
        <p className="text-gray-700 leading-relaxed">
          본 서비스에서 제공하는 데이터는 국토교통부 공공데이터포털의 아파트 실거래가 공개 데이터를 기반으로 합니다.
          개인 식별이 가능한 정보는 포함되어 있지 않습니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">5. 문의</h2>
        <p className="text-gray-700 leading-relaxed">
          개인정보처리방침에 대한 문의사항이 있으시면 아래로 연락해 주세요.
        </p>
        <p className="mt-2 text-gray-700">
          사이트: <a href="https://datazip.net" className="text-blue-600 underline">datazip.net</a>
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">6. 방침 변경</h2>
        <p className="text-gray-700 leading-relaxed">
          본 개인정보처리방침은 법령 변경 또는 서비스 변경에 따라 수정될 수 있으며,
          변경 시 본 페이지에 최종 수정일을 업데이트합니다.
        </p>
      </section>
    </div>
  );
}
