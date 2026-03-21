# Lessons Learned

## 2026-03-22: 폰트 지정 시 사용자 원래 폰트 확인 필수

**상황**: 범례 텍스트에서 "오늘"의 폰트가 다르게 보인다는 피드백 → 명시적 폰트(`system-ui, -apple-system, sans-serif`)를 지정 → 오히려 더 이상한 폰트가 됨

**원인**: 프로젝트의 Tailwind 기본 폰트 스택을 먼저 확인하지 않고 임의로 폰트 지정

**올바른 방법**:
1. 먼저 현재 폰트 상태 확인 (tailwind.config, 브라우저 DevTools)
2. 명시적 폰트 지정이 필요한지 판단
3. 필요하면 프로젝트의 기존 폰트 스택을 사용
4. 한글 렌더링 차이는 브라우저/OS 차이일 수 있음 — 폰트보다 다른 원인 탐색

**교훈**: UI 스타일링은 "원래 상태"를 모르면 고칠 수 없음. 폰트 변경 전 기본값 확인 필수.

---

## 2026-03-04: bash에서 `=` 포함 env 값 추출 시 `cut -d= -f2` 금지

**상황**: API 키(`...Aw==`)를 `grep KEY .env.local | cut -d= -f2`로 추출 → 끝의 `==` 유실 (88자 → 86자) → API 인증 401.

**올바른 방법**: `grep KEY .env.local | sed 's/^KEY_NAME=//'`

**교훈**: Base64 키처럼 `=`가 값에 포함된 경우 `cut -d= -f2`는 첫 번째 `=`에서 잘림. `sed`로 키 이름만 제거할 것.

---

## 2026-03-04: K-APT API callEndpoint 버그 2가지 (searchDate + totalCount)

**상황**: `sync-kapt-mgmt.ts` 실행 시 100건 처리 후 완료=0, 전부 null.

**원인 1 — 파라미터명 오류**:
- 잘못됨: `inqYm: ym`
- 올바름: `searchDate: ym`
- 파이썬 스크립트(성공)와 비교해서 발견

**원인 2 — 응답 파싱 오류**:
- 코드가 `body.totalCount`로 데이터 존재 여부 판단 → API 응답에 `totalCount` 없으면 `Number(undefined ?? 0) = 0` → 즉시 null 리턴
- 실제 응답 구조: `response.body.item` 직접 (items 래퍼·totalCount 없음)
- 수정: totalCount 체크 제거, `body.item` 직접 접근 우선

**수정 파일**: `src/scripts/fetch-kapt-mgmt.ts` `callEndpoint()` 함수

**교훈**: 공공 API 디버깅 시 raw response를 먼저 찍어볼 것. 파라미터명은 파이썬 예제 코드와 대조.

---

## 2026-03-04: K-APT API — 기존 "done" 파일도 실제 데이터 없음

**상황**: `fetch-kapt-mgmt.ts`(구버전)는 API 응답이 전부 null이어도 JSON 파일을 저장함.
→ 65개 "done" 파일이 있었지만 모두 `common/private/repair` 전부 null인 빈 파일.

**교훈**:
- K-APT API 미등록 단지는 모든 엔드포인트가 null 반환 → 파일 저장 전에 데이터 존재 여부 확인 필수
- 새 `sync-kapt-mgmt.ts`는 `hasData` 체크 후 저장 (올바름)
- 기존 done 65개는 실제로는 미등록 단지 — schedule.json 정리 필요

## 2026-03-04: tsx 스크립트 import 시 main() 자동 실행 문제

**상황**: `sync-kapt-mgmt.ts`에서 `fetch-kapt-mgmt.ts`를 import하자 `main()`이 자동 실행되어 API key 체크로 process.exit.

**해결**: `process.argv[1]`으로 직접 실행 여부 체크 후 `main()` 호출.
```typescript
const isDirectRun = process.argv[1]?.endsWith('fetch-kapt-mgmt.ts');
if (isDirectRun) { main().catch(...); }
```

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
