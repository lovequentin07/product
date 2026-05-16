# 개발 환경 가이드

## 배포 흐름

```
git push (main) → Cloudflare가 자동 감지 → 빌드 · 배포
```

`npm run deploy`는 사용하지 않습니다. 푸시하면 Cloudflare가 알아서 배포합니다.

---

## 로컬 개발 명령어

| 명령어 | 용도 | D1 데이터 | 접속 주소 |
|--------|------|-----------|-----------|
| `npm run dev` | UI·로직 개발 | mock (소량) | `localhost:3000` |
| `npm run preview` | ⚠️ CPU 제한으로 불안정 (아래 참고) | 실제 D1 | `localhost:8787` |

---

## npm run dev

```bash
npm run dev
```

**내부 동작**: `rm -rf .next && next dev`

- 즉시 시작, 코드 변경 시 자동 새로고침 (핫리로드)
- Cloudflare 환경이 아니므로 D1 연결 안 됨 → `src/shared/lib/db/mock-data.ts` 폴백
- 포트 충돌 시: `lsof -i :3000` → `kill -9 <PID>`

**언제 쓰나요?**
UI 디자인, 레이아웃, 데이터와 무관한 로직 개발

---

## npm run preview (⚠️ 사용 불가)

```bash
npm run preview
```

**내부 동작**: `opennextjs-cloudflare build && wrangler dev --remote`

**알려진 문제**: Free 플랜에서는 `wrangler dev --remote`가 로컬 CPU에 Cloudflare CPU 제한(10ms)을 동일하게 적용합니다. Next.js SSR + D1 응답 처리가 합쳐져 CPU 제한을 초과하여 동작하지 않습니다.

**대안**: 브랜치 push → Cloudflare Preview URL 사용.

---

## Cloudflare Branch Preview

비프로덕션 브랜치에 push하면 Cloudflare가 자동으로 Preview URL을 생성합니다.

**활성화 방법** (1회 설정):
1. Cloudflare 대시보드 → Workers & Pages → `product`
2. Settings → Build → Branch control
3. **"Enable non-production branch deployments"** 활성화

**Preview URL 형식**: `<브랜치명>-product.lovequentin07.workers.dev`

실제 Cloudflare 런타임에서 실행 → CPU 제한 없음, 실제 D1 연결.

---

## E2E 테스트

```bash
npx playwright test              # 전체 (chromium + Pixel5 mobile)
npx playwright test --project=chromium  # chromium만
npx playwright test e2e/apt.spec.ts     # 특정 파일만
```

- `baseURL`: `https://datazip.net` (실제 프로덕션 대상)
- 설정: `playwright.config.ts`
- 테스트 파일: `e2e/apt.spec.ts`, `e2e/apt-mgmt.spec.ts`, `e2e/market.spec.ts`

---

## 권장 개발 흐름

```
1. npm run dev      → UI/로직 개발 (빠른 반복, mock 데이터)
        ↓
2. 브랜치에 push   → Cloudflare Preview URL에서 실제 D1 데이터로 확인
        ↓
3. main에 merge    → 프로덕션 자동배포
```

---

## 환경변수 (`.env.local`)

| 키 | 용도 |
|----|------|
| `DATA_GO_KR_API_KEY` | 공공데이터포털 API 인증키 |
| `CLOUDFLARE_API_TOKEN` | wrangler D1 원격 실행용 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 계정 ID |
| `CLOUDFLARE_D1_DATABASE_ID` | D1 데이터베이스 ID |
