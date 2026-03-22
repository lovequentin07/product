const faqs = [
  {
    question: '가격은 얼마나 자주 업데이트되나요?',
    answer:
      '한국농수산식품유통공사(aT) KAMIS 공공데이터 API를 통해 매일 최신 시세를 반영합니다. 도매가는 가락시장 경락가격 기준, 소매가는 전국 주요 마트·시장 평균가 기준입니다.',
  },
  {
    question: '도매가와 소매가 차이가 왜 이렇게 많이 나나요?',
    answer:
      '도매가는 가락시장 같은 도매시장에서 대량 거래되는 가격입니다. 소매가에는 운송·보관·인건비 등 유통 마진이 추가되어 평균 30~50% 높습니다. 전통시장은 대형마트보다 마진이 낮아 소매가가 더 저렴한 편입니다.',
  },
  {
    question: '가락시장 도매가란 무엇인가요?',
    answer:
      '가락시장(서울 송파구)은 국내 최대 농수산물 도매시장입니다. 전국 산지에서 올라온 농산물이 경매로 거래되며, 이 도매가가 전국 소매 가격의 기준이 됩니다. 대형마트·전통시장 모두 이 도매가에 유통 마진을 더해 판매합니다.',
  },
  {
    question: '특·상·중·하·수입 등급 차이는 무엇인가요?',
    answer:
      '특·상·중·하는 국내 농산물의 품질 등급입니다. 특이 가장 품질이 높고 가격도 비쌉니다. 수입은 해외 산지 제품으로 일반적으로 저렴하지만 신선도는 낮을 수 있습니다. 가성비를 원하면 상·중 등급이 적합합니다.',
  },
]

export default function MarketFAQ() {
  return (
    <section aria-label="자주 묻는 질문" className="bg-white px-4 pt-5 pb-6 border-t border-gray-100">
      <h2 className="leading-snug mb-3" style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>
        자주 묻는 질문
      </h2>
      <dl className="flex flex-col">
        {faqs.map(({ question, answer }, i) => (
          <details
            key={question}
            className={`group bg-white overflow-hidden ${i < faqs.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <summary className="flex items-center justify-between cursor-pointer py-4 list-none min-h-[44px]">
              <dt className="text-sm font-medium text-gray-800">
                <span className="text-blue-600 font-bold mr-1.5">Q.</span>
                {question}
              </dt>
              <span className="ml-3 shrink-0 text-gray-400 group-open:rotate-180 transition-transform">
                ▾
              </span>
            </summary>
            <dd className="pl-6 pb-4 text-sm text-gray-600 leading-relaxed">{answer}</dd>
          </details>
        ))}
      </dl>
    </section>
  )
}
