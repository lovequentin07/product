# 분양권/입주권 거래 통합 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 국토교통부 분양권 전매 API(RTMSDataSvcSilvTrade)를 기존 매매 데이터와 통합하여 래미안원페를라 같은 신규 분양 단지의 입주권 거래를 datazip.net `/apt` 서비스에서 조회 가능하게 한다.

**Architecture:** apt_transactions 테이블에 deal_type 컬럼을 추가하고, 분양권 API를 기존 XML 클라이언트로 호출하여 같은 테이블에 INSERT한다. UI에서는 거래유형 필터 버튼과 배지를 추가한다. 분양권 API는 aptSeq 없음 → apt_meta 조인 시 UNIQUE(sgg_cd, umd_nm, apt_nm) 인덱스 사용.

**Tech Stack:** TypeScript, Next.js 16 App Router, Cloudflare D1(SQLite), wrangler CLI, `callPublicDataApi` (fast-xml-parser 기반 XML 파서)

---

## 파일 변경 목록

| 파일 | 작업 |
|------|------|
| `src/shared/data/schema.sql` | apt_transactions에 4개 컬럼 추가 (ALTER TABLE 주석) |
| `src/apt/scripts/migrate-add-deal-type.ts` | **신규** — D1 remote에 ALTER TABLE 실행 |
| `src/apt/lib/api/apartment.ts` | `getRawSilvTradeTransactions()` 함수 추가 |
| `src/apt/types/real-estate.ts` | `SilvTradeItem` 인터페이스, `NormalizedTransaction.dealType` 추가 |
| `src/shared/lib/db/types.ts` | `TransactionRow.deal_type`, `TransactionQueryParams.deal_type` 추가 |
| `src/apt/scripts/update-recent.ts` | 분양권 수집 루프 추가, DELETE에 deal_type 조건, INSERT에 deal_type 컬럼 |
| `src/apt/lib/db/transactions.ts` | deal_type 필터 파라미터 추가 |
| `src/apt/lib/apt-utils.ts` | `toNormalized`에 dealType 매핑 추가 |
| `src/apt/components/apartment/TransactionsClientComponent.tsx` | 거래유형 필터 버튼 추가 |
| `src/apt/components/apartment/TransactionList.tsx` | 거래유형 배지 렌더링 추가 |
| `src/app/apt/[sgg_nm]/page.tsx` | dealType searchParam 처리, Suspense key에 포함 |

---

## Task 1: DB 스키마 변경 및 마이그레이션

**Files:**
- Modify: `src/shared/data/schema.sql`
- Create: `src/apt/scripts/migrate-add-deal-type.ts`

- [ ] **Step 1: schema.sql에 4개 컬럼 주석 추가**

`src/shared/data/schema.sql` 파일에서 `created_at DATETIME DEFAULT CURRENT_TIMESTAMP` 줄 바로 위에 아래 블록을 추가한다 (apt_transactions 테이블 정의 내부):

```sql
  -- [거래 유형 — 매매/신규분양권/입주권]
  deal_type           TEXT NOT NULL DEFAULT '매매',  -- '매매' | '신규분양권' | '입주권'
  ownership_gbn       TEXT,          -- 소유권 구분 (분양권 전용)
  sler_gbn            TEXT,          -- 매도인 구분 (분양권 전용)
  buyer_gbn           TEXT,          -- 매수인 구분 (분양권 전용)
```

정확한 위치: `road_nm TEXT,` 줄과 `created_at` 줄 사이.

- [ ] **Step 2: 마이그레이션 스크립트 생성**

`src/apt/scripts/migrate-add-deal-type.ts` 파일을 생성한다:

```typescript
/**
 * src/apt/scripts/migrate-add-deal-type.ts
 * D1 remote에 deal_type 관련 4개 컬럼을 ALTER TABLE로 추가합니다.
 *
 * 사용법:
 *   npx tsx --tsconfig tsconfig.json src/apt/scripts/migrate-add-deal-type.ts
 *
 * D1은 IF NOT EXISTS 지원 안 함 → 이미 컬럼이 있으면 에러 발생 (정상)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';

const DB_NAME = 'apt-trade-db';
const TMP_FILE = '/tmp/migrate_deal_type.sql';

const SQL = `
ALTER TABLE apt_transactions ADD COLUMN deal_type TEXT NOT NULL DEFAULT '매매';
ALTER TABLE apt_transactions ADD COLUMN ownership_gbn TEXT;
ALTER TABLE apt_transactions ADD COLUMN sler_gbn TEXT;
ALTER TABLE apt_transactions ADD COLUMN buyer_gbn TEXT;
`;

function runSQL(sql: string): void {
  fs.writeFileSync(TMP_FILE, sql, 'utf-8');
  execSync(`npx wrangler d1 execute ${DB_NAME} --file ${TMP_FILE} --remote`, { stdio: 'inherit' });
}

// D1은 한 번에 ALTER TABLE 1개만 허용 → 4개 별도 실행
const alters = SQL.trim().split('\n').filter(l => l.startsWith('ALTER'));

for (const alter of alters) {
  console.log(`실행: ${alter}`);
  try {
    runSQL(alter);
    console.log('  완료');
  } catch (e) {
    // "duplicate column name" 에러는 이미 실행된 것 → 무시
    const msg = String(e);
    if (msg.includes('duplicate column name') || msg.includes('already exists')) {
      console.log('  이미 존재 (무시)');
    } else {
      throw e;
    }
  }
}

console.log('\n마이그레이션 완료. 검증:');
execSync(
  `npx wrangler d1 execute ${DB_NAME} --remote --command "SELECT deal_type, COUNT(*) as cnt FROM apt_transactions GROUP BY deal_type LIMIT 5"`,
  { stdio: 'inherit' }
);
```

- [ ] **Step 3: 마이그레이션 실행**

```bash
cd d:/product
npx tsx --tsconfig tsconfig.json src/apt/scripts/migrate-add-deal-type.ts
```

예상 출력:
```
실행: ALTER TABLE apt_transactions ADD COLUMN deal_type TEXT NOT NULL DEFAULT '매매';
  완료
실행: ALTER TABLE apt_transactions ADD COLUMN ownership_gbn TEXT;
  완료
...
마이그레이션 완료. 검증:
deal_type  cnt
매매        1310000
```

- [ ] **Step 4: 커밋**

```bash
git add src/shared/data/schema.sql src/apt/scripts/migrate-add-deal-type.ts
git commit -m "feat: apt_transactions에 deal_type/ownership_gbn/sler_gbn/buyer_gbn 컬럼 추가"
```

---

## Task 2: 타입 정의 추가

**Files:**
- Modify: `src/apt/types/real-estate.ts`
- Modify: `src/shared/lib/db/types.ts`

- [ ] **Step 1: `SilvTradeItem` 인터페이스 추가 (real-estate.ts)**

`src/apt/types/real-estate.ts` 파일 끝에 추가:

```typescript
// 분양권/입주권 전매 API 응답 아이템
// RTMSDataSvcSilvTrade — aptSeq/buildYear/bonbun/bubun/roadNm 없음
export interface SilvTradeItem {
  dealAmount: string;       // 거래금액 (만원, 쉼표 포함)
  dealYear: number;
  dealMonth: number;
  dealDay: number;
  umdNm: string;
  aptNm: string;
  excluUseAr: number;
  jibun: string;
  sggCd: string;
  floor: number;
  cdealDay?: string;
  cdealType?: string;
  estateAgentSggNm?: string;
  dealingGbn?: string;      // '01'=신규분양권, '02'=입주권
  ownershipGbn?: string;    // 소유권 구분
  slerGbn?: string;         // 매도인 구분
  buyerGbn?: string;        // 매수인 구분
}
```

- [ ] **Step 2: `NormalizedTransaction`에 `dealType` 추가 (real-estate.ts)**

`NormalizedTransaction` 인터페이스에서 `sggNm?: string;` 줄 아래에 한 줄 추가:

```typescript
  dealType?: '매매' | '신규분양권' | '입주권';  // 거래 유형 (없으면 '매매')
```

- [ ] **Step 3: `TransactionRow`에 `deal_type` 추가 (types.ts)**

`src/shared/lib/db/types.ts`의 `TransactionRow` 인터페이스에서 `deal_year: number;` 줄 아래에 추가:

```typescript
  deal_type: string;       // '매매' | '신규분양권' | '입주권'
```

- [ ] **Step 4: `TransactionQueryParams`에 `deal_type` 추가 (types.ts)**

`src/shared/lib/db/types.ts`의 `TransactionQueryParams` 인터페이스에서 `price_max?: number;` 줄 아래에 추가:

```typescript
  deal_type?: '전체' | '매매' | '신규분양권' | '입주권';  // 거래유형 필터
```

- [ ] **Step 5: 빌드 확인**

```bash
cd d:/product
npm run build 2>&1 | tail -20
```

예상: 에러 없이 빌드 성공 (타입 오류 없음)

- [ ] **Step 6: 커밋**

```bash
git add src/apt/types/real-estate.ts src/shared/lib/db/types.ts
git commit -m "feat: SilvTradeItem 타입, NormalizedTransaction.dealType, TransactionRow.deal_type 추가"
```

---

## Task 3: 분양권 API 함수 추가

**Files:**
- Modify: `src/apt/lib/api/apartment.ts`

- [ ] **Step 1: `getRawSilvTradeTransactions` 함수 추가**

`src/apt/lib/api/apartment.ts` 파일 끝에 아래 코드를 추가한다. 기존 `getRawApartmentTransactions` 함수와 동일한 패턴이다:

```typescript
const SILV_TRADE_API_PATH = '/RTMSDataSvcSilvTrade/getRTMSDataSvcSilvTrade';

interface RawSilvTradeResult {
  transactions: SilvTradeItem[];
  totalCount: number;
}

/**
 * 분양권/입주권 전매 거래 원천 데이터를 공공데이터포털에서 가져옵니다.
 * API: RTMSDataSvcSilvTrade
 * dealingGbn: '01'=신규분양권, '02'=입주권
 */
export async function getRawSilvTradeTransactions(
  lawdCd: string,
  dealYmd: string,
  perPage: number = 1000
): Promise<RawSilvTradeResult | null> {
  let allTransactions: SilvTradeItem[] = [];
  let currentPage = 1;
  let hasMore = true;
  let totalCount = 0;

  while (hasMore) {
    const params: TransactionRequest = {
      LAWD_CD: lawdCd,
      DEAL_YMD: dealYmd,
      numOfRows: perPage,
      pageNo: currentPage,
    };

    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    ) as Record<string, string | number>;

    try {
      const response: TransactionResponse = await callPublicDataApi(SILV_TRADE_API_PATH, filteredParams);

      const items = (response?.response?.body?.items?.item ?? []) as SilvTradeItem[];
      totalCount = response?.response?.body?.totalCount || 0;

      if (!Array.isArray(items) || items.length === 0) {
        hasMore = false;
      } else {
        allTransactions = allTransactions.concat(items);
        if (allTransactions.length < totalCount) {
          currentPage++;
        } else {
          hasMore = false;
        }
      }
    } catch (error) {
      console.error('Error fetching silv trade transactions:', error);
      return null;
    }
  }

  return { transactions: allTransactions, totalCount };
}
```

`SilvTradeItem`을 import하기 위해 파일 상단의 import 줄을 수정한다:

```typescript
import { TransactionItem, NormalizedTransaction, TransactionRequest, TransactionResponse, SilvTradeItem } from '@apt/types/real-estate';
```

- [ ] **Step 2: 빌드 확인**

```bash
cd d:/product
npm run build 2>&1 | tail -20
```

예상: 에러 없음.

- [ ] **Step 3: 수동 API 호출 검증 (서초구 2025년 8월)**

```bash
cd d:/product
cat > /tmp/test-silv.ts << 'EOF'
import { config } from 'dotenv';
config({ path: '.env.local' });
import { getRawSilvTradeTransactions } from './src/apt/lib/api/apartment';

async function main() {
  const result = await getRawSilvTradeTransactions('11650', '202508', 1000);
  console.log('totalCount:', result?.totalCount);
  console.log('수집:', result?.transactions.length);
  const perla = result?.transactions.filter(t => t.aptNm.includes('원페를라'));
  console.log('래미안원페를라:', JSON.stringify(perla, null, 2));
}
main().catch(console.error);
EOF
npx tsx --tsconfig tsconfig.json /tmp/test-silv.ts
```

예상 출력 (실제 값은 다를 수 있음):
```
totalCount: 5
수집: 5
래미안원페를라: [{ aptNm: "래미안원페를라", dealAmount: "295,000", ... }]
```

- [ ] **Step 4: 커밋**

```bash
git add src/apt/lib/api/apartment.ts
git commit -m "feat: getRawSilvTradeTransactions() — 분양권/입주권 API 클라이언트 추가"
```

---

## Task 4: update-recent.ts — 분양권 수집 추가

**Files:**
- Modify: `src/apt/scripts/update-recent.ts`

이 태스크는 기존 매매 수집 스크립트에 분양권 수집 루프를 추가한다. 변경 포인트는 4곳이다:
1. import에 `getRawSilvTradeTransactions`, `SilvTradeItem` 추가
2. `toInsertValues`를 매매/분양권 공용으로 리팩토링
3. `INSERT_COLUMNS`에 `deal_type`, `ownership_gbn`, `sler_gbn`, `buyer_gbn` 추가
4. `updateMonth` 함수에서 DELETE 분리 및 분양권 수집 루프 추가

- [ ] **Step 1: import 수정**

파일 상단의 import 블록을 아래로 교체:

```typescript
import { getRawApartmentTransactions, getRawSilvTradeTransactions } from '@apt/lib/api/apartment';
import { regions } from '@shared/data/regions';
import type { TransactionItem, SilvTradeItem } from '@apt/types/real-estate';
```

- [ ] **Step 2: `toInsertValues` 함수 수정**

기존 `toInsertValues(item: TransactionItem): string` 함수를 아래로 교체한다. 매개변수 타입을 유니온으로 바꾸고 `deal_type` 4개 컬럼을 추가한다:

```typescript
function toInsertValues(item: TransactionItem | SilvTradeItem, dealType: '매매' | '신규분양권' | '입주권'): string {
  const dealAmount = parseInt(String(item.dealAmount).replace(/,/g, ''), 10);
  const excluUseAr = Number(item.excluUseAr) || 0;
  const dealAmountBillion = Math.round((dealAmount / 10000) * 100) / 100;
  const areaPyeong = Math.round(excluUseAr / 3.30579);
  const pricePerPyeong = areaPyeong > 0
    ? Math.round((dealAmountBillion / areaPyeong) * 100) / 100
    : 0;

  const sggCd = String(item.sggCd).padStart(5, '0');
  const sggNm = item.estateAgentSggNm
    ? item.estateAgentSggNm.replace('서울 ', '')
    : null;

  const dealYear = Number(item.dealYear);
  const dealMonth = Number(item.dealMonth);
  const dealDay = Number(item.dealDay);
  const dealDate = `${dealYear}-${String(dealMonth).padStart(2, '0')}-${String(dealDay).padStart(2, '0')}`;

  const cdealDay = item.cdealDay === '' ? null : (item.cdealDay ?? null);
  const cdealType = item.cdealType === '' ? null : (item.cdealType ?? null);

  // 매매 전용 필드 (분양권은 null)
  const aptSeq = 'aptSeq' in item ? item.aptSeq : null;
  const bonbun = 'bonbun' in item ? item.bonbun : null;
  const bubun = 'bubun' in item ? item.bubun : null;
  const roadNm = 'roadNm' in item ? item.roadNm : null;
  const buildYear = 'buildYear' in item ? item.buildYear : null;

  // 분양권 전용 필드 (매매는 null)
  const ownershipGbn = 'ownershipGbn' in item ? item.ownershipGbn : null;
  const slerGbn = item.slerGbn ?? null;
  const buyerGbn = item.buyerGbn ?? null;

  const jibunVal = 'jibun' in item ? item.jibun : null;

  return `(${dealAmount},${excluUseAr},${dealAmountBillion},${areaPyeong},${pricePerPyeong},` +
    `${esc(sggCd)},${esc(sggNm)},${esc(item.umdNm)},${num(('umdCd' in item ? item.umdCd : undefined))},` +
    `${esc(item.aptNm)},${num(jibunVal)},${num(item.floor)},${num(buildYear)},` +
    `${dealYear},${dealMonth},${dealDay},${esc(dealDate)},` +
    `${esc(cdealDay)},${esc(cdealType)},${esc(aptSeq)},` +
    `${num(bonbun)},${num(bubun)},${esc(roadNm)},` +
    `${esc(dealType)},${esc(ownershipGbn)},${esc(slerGbn)},${esc(buyerGbn)})`;
}
```

- [ ] **Step 3: `INSERT_COLUMNS` 상수 수정**

기존 `INSERT_COLUMNS` 상수를 아래로 교체:

```typescript
const INSERT_COLUMNS = `(deal_amount, exclu_use_ar, deal_amount_billion, area_pyeong, price_per_pyeong,
  sgg_cd, sgg_nm, umd_nm, umd_cd,
  apt_nm, jibun, floor, build_year,
  deal_year, deal_month, deal_day, deal_date,
  cdeal_day, cdeal_type, apt_seq,
  bonbun, bubun, road_nm,
  deal_type, ownership_gbn, sler_gbn, buyer_gbn)`;
```

- [ ] **Step 4: `updateMonth` 함수 수정**

기존 `updateMonth` 함수 전체를 아래로 교체한다:

```typescript
async function updateMonth(year: number, month: number, yyyymm: string): Promise<{ trade: number; silv: number }> {
  // === 매매 수집 ===
  const tradeItems: TransactionItem[] = [];
  for (let i = 0; i < SEOUL_REGIONS.length; i++) {
    const region = SEOUL_REGIONS[i];
    try {
      const result = await getRawApartmentTransactions(region.code, yyyymm, 1000);
      if (result && result.transactions.length > 0) {
        tradeItems.push(...result.transactions);
      }
    } catch (e) {
      console.warn(`  [경고] 매매 ${region.name}(${region.code}) ${yyyymm} API 실패, 건너뜀:`, e);
    }
    process.stdout.write(`\r  [매매] API 진행: ${i + 1}/${SEOUL_REGIONS.length} (${tradeItems.length}건)`);
    await sleep(API_CALL_DELAY_MS);
  }
  console.log('');

  // === 분양권/입주권 수집 ===
  const silvItems: SilvTradeItem[] = [];
  for (let i = 0; i < SEOUL_REGIONS.length; i++) {
    const region = SEOUL_REGIONS[i];
    try {
      const result = await getRawSilvTradeTransactions(region.code, yyyymm, 1000);
      if (result && result.transactions.length > 0) {
        silvItems.push(...result.transactions);
      }
    } catch (e) {
      console.warn(`  [경고] 분양권 ${region.name}(${region.code}) ${yyyymm} API 실패, 건너뜀:`, e);
    }
    process.stdout.write(`\r  [분양권] API 진행: ${i + 1}/${SEOUL_REGIONS.length} (${silvItems.length}건)`);
    await sleep(API_CALL_DELAY_MS);
  }
  console.log('');

  // === DELETE: deal_type 별로 분리 삭제 ===
  const deleteTradeSql = `DELETE FROM apt_transactions WHERE deal_year = ${year} AND deal_month = ${month} AND deal_type = '매매';`;
  const deleteSilvSql = `DELETE FROM apt_transactions WHERE deal_year = ${year} AND deal_month = ${month} AND deal_type IN ('신규분양권', '입주권');`;
  await runSQL(deleteTradeSql, `DELETE 매매 ${yyyymm}`);
  await runSQL(deleteSilvSql, `DELETE 분양권 ${yyyymm}`);

  // === INSERT 매매 ===
  let tradeInserted = 0;
  if (tradeItems.length > 0) {
    const valueRows: string[] = [];
    for (const item of tradeItems) {
      try { valueRows.push(toInsertValues(item, '매매')); } catch { /* 변환 실패 무시 */ }
    }
    const totalBatches = Math.ceil(valueRows.length / BATCH_SIZE);
    for (let i = 0; i < valueRows.length; i += BATCH_SIZE) {
      const batch = valueRows.slice(i, i + BATCH_SIZE);
      const batchNo = Math.floor(i / BATCH_SIZE) + 1;
      const insertSql = `INSERT INTO apt_transactions ${INSERT_COLUMNS} VALUES\n${batch.join(',\n')};`;
      await runSQL(insertSql, `INSERT 매매 ${yyyymm} 배치 ${batchNo}/${totalBatches} (${batch.length}건)`);
    }
    tradeInserted = valueRows.length;
  }

  // === INSERT 분양권/입주권 ===
  let silvInserted = 0;
  if (silvItems.length > 0) {
    const valueRows: string[] = [];
    for (const item of silvItems) {
      const gbn = String(item.dealingGbn ?? '');
      const dealType: '신규분양권' | '입주권' = gbn === '02' ? '입주권' : '신규분양권';
      try { valueRows.push(toInsertValues(item, dealType)); } catch { /* 변환 실패 무시 */ }
    }
    const totalBatches = Math.ceil(valueRows.length / BATCH_SIZE);
    for (let i = 0; i < valueRows.length; i += BATCH_SIZE) {
      const batch = valueRows.slice(i, i + BATCH_SIZE);
      const batchNo = Math.floor(i / BATCH_SIZE) + 1;
      const insertSql = `INSERT INTO apt_transactions ${INSERT_COLUMNS} VALUES\n${batch.join(',\n')};`;
      await runSQL(insertSql, `INSERT 분양권 ${yyyymm} 배치 ${batchNo}/${totalBatches} (${batch.length}건)`);
    }
    silvInserted = valueRows.length;
  }

  return { trade: tradeInserted, silv: silvInserted };
}
```

- [ ] **Step 5: `main` 함수에서 반환값 처리 수정**

기존 `main`의 루프 내부를 아래로 교체 (반환값이 객체로 변경됨):

```typescript
  for (const { year, month, yyyymm } of months) {
    console.log(`[${yyyymm}] 처리 중...`);
    try {
      const { trade, silv } = await updateMonth(year, month, yyyymm);
      totalInserted += trade + silv;
      console.log(`[${yyyymm}] 완료 — 매매 ${trade.toLocaleString()}건, 분양권 ${silv.toLocaleString()}건 적재\n`);
    } catch (e) {
      console.error(`[${yyyymm}] 실패:`, e);
      process.exit(1);
    }
  }
```

- [ ] **Step 6: dry-run으로 검증**

```bash
cd d:/product
npx tsx --tsconfig tsconfig.json src/apt/scripts/update-recent.ts --dry-run
```

예상 출력 (D1 실행 없이 로그만):
```
=== 아파트 실거래 데이터 업데이트 ===
대상 기간: 202501 ~ 202503 (3개월)
*** DRY RUN — D1 실행 생략 ***

[202501] 처리 중...
  [매매] API 진행: 25/25 (XXXX건)
  [분양권] API 진행: 25/25 (XX건)
  [dry-run] DELETE 매매 202501
  [dry-run] DELETE 분양권 202501
...
```

- [ ] **Step 7: 커밋**

```bash
git add src/apt/scripts/update-recent.ts
git commit -m "feat: update-recent.ts에 분양권/입주권 수집 루프 추가"
```

---

## Task 5: DB 쿼리 레이어 — deal_type 필터

**Files:**
- Modify: `src/apt/lib/db/transactions.ts`
- Modify: `src/apt/lib/apt-utils.ts`

- [ ] **Step 1: `getD1Transactions`에 deal_type 필터 추가**

`src/apt/lib/db/transactions.ts`에서 `getD1Transactions` 함수 내부의 price_max 필터 블록 바로 다음에 아래를 추가:

```typescript
  // 거래유형 필터
  if (params.deal_type && params.deal_type !== '전체') {
    conditions.push('deal_type = ?');
    bindings.push(params.deal_type);
  }
```

또한 SELECT 컬럼 목록에 `deal_type` 추가 — `cdeal_type,` 줄 바로 다음:

```typescript
      deal_type,
```

- [ ] **Step 2: `getMockTransactions`에도 deal_type 패스스루 추가**

`getMockTransactions` 함수 파라미터 구조분해에 `deal_type` 추가 (필터는 mock 데이터에 없으므로 실제로는 아무것도 하지 않음 — 로컬 개발용 mock은 모두 '매매'로 처리됨):

```typescript
  const {
    apt_nm,
    page = 1,
    limit = DEFAULT_LIMIT,
    sort_by = 'deal_date',
    sort_order = 'desc',
    area_min,
    area_max,
    price_min,
    price_max,
    // deal_type: mock에서는 무시 (모든 mock 데이터는 매매)
  } = params;
```

- [ ] **Step 3: `toNormalized`에 dealType 매핑 추가**

`src/apt/lib/apt-utils.ts`의 `toNormalized` 함수에서 `sggNm: row.sgg_nm ?? undefined,` 줄 다음에 추가:

```typescript
    dealType: (row.deal_type as '매매' | '신규분양권' | '입주권') || '매매',
```

- [ ] **Step 4: 빌드 확인**

```bash
cd d:/product
npm run build 2>&1 | tail -20
```

예상: 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add src/apt/lib/db/transactions.ts src/apt/lib/apt-utils.ts
git commit -m "feat: getTransactions deal_type 필터, toNormalized dealType 매핑 추가"
```

---

## Task 6: UI — 거래유형 필터 버튼

**Files:**
- Modify: `src/apt/components/apartment/TransactionsClientComponent.tsx`
- Modify: `src/app/apt/[sgg_nm]/page.tsx`

- [ ] **Step 1: 거래유형 옵션 상수 추가 (TransactionsClientComponent.tsx)**

파일 상단의 `PRICE_OPTIONS` 상수 다음에 추가:

```typescript
// 거래유형 필터 옵션
const DEAL_TYPE_OPTIONS = [
  { label: '전체', value: '전체' },
  { label: '매매', value: '매매' },
  { label: '분양권', value: '신규분양권' },
  { label: '입주권', value: '입주권' },
] as const;
```

- [ ] **Step 2: 컴포넌트 props에 dealType 추가**

`TransactionsClientComponent` props 타입에 추가:

```typescript
  dealType?: string;
```

- [ ] **Step 3: dealType 핸들러 추가**

`handlePriceFilter` 함수 다음에 추가:

```typescript
  const handleDealTypeFilter = (value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (value && value !== '전체') current.set('dealType', value);
    else current.delete('dealType');
    current.set('pageNo', '1');
    router.push(`?${current.toString()}`, { scroll: false });
  };
```

- [ ] **Step 4: dealTypeOptionIndex 계산 추가**

`areaOptionIndex` 계산 줄 다음에 추가:

```typescript
  const dealTypeOptionIndex = DEAL_TYPE_OPTIONS.findIndex((o) => o.value === (dealType || '전체'));
```

- [ ] **Step 5: FilterBar에 거래유형 버튼 추가**

기존 필터 바 `<div>` 블록에서 가격 FilterBar 다음에 추가:

```tsx
        <FilterBar
          label="거래유형"
          options={DEAL_TYPE_OPTIONS.map((o) => o.label)}
          selected={dealTypeOptionIndex < 0 ? 0 : dealTypeOptionIndex}
          onChange={(i) => handleDealTypeFilter(DEAL_TYPE_OPTIONS[i].value)}
        />
```

- [ ] **Step 6: page.tsx에서 dealType searchParam 처리**

`src/app/apt/[sgg_nm]/page.tsx`에서:

1. `awaitedSearchParams` 구조분해에 `dealType` 추가:
```typescript
  const { dealYmd, pageNo, numOfRows, searchTerm, sortBy, sortDir, areaMin, areaMax, priceMin, priceMax, dealType } = awaitedSearchParams;
```

2. `initialDealType` 변수 추가 (`initialPriceMax` 줄 다음):
```typescript
  const initialDealType = ensureString(dealType) || '전체';
```

3. `TransactionsLoader` 컴포넌트에 prop 추가:
```typescript
          dealType={initialDealType}
```

4. `TransactionsLoader`의 props 타입과 구현에 dealType 추가:

props 타입:
```typescript
  dealType?: string;
```

`getTransactions` 호출에 추가:
```typescript
      deal_type: dealType as TransactionQueryParams['deal_type'],
```

5. `TransactionsClientComponent` 호출에 prop 추가:
```typescript
          dealType={initialDealType}
```

6. Suspense `key`에 dealType 포함:
```typescript
        key={`${sgg_cd}-${initialDealYmd || 'all'}-${initialNumOfRows}-${initialPageNo}-${initialSortBy}-${initialSortDir}-${initialSearchTerm}-${initialAreaMin ?? ''}-${initialAreaMax ?? ''}-${initialPriceMin ?? ''}-${initialPriceMax ?? ''}-${initialDealType}`}
```

- [ ] **Step 7: 빌드 확인**

```bash
cd d:/product
npm run build 2>&1 | tail -20
```

예상: 에러 없음.

- [ ] **Step 8: 커밋**

```bash
git add src/apt/components/apartment/TransactionsClientComponent.tsx src/app/apt/[sgg_nm]/page.tsx
git commit -m "feat: 거래유형 필터 버튼 추가 (전체/매매/분양권/입주권)"
```

---

## Task 7: UI — 거래유형 배지 렌더링

**Files:**
- Modify: `src/apt/components/apartment/TransactionList.tsx`

거래 목록 테이블의 아파트명 셀 옆에 거래유형 배지를 표시한다.

- [ ] **Step 1: 배지 컴포넌트 추가**

파일 끝(`export default TransactionList;` 바로 위)에 추가:

```typescript
function DealTypeBadge({ dealType }: { dealType?: string }) {
  if (!dealType || dealType === '매매') return null;
  const isNew = dealType === '신규분양권';
  return (
    <span
      className={`ml-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none ${
        isNew ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
      }`}
    >
      {isNew ? '분양권' : '입주권'}
    </span>
  );
}
```

- [ ] **Step 2: 아파트명 셀에 배지 추가**

`TransactionList` 컴포넌트의 아파트명 `<td>` 셀 내부에서 `{t.aptName}` 텍스트 바로 다음에 배지 삽입:

```tsx
                    {t.aptName}
                    <DealTypeBadge dealType={t.dealType} />
```

- [ ] **Step 3: 빌드 확인**

```bash
cd d:/product
npm run build 2>&1 | tail -20
```

예상: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add src/apt/components/apartment/TransactionList.tsx
git commit -m "feat: 거래 목록에 분양권/입주권 배지 표시"
```

---

## Task 8: 데이터 수집 실행 및 최종 검증

- [ ] **Step 1: update-recent.ts 실제 실행 (UPDATE_MONTHS=3)**

```bash
cd d:/product
UPDATE_MONTHS=3 npx tsx --tsconfig tsconfig.json src/apt/scripts/update-recent.ts
```

예상 출력:
```
=== 아파트 실거래 데이터 업데이트 ===
대상 기간: 202501 ~ 202503 (3개월)
...
[202501] 완료 — 매매 XXXXX건, 분양권 XX건 적재
[202502] 완료 — 매매 XXXXX건, 분양권 XX건 적재
[202503] 완료 — 매매 XXXXX건, 분양권 XX건 적재
업데이트 완료!
```

- [ ] **Step 2: D1에서 분양권 데이터 확인**

```bash
npx wrangler d1 execute apt-trade-db --remote --command "SELECT deal_type, COUNT(*) as cnt FROM apt_transactions GROUP BY deal_type"
```

예상:
```
deal_type    cnt
매매          1300000+
신규분양권    50+
입주권        50+
```

- [ ] **Step 3: 래미안원페를라 입주권 데이터 확인**

```bash
npx wrangler d1 execute apt-trade-db --remote --command "SELECT apt_nm, deal_type, deal_date, deal_amount FROM apt_transactions WHERE apt_nm LIKE '%원페를라%' ORDER BY deal_date DESC LIMIT 10"
```

예상:
```
apt_nm           deal_type  deal_date    deal_amount
래미안원페를라   입주권     2025-08-26   295000
래미안원페를라   입주권     2025-10-17   270000
```

- [ ] **Step 4: 분양권 추가 월 수집 (과거 데이터, 선택사항)**

분양권 API는 최근 3개월 외에도 과거 데이터가 있을 수 있다. 스크립트는 UPDATE_MONTHS 환경변수로 제어하므로 필요 시:

```bash
UPDATE_MONTHS=12 npx tsx --tsconfig tsconfig.json src/apt/scripts/update-recent.ts
```

- [ ] **Step 5: 빌드 및 로컬 확인**

```bash
cd d:/product
npm run build && echo "빌드 성공"
```

- [ ] **Step 6: git push (Cloudflare 자동 배포)**

```bash
git push
```

- [ ] **Step 7: 배포 후 검증**

브라우저에서 `https://datazip.net/apt/서초구` 접속:
1. 거래유형 필터 버튼 표시 확인 (전체 / 매매 / 분양권 / 입주권)
2. "입주권" 필터 클릭 → 래미안원페를라 거래 표시 확인
3. 아파트명 옆에 [입주권] 배지 표시 확인
4. "전체" 필터로 돌아올 때 매매+분양권 함께 표시 확인

---

## 검증 체크리스트

- [ ] D1 remote에 4개 컬럼 존재: `deal_type`, `ownership_gbn`, `sler_gbn`, `buyer_gbn`
- [ ] `npm run build` 에러 없음
- [ ] `SELECT deal_type, COUNT(*)` 결과에 '신규분양권' 또는 '입주권' 행 존재
- [ ] 래미안원페를라 입주권 거래 D1에 존재
- [ ] `/apt/서초구`에서 거래유형 필터 버튼 동작
- [ ] 분양권/입주권 배지 아파트명 옆에 표시
- [ ] 매매 기존 데이터 영향 없음 (카운트 변동 없음)
