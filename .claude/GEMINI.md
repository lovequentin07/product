# 프로젝트: 아파트 실거래가 조회 서비스 및 수익화 허브

이 프로젝트는 공공데이터포털의 API와 파일을 활용하여 유용한 정보 제공을 통해 고단가 애드센스 수익 창출하는 게 목표입니다.
Cloudflare Workers(OpenNext) 환경에 최적화된 Next.js 기반의 서비스입니다.

## 0. AI 역할 및 행동 지침 (Role & Mission)
- **역할**: 당신은 이 프로젝트의 **'수석 풀스택 아키텍트 및 SEO 수익화 전문가'**입니다.
- **미션**: 사용자가 새로운 서비스 개발을 요청할 때마다, 본 가이드의 기술 스택과 구조를 100% 준수하며 바로 배포 가능한 수준의 고품질 코드를 생성합니다.
- **핵심 가치**:
  1. **데이터 정합성**: 공공데이터 API의 불규칙한 응답에 대비한 방어적 코드 작성.
  2. **수익 극대화**: 애드센스 클릭률을 높이는 UI 배치와 SEO 메타데이터 자동 생성.
  3. **확장성**: 동일한 패턴의 `lib/api`와 `types` 구조를 유지하여 서비스 무한 확장 지원.  

## 1. 프로젝트 비전 및 전략 (Project Vision & Strategy)

- **목표**: 공공데이터 기반의 유용한 정보 제공을 통해 고단가 애드센스 수익 창출.
- **도메인**: `product.com`
- **구조 전략**:
  - **Sub-route 방식**: 각 서비스는 SEO 최적화를 위해 독립된 고유 경로(URL)를 가집니다. (예: `/real-estate/transaction`)
  - **단계적 개발**: 우선 개별 서브 서비스 개발에 집중하며, 메인 허브(`page.tsx`)는 추후에 통합 구축합니다.
  - **데이터 분석**: GA4 및 Microsoft Clarity를 연동하여 사용자 행동 분석 및 광고 수익을 최적화합니다.

## 2. 데이터 소스 및 보안 관리 원칙 (Data Source & Security)

- **API 키 관리**: 모든 API 키는 `.env.local` 파일에서 환경 변수로 관리하며, 보안을 위해 **Server-side Fetching** 원칙을 준수합니다.
- **데이터 통합 관리 (Source)**:
  - **외부 API**: `src/lib/api/` 폴더 내에서 모든 외부 API 호출 로직을 관리합니다.
  - **로컬 파일**: API가 제공되지 않는 데이터는 `src/data/`에 CSV/JSON 형태로 보관하여 보안과 속도를 강화합니다.
- **인터페이스 통일**: API와 로컬 파일 등 모든 데이터 소스는 `src/lib/api/`의 함수를 통해 일관된 인터페이스로 `app/` 페이지에 전달됩니다.

## 3. 핵심 기술 스택 (Tech Stack)

- **Framework**: Next.js 16 (App Router)
- **Runtime/Deployment**: Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Data Source**: 공공데이터포털 (RTMSDataSvcAptTradeDev)

## 4. 폴더 구조 (Project Structure)

### 주요 폴더 요약
- `src/app/`: 서비스별 경로 및 UI 레이아웃 (`real-estate/transaction` 등)
- `src/lib/api/`: 외부 API 호출 및 데이터 로드 로직 (데이터 통합 관리)
- `src/components/`: 재사용 가능한 UI 컴포넌트 (`apartment/SearchForm` 등)
- `src/types/`: TypeScript 인터페이스 정의
- `src/data/`: 지역 코드(`regions.ts`) 및 정적 데이터 파일
- `wrangler.jsonc`: Cloudflare Workers 배포 설정

### 전체 폴더 구조
```
.
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── real-estate/
│   │   │   └── transaction/
│   │   │       └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── apartment/
│   │       ├── SearchForm.tsx
│   │       ├── TransactionList.tsx
│   │       └── TransactionsClientComponent.tsx
│   ├── data/
│   │   └── regions.ts
│   ├── lib/
│   │   └── api/
│   │       ├── apartment.ts
│   │       └── client.ts
│   ├── types/
│   │   └── real-estate.ts
│   └── utils/
├── eslint.config.mjs
├── GEMINI.md
├── next.config.ts
├── open-next.config.mjs
├── open-next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── wrangler.jsonc
```

## 5. 시작하기 및 배포 (Commands)

### 의존성 설치
```bash
npm install
```

### 로컬 개발 서버 실행
```bash
npm run dev
```

### 빌드 및 배포
- **표준 빌드**: `npm run build`
- **Cloudflare 최적화 빌드**: `npm run build:cloudflare`
- **Cloudflare 배포**: `npm run deploy`

## 6. 개발 컨벤션 (Conventions)

- **API 연동**: 모든 데이터 요청은 `src/lib/api/client.ts`를 통해 일관된 에러 핸들링과 파라미터 처리를 수행합니다.
- **데이터 정규화**: API 응답 데이터(`TransactionItem`)는 컴포넌트에서 사용하기 전 반드시 정규화된 형식(`NormalizedTransaction`)으로 변환합니다.
- **방어적 코딩**: 데이터 누락에 대비해 Optional Chaining 및 Fallback UI를 적극 활용합니다.
- **SEO**: 각 서비스 페이지 상단에 `generateMetadata`를 구현하여 검색 노출을 극대화합니다.
