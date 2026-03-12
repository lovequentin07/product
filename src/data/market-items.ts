/**
 * src/data/market-items.ts
 * slug ↔ aT(한국농수산식품유통공사) 가격 API 코드 매핑
 *
 * item_cd: perYearMonth/perDay API 내부 코드
 * ctgry_cd: 부류코드 (100=식량작물, 200=채소류, 400=과일류, 600=수산물)
 *
 * 삼겹살: 축산물품질평가원 API(data.ekape.or.kr) 별도 연동 예정
 *   → EKAPE_API_KEY 환경변수 발급 후 market-items.ts에 추가
 */

import type { Category } from '@/types/market'

export interface MarketItemConfig {
  slug: string
  name: string
  category: Category
  ctgry_cd: string
  item_cd: string
}

export const MARKET_ITEMS: MarketItemConfig[] = [
  { slug: 'carrot',     name: '당근',   category: 'vegetable', ctgry_cd: '200', item_cd: '232' },
  { slug: 'onion',      name: '양파',   category: 'vegetable', ctgry_cd: '200', item_cd: '245' },
  { slug: 'cabbage',    name: '배추',   category: 'vegetable', ctgry_cd: '200', item_cd: '211' },
  { slug: 'potato',     name: '감자',   category: 'vegetable', ctgry_cd: '100', item_cd: '152' },
  { slug: 'garlic',     name: '마늘',   category: 'vegetable', ctgry_cd: '200', item_cd: '244' },
  { slug: 'apple',      name: '사과',   category: 'fruit',     ctgry_cd: '400', item_cd: '411' },
  { slug: 'strawberry', name: '딸기',   category: 'fruit',     ctgry_cd: '200', item_cd: '226' },
  { slug: 'mackerel',   name: '고등어', category: 'seafood',   ctgry_cd: '600', item_cd: '611' },
  { slug: 'squid',      name: '오징어', category: 'seafood',   ctgry_cd: '600', item_cd: '619' },
]

export function findItemBySlug(slug: string): MarketItemConfig | undefined {
  return MARKET_ITEMS.find((item) => item.slug === slug)
}
