# Design System 전체 적용 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈페이지의 에디토리얼 디자인(크림 배경 + 주홍 악센트 + Noto Serif KR)을 전체 서비스에 적용하고, 4개의 공유 UI 컴포넌트로 새 서비스 추가를 간단하게 만든다.

**Architecture:** CSS 변수로 디자인 토큰을 전역 정의 → 4개 공유 컴포넌트(`ServiceLayout`, `SectionCard`, `AccentLabel`, `PrimaryButton`) 생성 → 모든 페이지/컴포넌트에서 기존 파란색/흰색을 토큰으로 교체.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS 4, Geist + Noto Serif KR (Google Fonts)

---

## 파일 구조

**생성:**
- `src/shared/components/ui/ServiceLayout.tsx`
- `src/shared/components/ui/SectionCard.tsx`
- `src/shared/components/ui/AccentLabel.tsx`
- `src/shared/components/ui/PrimaryButton.tsx`

**수정:**
- `src/app/globals.css` — CSS 변수 추가
- `src/app/page.tsx` — ServiceLayout 적용, 헤더 코드 이관
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
- `src/shared/components/Footer.tsx`
- `src/market/components/MarketHero.tsx`
- `src/market/components/PriceChangeList.tsx`
- `src/market/components/CategoryQuickAccess.tsx`
- `src/market/components/MarketSearchInput.tsx`
- `src/market/components/MarketFAQ.tsx`
- `src/apt/components/apartment/SearchForm.tsx`
- `src/apt/components/apartment/SummaryCards.tsx`
- `src/apt/components/apartment/TransactionList.tsx`
- `src/apt/components/apt-detail/AptDetailHeader.tsx`
- `src/apt-mgmt/components/AptMgmtSearchForm.tsx`
- `src/apt-mgmt/components/AptMgmtComparisonTable.tsx`

**변경 안 함 (의미적 색상 유지):**
- `BuySignalBanner.tsx` — emerald/orange는 가격 상태 표현 (의도적)
- `AptMgmtReportCards.tsx` — green/yellow/red는 관리비 등급 표현 (의도적)
- `AptMgmtSummaryCards.tsx` — 차트 배경색만 사용
- Recharts 차트 내부 색상

---

### Task 1: CSS 디자인 토큰 추가

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: globals.css `:root`에 디자인 토큰 추가**

기존 `:root { ... }` 블록을 아래로 교체:

```css
:root {
  --background: #ffffff;
  --foreground: #171717;

  /* Price status colors (기존 유지) */
  --color-price-high: #DC2626;
  --color-price-current: #1E40AF;
  --color-price-low: #059669;

  /* DataZip Design System Tokens */
  --ds-cream:        #F7F4EF;
  --ds-cream-card:   #FFFFFF;
  --ds-cream-border: #E8E3DC;
  --ds-cream-muted:  #F3F0EB;
  --ds-ink:          #1A1918;
  --ds-ink-muted:    #4A4540;
  --ds-ink-faint:    #9A9085;
  --ds-accent:       #C94B1A;
  --ds-accent-faint: rgba(201,75,26,0.08);
  --ds-success:      #047857;
  --ds-success-bg:   #ECFDF5;
  --ds-danger:       #B91C1C;
  --ds-danger-bg:    #FEF2F2;
}
```

- [ ] **Step 2: `body` 배경색을 CSS 변수로 교체**

```css
body {
  background: var(--ds-cream);
  color: var(--ds-ink);
  font-family: Arial, Helvetica, sans-serif;
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/app/globals.css
git commit -m "design: CSS 디자인 토큰 추가"
```

---

### Task 2: ServiceLayout 컴포넌트 생성

**Files:**
- Create: `src/shared/components/ui/ServiceLayout.tsx`

`ServiceLayout`은 모든 서비스 페이지의 래퍼. 크림 배경 + 상단 헤더(datazip 워드마크 + 매일 업데이트 뱃지 + 주홍 구분선) + content 영역을 제공.

- [ ] **Step 1: `ServiceLayout.tsx` 생성**

```tsx
// src/shared/components/ui/ServiceLayout.tsx
import Link from 'next/link'

interface ServiceLayoutProps {
  children: React.ReactNode
  /** content 영역 클래스 오버라이드. 기본: max-w-2xl mx-auto px-5 pt-6 pb-24 */
  contentClassName?: string
}

export default function ServiceLayout({
  children,
  contentClassName = 'max-w-2xl mx-auto px-5 pt-6 pb-24',
}: ServiceLayoutProps) {
  return (
    <div style={{ background: 'var(--ds-cream)', minHeight: '100vh' }}>
      {/* 헤더 */}
      <header className="max-w-2xl mx-auto px-5 pt-8 pb-5 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold"
          style={{ color: 'var(--ds-ink)', letterSpacing: '0.12em' }}
        >
          datazip
        </Link>
        <span
          className="flex items-center gap-1.5 text-xs"
          style={{ color: 'var(--ds-ink-faint)' }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-live-pulse"
            style={{ background: 'var(--ds-accent)' }}
          />
          매일 업데이트
        </span>
      </header>

      {/* 주홍 구분선 */}
      <div
        className="max-w-2xl mx-auto px-5"
        style={{ marginBottom: '32px' }}
      >
        <div style={{ height: '1px', background: 'var(--ds-accent)' }} />
      </div>

      {/* 콘텐츠 */}
      <main className={contentClassName}>
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/shared/components/ui/ServiceLayout.tsx
git commit -m "feat: ServiceLayout 공유 컴포넌트 생성"
```

---

### Task 3: SectionCard, AccentLabel, PrimaryButton 생성

**Files:**
- Create: `src/shared/components/ui/SectionCard.tsx`
- Create: `src/shared/components/ui/AccentLabel.tsx`
- Create: `src/shared/components/ui/PrimaryButton.tsx`

- [ ] **Step 1: `SectionCard.tsx` 생성**

```tsx
// src/shared/components/ui/SectionCard.tsx
interface SectionCardProps {
  children: React.ReactNode
  className?: string
}

export default function SectionCard({ children, className = '' }: SectionCardProps) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{
        background: 'var(--ds-cream-card)',
        border: '1px solid var(--ds-cream-border)',
      }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: `AccentLabel.tsx` 생성**

```tsx
// src/shared/components/ui/AccentLabel.tsx
interface AccentLabelProps {
  children: React.ReactNode
}

export default function AccentLabel({ children }: AccentLabelProps) {
  return (
    <p
      className="text-xs font-mono font-semibold tracking-widest mb-2"
      style={{ color: 'var(--ds-accent)', letterSpacing: '0.15em' }}
    >
      {children}
    </p>
  )
}
```

- [ ] **Step 3: `PrimaryButton.tsx` 생성**

```tsx
// src/shared/components/ui/PrimaryButton.tsx
import Link from 'next/link'

interface PrimaryButtonProps {
  href?: string
  onClick?: () => void
  children: React.ReactNode
  variant?: 'solid' | 'outline'
  className?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

export default function PrimaryButton({
  href,
  onClick,
  children,
  variant = 'solid',
  className = '',
  type = 'button',
  disabled = false,
}: PrimaryButtonProps) {
  const solidStyle = {
    background: 'var(--ds-accent)',
    color: '#FFFFFF',
    border: 'none',
  }
  const outlineStyle = {
    background: 'transparent',
    color: 'var(--ds-accent)',
    border: '1px solid var(--ds-accent)',
  }
  const baseClass = `inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 ${className}`

  if (href) {
    return (
      <Link href={href} className={baseClass} style={variant === 'solid' ? solidStyle : outlineStyle}>
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseClass}
      style={variant === 'solid' ? solidStyle : outlineStyle}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/shared/components/ui/SectionCard.tsx src/shared/components/ui/AccentLabel.tsx src/shared/components/ui/PrimaryButton.tsx
git commit -m "feat: SectionCard, AccentLabel, PrimaryButton 공유 컴포넌트 생성"
```

---

### Task 4: 홈페이지 ServiceLayout 적용

**Files:**
- Modify: `src/app/page.tsx`

홈페이지는 이미 크림/주홍 색상을 사용 중. ServiceLayout으로 헤더/구분선 코드를 이관하고, 중복 제거.

- [ ] **Step 1: page.tsx — ServiceLayout import 추가, 중복 헤더 코드 삭제**

`src/app/page.tsx`에서:

1. 상단에 추가:
```tsx
import ServiceLayout from "@shared/components/ui/ServiceLayout";
```

2. 아래 3개 블록 삭제:
   - 바깥 `<div style={{ background: "#F7F4EF", minHeight: "100vh" }}>` 태그 (열기/닫기)
   - `{/* 헤더 */}` 전체 `<header>...</header>` 블록
   - 주홍 구분선 `<div style={{ height: "1px", background: "#C94B1A", marginBottom: "32px" }} />`

3. 남은 내용을 `<ServiceLayout>`으로 감싸기:
```tsx
return (
  <ServiceLayout>
    <script type="application/ld+json" ... />

    {/* 장바구니 시세 카드 */}
    <section className="rounded-2xl p-6 mb-4" ...>
      ...
    </section>

    {/* 2열 서비스 카드 */}
    <div className="grid grid-cols-2 gap-4 mb-4">
      ...
    </div>

    {/* 추가 예정 카드 */}
    <div className="rounded-2xl px-5 py-4 ...">
      · · · &nbsp; 곧 추가됩니다
    </div>
  </ServiceLayout>
)
```

삭제 후 파일에 `<header>` 태그가 없어야 하며, `background: "#F7F4EF"` 인라인 스타일도 없어야 함.

- [ ] **Step 2: 개발 서버에서 홈페이지 확인**

`npm run dev` → http://localhost:3000 — 헤더와 레이아웃이 동일하게 유지되는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/app/page.tsx
git commit -m "refactor: 홈페이지 ServiceLayout 적용"
```

---

### Task 5: Market 페이지 ServiceLayout 적용

**Files:**
- Modify: `src/app/market/page.tsx`
- Modify: `src/app/market/[item]/page.tsx`

- [ ] **Step 1: `src/app/market/page.tsx` 최상위 `<div className="min-h-screen bg-white">` → ServiceLayout으로 교체**

```tsx
import ServiceLayout from "@shared/components/ui/ServiceLayout"

// return 내부:
return (
  <ServiceLayout>
    {/* 기존 내용 유지 */}
  </ServiceLayout>
)
```

- [ ] **Step 2: `src/app/market/[item]/page.tsx` 동일하게 ServiceLayout 적용**

```tsx
import ServiceLayout from "@shared/components/ui/ServiceLayout"

return (
  <ServiceLayout>
    {/* 기존 내용 유지 */}
  </ServiceLayout>
)
```

- [ ] **Step 3: http://localhost:3000/market 확인 — 헤더 정상, 레이아웃 깨짐 없음**

- [ ] **Step 4: 커밋**

```bash
git add src/app/market/page.tsx "src/app/market/[item]/page.tsx"
git commit -m "design: market 페이지 ServiceLayout 적용"
```

---

### Task 6: Market 컴포넌트 색상 교체

**Files:**
- Modify: `src/market/components/MarketHero.tsx`
- Modify: `src/market/components/PriceChangeList.tsx`
- Modify: `src/market/components/CategoryQuickAccess.tsx`
- Modify: `src/market/components/MarketSearchInput.tsx`
- Modify: `src/market/components/MarketFAQ.tsx`

- [ ] **Step 1: `MarketHero.tsx` — `bg-white` 제거 (크림 배경이 부모에서 상속)**

```tsx
// 변경 전:
<div className="bg-white">
// 변경 후:
<div>
```

- [ ] **Step 2: `PriceChangeList.tsx` — 파란색 → 주홍**

```tsx
// 변경 전 (활성 항목 좌측 보더):
className="... border-blue-600 ..."
// 변경 후:
style={{ borderLeftColor: 'var(--ds-accent)' }}

// 변경 전 (강조 텍스트):
className="text-blue-600"
// 변경 후:
style={{ color: 'var(--ds-accent)' }}
```

- [ ] **Step 3: `CategoryQuickAccess.tsx` — 활성 탭 파란색 → 주홍**

```tsx
// 변경 전:
className="border-blue-600 text-blue-600"
// 변경 후:
style={{ borderBottomColor: 'var(--ds-accent)', color: 'var(--ds-accent)' }}
```

- [ ] **Step 4: `MarketSearchInput.tsx` — 포커스 링 파란색 → 주홍**

```tsx
// 변경 전:
className="... focus-within:border-blue-500 ..."
// 변경 후:
className="... focus-within:border-(--ds-accent) ..."
```

- [ ] **Step 5: `MarketFAQ.tsx` — Q 라벨 파란색 → 주홍**

```tsx
// 변경 전:
className="text-blue-600"
// 변경 후:
style={{ color: 'var(--ds-accent)' }}
```

- [ ] **Step 6: http://localhost:3000/market 확인**

- [ ] **Step 7: 커밋**

```bash
git add src/market/components/
git commit -m "design: market 컴포넌트 색상 주홍으로 통일"
```

---

### Task 7: Apt 페이지 ServiceLayout 적용 + 색상 교체

**Files:**
- Modify: `src/app/apt/page.tsx`
- Modify: `src/app/apt/[sgg_nm]/page.tsx`
- Modify: `src/app/apt/[sgg_nm]/[apt_nm]/page.tsx`

- [ ] **Step 1: `src/app/apt/page.tsx` — ServiceLayout 적용, bg-gray-50 교체**

```tsx
import ServiceLayout from "@shared/components/ui/ServiceLayout"

return (
  <ServiceLayout contentClassName="max-w-4xl mx-auto px-4 pt-6 pb-24">
    {/* 기존 내용에서 아래 색상 교체 */}
    {/* bg-gray-50 → style={{ background: 'var(--ds-cream-muted)' }} */}
  </ServiceLayout>
)
```

- [ ] **Step 2: `src/app/apt/[sgg_nm]/page.tsx` — ServiceLayout 적용**

```tsx
import ServiceLayout from "@shared/components/ui/ServiceLayout"

return (
  <ServiceLayout contentClassName="max-w-4xl mx-auto px-4 pt-6 pb-24">
    {/* 기존 내용 유지 */}
  </ServiceLayout>
)
```

- [ ] **Step 3: `src/app/apt/[sgg_nm]/[apt_nm]/page.tsx` — ServiceLayout 적용 (wide)**

```tsx
import ServiceLayout from "@shared/components/ui/ServiceLayout"

return (
  <ServiceLayout contentClassName="max-w-6xl mx-auto px-4 pt-6 pb-24">
    {/* 기존 내용 유지 */}
  </ServiceLayout>
)
```

- [ ] **Step 4: http://localhost:3000/apt 확인**

- [ ] **Step 5: 커밋**

```bash
git add src/app/apt/
git commit -m "design: apt 페이지 ServiceLayout 적용"
```

---

### Task 8: Apt 컴포넌트 색상 교체

**Files:**
- Modify: `src/apt/components/apartment/SearchForm.tsx`
- Modify: `src/apt/components/apartment/SummaryCards.tsx`
- Modify: `src/apt/components/apartment/TransactionList.tsx`
- Modify: `src/apt/components/apt-detail/AptDetailHeader.tsx`

- [ ] **Step 1: `SearchForm.tsx` — 버튼 + 포커스링 파란색 → 주홍**

```tsx
// 버튼 변경 전:
className="bg-blue-600 hover:bg-blue-700 ... focus:ring-blue-500"
// 변경 후:
className="... focus:ring-(--ds-accent) hover:opacity-80"
style={{ background: 'var(--ds-accent)' }}

// 인풋 포커스 변경 전:
className="focus:ring-indigo-500 focus:border-indigo-500"
// 변경 후:
className="focus:ring-(--ds-accent) focus:border-[var(--ds-accent)]"
```

- [ ] **Step 2: `SummaryCards.tsx` — 평균 거래가 파란색 → 주홍**

```tsx
// 변경 전:
className="text-blue-600"
// 변경 후:
style={{ color: 'var(--ds-accent)' }}
```

- [ ] **Step 3: `TransactionList.tsx` — 링크/버튼/페이지네이션 파란색 → 주홍**

```tsx
// 하이퍼링크 변경 전:
className="text-blue-600"
// 변경 후:
style={{ color: 'var(--ds-accent)' }}

// 더보기 버튼 변경 전:
className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
// 변경 후:
className="... focus:ring-(--ds-accent) hover:opacity-80"
style={{ background: 'var(--ds-accent)' }}

// 페이지네이션 활성 버튼 변경 전:
className="bg-blue-600 text-white border-blue-600"
// 변경 후:
style={{ background: 'var(--ds-accent)', borderColor: 'var(--ds-accent)', color: '#fff' }}

// bg-blue-50 선택 행 변경 전:
className="bg-blue-50"
// 변경 후:
style={{ background: 'var(--ds-accent-faint)' }}
```

- [ ] **Step 4: `AptDetailHeader.tsx` — 링크 파란색 → 주홍**

```tsx
// 변경 전:
className="text-blue-600"
// 변경 후:
style={{ color: 'var(--ds-accent)' }}
```

- [ ] **Step 5: 커밋**

```bash
git add src/apt/components/
git commit -m "design: apt 컴포넌트 색상 주홍으로 통일"
```

---

### Task 9: Apt-Mgmt 페이지 + 컴포넌트

**Files:**
- Modify: `src/app/apt-mgmt/page.tsx`
- Modify: `src/app/apt-mgmt/[sgg_nm]/[apt_nm]/page.tsx`
- Modify: `src/apt-mgmt/components/AptMgmtSearchForm.tsx`
- Modify: `src/apt-mgmt/components/AptMgmtComparisonTable.tsx`

- [ ] **Step 1: `src/app/apt-mgmt/page.tsx` — ServiceLayout 적용, bg-blue-100 → 주홍 계열**

```tsx
import ServiceLayout from "@shared/components/ui/ServiceLayout"

return (
  <ServiceLayout>
    {/* bg-blue-100 변경 전: */}
    {/* <div className="bg-blue-100 ..."> */}
    {/* 변경 후: style={{ background: 'var(--ds-accent-faint)' }} */}

    {/* bg-gray-50 FAQ 섹션 변경 후: style={{ background: 'var(--ds-cream-muted)' }} */}
  </ServiceLayout>
)
```

- [ ] **Step 2: `src/app/apt-mgmt/[sgg_nm]/[apt_nm]/page.tsx` — ServiceLayout 적용**

```tsx
import ServiceLayout from "@shared/components/ui/ServiceLayout"

return (
  <ServiceLayout>
    {/* 기존 내용 유지 */}
  </ServiceLayout>
)
```

- [ ] **Step 3: `AptMgmtSearchForm.tsx` — 버튼 + 포커스 + 호버 파란색 → 주홍**

```tsx
// 제출 버튼 변경 전:
className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
// 변경 후:
className="... hover:opacity-80 active:opacity-70"
style={{ background: 'var(--ds-accent)' }}

// 포커스링 변경 전:
className="focus:ring-blue-500"
// 변경 후:
className="focus:ring-(--ds-accent)"

// 드롭다운 호버 변경 전:
className="hover:bg-blue-50"
// 변경 후:
className="hover:bg-[var(--ds-accent-faint)]"
```

- [ ] **Step 4: `AptMgmtComparisonTable.tsx` — 테이블 헤더 bg-gray-50 → 크림**

```tsx
// 변경 전:
className="bg-gray-50"
// 변경 후:
style={{ background: 'var(--ds-cream-muted)' }}
```

- [ ] **Step 5: 커밋**

```bash
git add src/app/apt-mgmt/ src/apt-mgmt/components/
git commit -m "design: apt-mgmt 페이지/컴포넌트 색상 통일"
```

---

### Task 10: Guide 페이지, Privacy Policy, Footer

**Files:**
- Modify: `src/app/guide/apt-price-guide/page.tsx`
- Modify: `src/app/guide/mgmt-fee-guide/page.tsx`
- Modify: `src/app/privacy-policy/page.tsx`
- Modify: `src/shared/components/Footer.tsx`

- [ ] **Step 1: `apt-price-guide/page.tsx` — ServiceLayout 적용, 파란색 → 주홍**

```tsx
import ServiceLayout from "@shared/components/ui/ServiceLayout"
import PrimaryButton from "@shared/components/ui/PrimaryButton"

return (
  <ServiceLayout>
    {/* bg-blue-50 강조 박스 변경 후: style={{ background: 'var(--ds-accent-faint)' }} */}
    {/* text-blue-800, text-blue-700 변경 후: style={{ color: 'var(--ds-ink-muted)' }} */}

    {/* CTA 버튼 변경 전: <a className="bg-blue-600 hover:bg-blue-700..."> */}
    <PrimaryButton href="/market">시세 확인하기</PrimaryButton>
  </ServiceLayout>
)
```

- [ ] **Step 2: `mgmt-fee-guide/page.tsx` — ServiceLayout 적용, 파란색 → 주홍**

```tsx
import ServiceLayout from "@shared/components/ui/ServiceLayout"
import PrimaryButton from "@shared/components/ui/PrimaryButton"

return (
  <ServiceLayout>
    {/* bg-blue-100 text-blue-700 배지 변경 후: style={{ background: 'var(--ds-accent-faint)', color: 'var(--ds-accent)' }} */}
    {/* bg-gray-100 테이블 헤더 변경 후: style={{ background: 'var(--ds-cream-muted)' }} */}
    {/* CTA 버튼 → PrimaryButton */}
    <PrimaryButton href="/apt-mgmt">관리비 조회하기</PrimaryButton>
  </ServiceLayout>
)
```

- [ ] **Step 3: `privacy-policy/page.tsx` — ServiceLayout 적용, 링크 파란색 → 주홍**

```tsx
import ServiceLayout from "@shared/components/ui/ServiceLayout"

return (
  <ServiceLayout>
    {/* text-blue-600 underline 링크 변경 후: style={{ color: 'var(--ds-accent)' }} */}
  </ServiceLayout>
)
```

- [ ] **Step 4: `Footer.tsx` — 배경색 크림 계열로 통일**

```tsx
// 변경 전:
<footer className="mt-16 border-t border-gray-200 bg-gray-50">
// 변경 후:
<footer
  className="mt-16"
  style={{ borderTop: '1px solid var(--ds-cream-border)', background: 'var(--ds-cream-muted)' }}
>
```

- [ ] **Step 5: 커밋**

```bash
git add src/app/guide/ src/app/privacy-policy/ src/shared/components/Footer.tsx
git commit -m "design: guide·privacy-policy·footer 스타일 통일"
```

---

### Task 11: 최종 검증

- [ ] **Step 1: 파란색 잔존 여부 확인**

```bash
cd d:/product
grep -r "blue-[0-9]" src/ --include="*.tsx" | grep -v "node_modules" | grep -v ".next"
```

잔존 항목이 있다면 의도적인 것(BuySignalBanner, AptMgmtReportCards)인지 확인. 의도치 않은 것은 수정.

- [ ] **Step 2: 흰 배경 잔존 여부 확인 (페이지 레벨)**

```bash
grep -r "bg-white" src/app/ --include="*.tsx"
```

페이지 최상위 `bg-white` 없어야 함. 카드 내부 흰색(`bg-white` on cards)은 허용.

- [ ] **Step 3: 전체 페이지 시각적 확인**

`npm run dev` 후 아래 페이지 순서로 확인:
- http://localhost:3000 (홈)
- http://localhost:3000/market
- http://localhost:3000/market/배추 (또는 임의 품목)
- http://localhost:3000/apt
- http://localhost:3000/apt-mgmt
- http://localhost:3000/guide/apt-price-guide
- http://localhost:3000/privacy-policy

각 페이지: 크림 배경, 주홍 악센트, 파란색 없음 확인.

- [ ] **Step 4: 빌드 확인**

```bash
npm run build
```

Expected: 에러 없이 성공.

- [ ] **Step 5: 최종 커밋**

```bash
git add .
git commit -m "design: 디자인 시스템 전체 적용 완료"
```

---

## 새 서비스 추가 방법 (완료 후 참고)

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
        <h2 style={{ fontFamily: 'var(--font-noto-serif-kr)' }}>서비스 제목</h2>
        <p>서비스 설명</p>
        <PrimaryButton href="/new-service/result">조회하기</PrimaryButton>
      </SectionCard>
    </ServiceLayout>
  )
}
```
