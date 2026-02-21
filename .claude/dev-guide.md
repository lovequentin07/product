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
| `npm run dev` | UI·로직 빠른 개발 | mock 17건 | `localhost:3000` |
| `npm run preview` | 실제 데이터로 기능 확인 | 실제 131만건 | `localhost:8787` |

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

## npm run preview

```bash
npm run preview
```

**내부 동작**: `opennextjs-cloudflare build && wrangler dev --remote`
1. Cloudflare Workers용으로 빌드 (2~3분 소요)
2. 로컬에서 Workers 에뮬레이터 실행 + 원격 D1에 연결 (배포 아님)

- 실제 D1 데이터(131만건)로 테스트 가능
- 코드 변경 시 매번 빌드 필요 (느림)
- `--remote`는 "원격 D1에 연결"이지 "배포"가 아님

**언제 쓰나요?**
정렬·필터·페이지네이션 등 실제 데이터가 필요한 기능 검증, 배포 전 최종 확인

---

## 권장 개발 흐름

```
1. npm run dev      → UI/로직 개발 (빠른 반복)
        ↓
2. npm run preview  → 실제 데이터로 기능 검증
        ↓
3. git push         → Cloudflare 자동 배포
```
