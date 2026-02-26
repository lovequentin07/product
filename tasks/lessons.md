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

## 2026-02-26: `export const runtime = 'edge'` 금지

**상황**: Next.js API route (`/api/apt-mgmt/apts/route.ts`)에 `export const runtime = 'edge'` 선언 → 500 에러 반환.

**원인**: OpenNext (`@opennextjs/cloudflare`) 번들링 방식과 충돌. runtime 지시어가 있으면 핸들러가 정상 실행되지 않음.

**규칙**: Cloudflare Workers 배포 시 API route에 `runtime` 지시어 추가 금지. Next.js 기본 runtime 사용.
