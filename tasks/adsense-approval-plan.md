# 애드센스 재승인 작업 계획

> 작성일: 2026-03-29
> 목표: Google AdSense 재승인 획득
> 탈락 원인: 콘텐츠 절대량 부족, About/Contact 페이지 없음
> 예상 완료 후 재신청 타이밍: 작업 완료 + 2~3주 구글 크롤링 대기
> 문의 이메일: datazip.help@gmail.com (Gmail 계정 생성 완료 2026-03-30)

---

## 현황 요약

| 현재 페이지 | 콘텐츠 유형 | AdSense 관점 |
|------------|-----------|-------------|
| `/apt` | 검색 폼 + FAQ | 도구 페이지 (콘텐츠 부족) |
| `/apt-mgmt` | 검색 폼 + FAQ | 도구 페이지 (콘텐츠 부족) |
| `/market` | 목록 + FAQ | 도구 페이지 (콘텐츠 부족) |
| `/market/[id]` | 가격 + 차트만 | 매우 얇음 |
| `/guide/apt-price-guide` | 아티클 ✅ | 양질 |
| `/guide/mgmt-fee-guide` | 아티클 ✅ | 양질 |
| `/about` | ❌ 없음 | AdSense 필수 항목 |
| `/contact` | ❌ 없음 | AdSense 확인 항목 |

**결론**: 가이드 페이지 2개만으론 부족. 최소 10개 이상 콘텐츠 페이지 필요.

---

## 작업 목록

### Phase 1 — 필수 페이지 추가 ✅ 완료 (2026-03-30, 커밋 7f4030a)

#### [x] 1-1. `/about` 페이지 생성
- 파일: `src/app/about/page.tsx`
- 내용:
  - DataZip 소개 (공공데이터를 쉽게 찾아볼 수 있는 서비스)
  - 사용 데이터 출처: 한국농수산식품유통공사(aT), 국토교통부, K-APT
  - 서비스 목록 (장바구니 시세, 아파트 실거래가, 관리비 지킴이)
  - 데이터 업데이트 주기
  - 운영: 개인 프로젝트, 공공데이터 기반 정보 제공
- `generateMetadata` 포함
- 기존 가이드 페이지 스타일(`article` 태그, breadcrumb) 동일하게 적용

#### [x] 1-2. `/contact` 페이지 생성
- 파일: `src/app/contact/page.tsx`
- 내용:
  - 문의 이메일 표시 (하드코딩 또는 환경변수)
  - 간단한 안내 문구 (답변 소요 시간 등)
  - "데이터 오류 신고", "서비스 제안" 등 문의 유형 안내
- `generateMetadata` 포함

#### [x] 1-3. Footer에 About/Contact 링크 추가
- 파일: `src/components/Footer.tsx`
- 현재: `개인정보처리방침`만 있음
- 추가: `소개` `/about`, `문의` `/contact`

---

### Phase 2 — 가이드 콘텐츠 확장 (핵심)

모두 `src/app/guide/[slug]/page.tsx` 구조로 추가.
기존 `apt-price-guide`, `mgmt-fee-guide` 파일 구조를 그대로 복사해서 사용.

#### [ ] 2-1. `/guide/apt-jeonse-vs-monthly`
- 제목: 전세 vs 월세, 어떤 게 유리할까? 손익분기 계산법
- 내용:
  - 전세/월세 개념 설명
  - 전월세 전환율 개념 (현재 법정 상한)
  - 내 상황에 맞는 선택 기준 (거주 기간, 자금 상황)
  - 계산 예시: 보증금 2억 / 월세 80만 vs 전세 3억
  - 주의사항: 전세사기 리스크

#### [ ] 2-2. `/guide/apt-area-explanation`
- 제목: 아파트 전용면적·공급면적·계약면적 차이 완전 정리
- 내용:
  - 전용/공급/계약면적 정의
  - 구 평형과 ㎡ 환산표 (25평=84㎡ 등)
  - 왜 분양면적이 다른지
  - 발코니 확장 포함 여부
  - 실수요자 관점에서 어떤 면적 기준으로 비교해야 하는지

#### [ ] 2-3. `/guide/apartment-buying-checklist`
- 제목: 아파트 매수 전 반드시 확인해야 할 체크리스트 20가지
- 내용:
  - 등기부등본 확인 항목 (근저당, 가압류 등)
  - 실거래가 확인 방법
  - 관리비 확인
  - 학군/교통/편의시설
  - 재건축 가능성 (준공연도, 안전진단)
  - 하자보수 이력
  - DataZip 실거래가·관리비 링크 삽입

#### [ ] 2-4. `/guide/market-seasonal-price`
- 제목: 식재료 계절별 시세 패턴 — 언제 사면 가장 싼가
- 내용:
  - 계절성이 강한 품목 소개 (딸기, 수박, 배추 등)
  - 품목별 제철 시기 표 (월별)
  - 비수기에 비싸지는 이유 (산지 출하량 감소)
  - 냉동·수입산 대안 설명
  - DataZip으로 오늘 가격 확인하는 법 링크

#### [ ] 2-5. `/guide/market-wholesale-retail`
- 제목: 도매가와 소매가 차이가 왜 이렇게 클까?
- 내용:
  - 도매시장(aT 가락시장 등) 구조 설명
  - 중간 유통마진 단계별 설명
  - 소매가 = 도매가 × 몇 배인지 현실 데이터
  - 온라인 쇼핑몰이 소매가보다 싼 이유
  - 소비자가 도매가를 참고할 때 주의점

#### [ ] 2-6. `/guide/jeonse-deposit-protection`
- 제목: 전세보증금 지키는 법 — 전세사기 예방 완전 가이드
- 내용:
  - 전세사기 주요 유형 (깡통전세, 이중계약, 신탁등기)
  - 계약 전 필수 확인 사항 (등기부등본, HUG 가입 가능 여부)
  - 전세보증보험 종류와 가입 조건
  - 임대인 동의 없이 확인하는 법
  - DataZip 실거래가로 깡통전세 판단하는 법

#### [ ] 2-7. `/guide/apartment-remodeling-vs-rebuild`
- 제목: 재건축 vs 리모델링, 우리 아파트는 어떤 게 유리할까
- 내용:
  - 재건축/리모델링 요건 차이 (연한, 안전진단 등급)
  - 각각의 장단점
  - 재건축 초과이익 환수제 설명
  - 어떤 단지가 리모델링에 유리한지 기준
  - 실거래가에 미치는 영향

#### [ ] 2-8. `/guide/management-fee-dispute`
- 제목: 관리비 이의신청·분쟁 해결하는 방법
- 내용:
  - 관리비 과다 청구 확인 방법
  - 관리사무소에 이의신청하는 절차
  - 입주자대표회의를 통한 감사 요청
  - 중앙공동주택관리지원센터 민원 접수
  - K-APT 공시 데이터로 비교하는 법 (DataZip 관리비 서비스 링크)

---

### Phase 3 — 기존 서비스 페이지 콘텐츠 보강

#### [ ] 3-1. `/market/[id]` 상세 페이지에 품목 설명 추가
- 파일: `src/app/market/[item]/page.tsx` 또는 컴포넌트
- 추가할 내용 (품목별 static 데이터로 관리):
  - 품목 설명 2~3줄 (예: "딸기는 비타민 C가 풍부한 겨울 과일입니다")
  - 제철 시기 (예: "제철: 12월~4월")
  - 보관 방법 1줄 (현재 차트 아래 이미 있으면 유지)
  - 가격 해석 가이드 1줄 ("현재가는 과거 하위 8%로 구매 적기입니다")
- 구현 방법:
  - `src/data/item-descriptions.ts` 파일 생성
  - 주요 20~30개 품목에 설명 데이터 추가
  - 상세 페이지에서 `itemId`로 조회해서 렌더링

#### [ ] 3-2. `/apt/[sgg_nm]` 구별 페이지 콘텐츠 보강
- 현재: 거래 목록만 표시
- 추가: 해당 구에 대한 1~2문단 소개 텍스트
  - "강남구는 서울 3대 업무지구 중 하나로..."
  - 평균 거래가, 최근 트렌드 한 줄 요약
- 구별 소개는 `src/data/district-descriptions.ts`로 static 관리

---

### Phase 4 — sitemap 업데이트

#### [ ] 4-1. `src/app/sitemap.ts`에 신규 페이지 추가
- `/about`
- `/contact`
- `/guide/apt-jeonse-vs-monthly`
- `/guide/apt-area-explanation`
- `/guide/apartment-buying-checklist`
- `/guide/market-seasonal-price`
- `/guide/market-wholesale-retail`
- `/guide/jeonse-deposit-protection`
- `/guide/apartment-remodeling-vs-rebuild`
- `/guide/management-fee-dispute`

---

## 파일 참조 (기존 패턴 그대로 복사)

### 가이드 페이지 패턴 참조
- `src/app/guide/apt-price-guide/page.tsx` — 기존 가이드 구조 복사 기준
- `src/app/guide/mgmt-fee-guide/page.tsx` — 기존 가이드 구조 복사 기준

### Footer 참조
- `src/components/Footer.tsx` — About/Contact 링크 추가

### Sitemap 참조
- `src/app/sitemap.ts` — 신규 URL 추가

---

## 완료 기준 (재신청 전 체크리스트)

- [ ] `/about` 페이지 존재 + 내용 충실
- [ ] `/contact` 페이지 존재
- [ ] Footer에 About/Contact 링크
- [ ] 가이드 페이지 총 **10개 이상** (현재 2개 → 목표 10개)
- [ ] `/market/[id]` 에 품목 설명 텍스트 추가
- [ ] sitemap.ts 업데이트
- [ ] `npm run build` 성공
- [ ] git push → Cloudflare 배포 완료
- [ ] **2~3주 대기** (구글 크롤링 인덱싱 시간)
- [ ] AdSense 재신청

---

## 작업 순서 권장

1. Phase 1 (About + Contact + Footer) — 30분
2. Phase 2 가이드 4개 (2-1 ~ 2-4) — 2시간
3. Phase 2 가이드 4개 (2-5 ~ 2-8) — 2시간
4. Phase 3-1 품목 설명 추가 — 1시간
5. Phase 4 sitemap 업데이트 — 15분
6. 빌드 확인 + 배포

**총 예상 작업 시간: 약 6시간 (세션 2~3회 분량)**
