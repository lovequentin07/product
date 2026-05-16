/**
 * 아파트 실거래가 (/apt) 테스트
 *
 * 시나리오:
 *   TC-A1: 검색 페이지 로드 및 구 목록 표시
 *   TC-A2: 구 선택 → 단지 목록 로드
 *   TC-A3: 단지 상세 페이지 로드 및 거래 이력 차트
 *   TC-A4: SEO 메타태그 (구별·단지별 페이지)
 *   TC-A5: 404 — 존재하지 않는 구는 404 반환
 */

import { test, expect } from '@playwright/test';

test.describe('실거래가 서비스 (/apt)', () => {
  test('TC-A1: 검색 페이지 로드', async ({ page }) => {
    const res = await page.goto('/apt');
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/실거래가|아파트/i);
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('TC-A2: 구별 단지 목록 로드 (강남구)', async ({ page }) => {
    const res = await page.goto('/apt/강남구');
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/강남구/);
    // 단지 목록 존재
    const body = await page.textContent('body');
    expect(body).toMatch(/강남구|아파트/);
  });

  test('TC-A3: 단지 상세 페이지 로드', async ({ page }) => {
    // 강남구 → 목록에서 첫 번째 단지 클릭
    await page.goto('/apt/강남구');
    const aptLinks = page.locator('a[href*="/apt/강남구/"]');
    const count = await aptLinks.count();
    if (count > 0) {
      const href = await aptLinks.first().getAttribute('href');
      const res = await page.goto(href!);
      expect(res?.status()).toBe(200);
      // 거래 이력 또는 차트 존재
      const body = await page.textContent('body');
      expect(body).toMatch(/만원|거래|층/);
    } else {
      test.skip();
    }
  });

  test('TC-A4: SEO — 구별 페이지 메타태그', async ({ page }) => {
    await page.goto('/apt/강남구');
    const title = await page.title();
    expect(title).toMatch(/강남구/);
    const desc = await page.getAttribute('meta[name="description"]', 'content');
    expect(desc).toBeTruthy();
  });

  test('TC-A5: 존재하지 않는 구 → 404', async ({ page }) => {
    const res = await page.goto('/apt/존재하지않는구');
    expect(res?.status()).toBe(404);
  });

  test('TC-A6: 단지 상세 title에 현재 연도 포함', async ({ page }) => {
    await page.goto('/apt/강남구');
    const links = page.locator('a[href*="/apt/강남구/"]');
    if (await links.count() === 0) { test.skip(); return; }
    const href = await links.first().getAttribute('href');
    await page.goto(href!);
    const title = await page.title();
    expect(title).toContain(String(new Date().getFullYear()));
  });

  test('TC-A7: sitemap.xml에 /apt-mgmt URL 포함', async ({ page }) => {
    const res = await page.goto('/sitemap.xml');
    expect(res?.status()).toBe(200);
    const body = await page.textContent('body');
    expect(body).toContain('apt-mgmt<');
  });
});
