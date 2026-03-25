const faqs = [
  {
    question: '가격은 얼마나 자주 업데이트되나요?',
    answer:
      '매일 최신 시세를 반영합니다. 도매가는 전국 주요 도매시장 경락가격, 소매가는 전국 마트·재래시장 평균가를 기준으로 합니다.',
  },
  {
    question: "'하위 N%'는 무슨 뜻인가요?",
    answer:
      "최근 1년치 월별 가격을 기준으로, 현재 가격이 얼마나 저렴한지 나타냅니다. 예를 들어 '하위 10%'는 지난 1년 중 10%의 시기에만 지금보다 쌌다는 의미로, 숫자가 낮을수록 저렴한 시기입니다.",
  },
  {
    question: '도매가와 소매가 차이가 왜 이렇게 많이 나나요?',
    answer:
      '도매가는 산지에서 도매시장으로 들어오는 1차 가격입니다. 소매가에는 운송·보관·인건비 등 유통 마진이 더해져 일반적으로 30~50% 높아집니다.',
  },
  {
    question: '특·상·중·하·수입 등급 차이는 무엇인가요?',
    answer:
      '크기·외관·당도 등을 기준으로 매긴 품질 등급입니다. 특이 가장 고품질이고, 가성비를 원하면 상·중 등급이 적합합니다. 수입산은 국산보다 저렴하지만 신선도가 낮을 수 있습니다.',
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
