# Lessons Learned

## 2026-02-26: 불필요한 FK 설계 (apt_meta_id)

**상황**: `apt_mgmt_fee`에 `apt_meta_id` INTEGER FK를 추가하고 backfill 로직을 설계함.

**문제**: `apt_mgmt_fee`와 `apt_meta` 모두 `kapt_code`를 공유하므로 직접 JOIN이 가능.
INTEGER FK는 성능 최적화일 뿐이며, 현재 규모(36K행)에서는 불필요한 복잡도.

**교훈**: 두 테이블이 공통 유니크 키를 이미 공유한다면 FK 중간 컬럼을 추가하지 말 것.
기존 키로 JOIN하면 충분한지 먼저 확인할 것.

## 2026-02-26: 과도한 데이터 연결 설계 (apt_seq 매칭)

**상황**: K-apt 관리비 데이터(kapt_code)와 실거래가 데이터(apt_seq)를 apt_meta로 통합하려 함.
JSONL 전체 스캔 + 이름 퍼지 매칭 로직을 작성함.

**문제**: 관리비 서비스와 실거래가 서비스는 독립적으로 동작하며 현재 교차 데이터가 필요 없음.
실제로 필요하지 않은 연결을 위해 복잡한 로직을 추가한 YAGNI 위반.

**교훈**: 현재 서비스에 실제로 필요한 데이터 연결인지 먼저 확인할 것.
"나중에 필요할 수도 있다"는 이유로 복잡도를 추가하지 말 것.

## 모바일/PC 양쪽 기준 개발 (항상 적용)

모든 프론트엔드 작업은 모바일(375px)과 PC(1280px) 양쪽에서 확인해야 함.
Tailwind 반응형 프리픽스(`sm:`, `md:`) 적극 활용.
수평 오버플로우 방지: 페이지/섹션 루트에 `overflow-x-hidden` 적용.

## 2026-02-28: D1 Workers 100컬럼 제한

**상황**: `apt_mgmt_fee`(59컬럼) + `apt_mgmt_fee_summary` 3중 LEFT JOIN(73컬럼) = 132컬럼 → `"D1_ERROR: too many columns in result set"` 에러 발생.

**규칙**:
- D1 쿼리 결과는 **100컬럼 이하** 유지. `SELECT *` 조인 전 반드시 `SELECT COUNT(*)`로 컬럼 수 추산.
- 넓은 테이블 JOIN이 필요하면 별도 쿼리로 분리한 뒤 TypeScript에서 병합.

## 2026-02-28: D1 Workers 동시 쿼리 금지

**상황**: `Promise.all([db.prepare(...).first(), db.prepare(...).first()])` → Worker 비정상 종료, try-catch도 잡지 못함.

**원인**: D1 Workers는 요청당 1개의 D1 쿼리만 in-flight 허용. 동시 실행 자체가 Worker 레벨에서 금지.

**규칙**: 복수 D1 쿼리는 반드시 `db.batch([...])` 사용. `Promise.all`로 D1 쿼리 병렬화 절대 금지.

## 2026-02-28: 에러를 notFound()로 변환하면 디버깅 불가

**상황**: `page.tsx`에서 `catch(e) { notFound() }` → 실제 DB 에러가 404로 위장되어 원인 파악 불가.

**규칙**: Server Component에서 DB 에러는 `throw`로 전파 → `error.tsx`가 처리. `notFound()`는 오직 "데이터 없음" 케이스에만 사용.

## 2026-02-28: Workers 에러 디버깅 방법

**유효한 방법 (우선순위 순)**:
1. `wrangler tail` — 실시간 Worker 로그 스트리밍, 정확한 에러 메시지 확인
2. 임시 디버그 API route — Workers 컨텍스트에서 개별 쿼리 단계 격리 테스트
3. `wrangler d1 execute --remote` — 쿼리 자체는 통과해도 Workers 제한에 걸릴 수 있어 단독 테스트만으로 불충분

**무효한 방법**: `npm run dev` 로컬 실행 (mock fallback 사용, Workers 제한 없음, 재현 불가)

## 2026-02-26: `export const runtime = 'edge'` 금지

**상황**: Next.js API route (`/api/apt-mgmt/apts/route.ts`)에 `export const runtime = 'edge'` 선언 → 500 에러 반환.

**원인**: OpenNext (`@opennextjs/cloudflare`) 번들링 방식과 충돌. runtime 지시어가 있으면 핸들러가 정상 실행되지 않음.

**규칙**: Cloudflare Workers 배포 시 API route에 `runtime` 지시어 추가 금지. Next.js 기본 runtime 사용.
