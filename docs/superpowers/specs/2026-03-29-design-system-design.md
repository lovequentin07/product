# Design System 적용 스펙

**날짜:** 2026-03-29
**목표:** 홈페이지에서 확립한 에디토리얼 디자인(크림/주홍/명조)을 전체 서비스에 일관되게 적용하고, 새 서비스를 빠르게 추가할 수 있는 재사용 가능한 구조 구축

---

## 1. 배경

홈페이지(`src/app/page.tsx`)를 에디토리얼 스타일로 리디자인 완료(커밋 `6574eb8`). 그러나 나머지 서비스 페이지들(market, apt, apt-mgmt)은 여전히 흰 배경 + 파란 버튼의 기존 스타일. 앞으로 서비스가 계속 추가되므로 한 번에 통일하고 재사용 구조를 만든다.

---

## 2. 디자인 토큰

`src/app/globals.css` `:root`에 추가:

```css
/* DataZip Design System Tokens */
--ds-cream:        #F7F4EF;   /* 페이지 배경 */
--ds-cream-card:   #FFFFFF;   /* 카드 배경 */
--ds-cream-border: #E8E3DC;   /* 카드 테두리 */
--ds-cream-muted:  #F3F0EB;   /* 중립 뱃지 배경 */
--ds-ink:          #1A1918;   /* 주 텍스트 */
--ds-ink-muted:    #4A4540;   /* 보조 텍스트 */
--ds-ink-faint:    #9A9085;   /* 약한 텍스트 */
--ds-accent:       #C94B1A;   /* 주홍 악센트 */
--ds-accent-faint: rgba(201,75,26,0.08); /* 주홍 배경 */
--ds-success:      #047857;   /* 긍정 텍스트 */
--ds-success-bg:   #ECFDF5;   /* 긍정 배경 */
--ds-danger:       #B91C1C;   /* 경고 텍스트 */
--ds-danger-bg:    #FEF2F2;   /* 경고 배경 */
```

기존 `--color-price-*` 변수는 유지(차트·가격 색상에 사용 중).

---

## 3. 공유 컴포넌트 (`src/shared/components/ui/`)

### 3-1. `ServiceLayout.tsx`
모든 서비스 페이지를 감싸는 래퍼.

**렌더 구조:**
```
<div>                          // 크림 배경, min-h-screen
  <header>                     // datazip 워드마크 + ● 매일 업데이트
  <div style="주홍 1px 선" />  // 구분선
  <main>                       // max-w-2xl, px-5, pt-6, pb-24
    {children}
  </main>
</div>
```

**Props:**
```ts
interface ServiceLayoutProps {
  children: React.ReactNode
}
```

헤더(datazip 워드마크 + 구분선)는 고정. 각 서비스 페이지는 children만 내려주면 됨.

---

### 3-2. `SectionCard.tsx`
흰 배경 카드. 섹션 단위 콘텐츠 블록.

**Props:**
```ts
interface SectionCardProps {
  children: React.ReactNode
  className?: string
}
```

**스타일:** `background: #FFFFFF`, `border: 1px solid #E8E3DC`, `border-radius: 1rem`, `padding: 1.5rem`

---

### 3-3. `AccentLabel.tsx`
주홍 모노스페이스 카테고리 라벨 (MARKET, REAL ESTATE 등).

**Props:**
```ts
interface AccentLabelProps {
  children: React.ReactNode
}
```

**스타일:** `font-mono`, `font-semibold`, `text-xs`, `tracking-widest`, `color: #C94B1A`

---

### 3-4. `PrimaryButton.tsx`
주홍 CTA 버튼. Link 또는 button 두 가지 형태.

**Props:**
```ts
interface PrimaryButtonProps {
  href?: string          // href 있으면 <Link>, 없으면 <button>
  onClick?: () => void
  children: React.ReactNode
  variant?: 'solid' | 'outline'  // default: 'solid'
  className?: string
}
```

**solid:** `background: #C94B1A`, 흰 텍스트
**outline:** 투명 배경, `border: 1px solid #C94B1A`, 주홍 텍스트

---

## 4. 기존 파일 업데이트 범위

### 4-1. 색상 교체 원칙
| 기존 | 변경 후 | 비고 |
|------|---------|------|
| `bg-white` (페이지 bg) | `bg-[var(--ds-cream)]` | 카드 내부 흰색은 유지 |
| `bg-gray-50` | `bg-[var(--ds-cream-muted)]` | |
| `bg-blue-600`, `bg-blue-700` | `bg-[var(--ds-accent)]` | 버튼 |
| `text-blue-600`, `text-blue-900` | `text-[var(--ds-accent)]` | 링크, 강조 |
| `border-blue-600`, `border-blue-500` | `border-[var(--ds-accent)]` | |
| `focus:ring-blue-500` | `focus:ring-[var(--ds-accent)]` | 인풋 포커스 |

가격 상승/하락 색(`text-red-*`, `text-green-*`, `bg-green-*`)은 그대로 유지.

### 4-2. 수정 대상 파일
**페이지 (ServiceLayout 적용 + 색상 교체):**
- `src/app/page.tsx` (홈페이지 — 헤더/구분선을 ServiceLayout으로 이관)
- `src/app/market/page.tsx`
- `src/app/market/[item]/page.tsx`
- `src/app/apt/page.tsx`
- `src/app/apt/[sgg_nm]/page.tsx`
- `src/app/apt/[sgg_nm]/[apt_nm]/page.tsx`
- `src/app/apt-mgmt/page.tsx`
- `src/app/apt-mgmt/[sgg_nm]/[apt_nm]/page.tsx`
- `src/app/guide/apt-price-guide/page.tsx`
- `src/app/guide/mgmt-fee-guide/page.tsx`
- `src/app/privacy-policy/page.tsx`

**컴포넌트 (색상 교체만):**
- `src/market/components/` 하위 전체
- `src/apt/components/` 하위 전체
- `src/apt-mgmt/components/` 하위 전체
- `src/shared/components/Footer.tsx`

---

## 5. 새 서비스 추가 방법 (완료 후)

```tsx
// src/app/new-service/page.tsx
import ServiceLayout from '@shared/components/ui/ServiceLayout'
import SectionCard from '@shared/components/ui/SectionCard'
import AccentLabel from '@shared/components/ui/AccentLabel'
import PrimaryButton from '@shared/components/ui/PrimaryButton'

export default function NewServicePage() {
  return (
    <ServiceLayout>
      <SectionCard>
        <AccentLabel>NEW SERVICE</AccentLabel>
        <h2>서비스 제목</h2>
        <PrimaryButton href="/new-service/result">조회하기</PrimaryButton>
      </SectionCard>
    </ServiceLayout>
  )
}
```

---

## 6. 검증

1. `npm run dev` → 전체 페이지 시각적 확인
2. 파란색 버튼/링크 잔존 여부 grep: `rg "blue-[0-9]" src/`
3. 흰 배경 잔존 여부 grep: `rg "bg-white" src/app/`
4. 모바일(375px) 레이아웃 깨짐 없는지 확인
5. `npm run build` 빌드 성공 여부

---

## 7. 제외 범위

- 가격 차트 컴포넌트 내부 색상 (Recharts 색상 별도 관리)
- D1/API 로직, 데이터 레이어
- SEO 메타데이터
