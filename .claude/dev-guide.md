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
| `npm run dev` | UI·로직 개발 | mock 17건 | `localhost:3000` |
| `npm run preview` | ⚠️ CPU 제한으로 불안정 (아래 참고) | 실제 131만건 | `localhost:8787` |

---

## npm run dev

```bash
npm run dev
```

**내부 동작**: `next dev` — 일반 Next.js 개발 서버

- 즉시 시작, 코드 변경 시 자동 새로고침 (핫리로드)
- Cloudflare 환경이 아니므로 D1 연결 안 됨 → mock 데이터 17건만 표시

**언제 쓰나요?**
UI 디자인, 레이아웃, 데이터와 무관한 로직 개발

---

## npm run preview (⚠️ 제한 있음)

```bash
npm run preview
```

**내부 동작**: `opennextjs-cloudflare build && wrangler dev --remote`

**알려진 문제**: `wrangler dev --remote`는 Worker 코드를 로컬 CPU에서 실행하면서 Cloudflare의 CPU 제한(50ms)을 동일하게 적용합니다. Next.js SSR + D1 응답 처리가 합쳐져 CPU 제한을 초과하는 경우가 있습니다.

- `Worker exceeded CPU time limit` 오류가 발생하더라도 페이지 자체는 로드될 수 있음
- 이 오류는 **로컬 preview 한정** — 실제 Cloudflare 서버에서는 더 최적화된 런타임으로 정상 동작

---

## 권장 개발 흐름

```
1. npm run dev    → UI/로직 개발 (빠른 반복)
        ↓
2. git push       → Cloudflare 자동 배포 후 실제 서비스에서 확인
```

실제 데이터 기반 기능(정렬·필터·페이지네이션)은 **프로덕션 배포 후** 확인하는 것이 가장 안정적입니다.
