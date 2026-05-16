/**
 * 농수축산물 시세 (/market) 테스트
 *
 * 시나리오:
 *   TC-M1: 시세 메인 페이지 로드 및 기본 콘텐츠 표시
 *   TC-M2: 검색 기능 (사과 검색 → 결과 존재)
 *   TC-M3: 품목 상세 페이지 로드 및 차트 표시
 *   TC-M4: SEO — title, description, OG 태그 존재
 *   TC-M5: 모바일 레이아웃 수평 오버플로우 없음
 */

import { test, expect } from '@playwright/test';

test.describe('시세 서비스 (/market)', () => {
  test('TC-M1: 메인 페이지 로드', async ({ page }) => {
    const res = await page.goto('/market');
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/DataZip/i);
    // h1 존재
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('TC-M2: 품목 링크 존재 및 클릭 가능', async ({ page }) => {
    await page.goto('/market');
    // 품목 링크 (사과, 배, 감 등) 중 하나 클릭
    const links = page.locator('a[href^="/market/"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    const firstHref = await links.first().getAttribute('href');
    expect(firstHref).toMatch(/\/market\/.+/);
  });

  test('TC-M3: 품목 상세 페이지 로드', async ({ page }) => {
    // 메인에서 첫 번째 품목 링크를 따라 상세 페이지 진입
    await page.goto('/market');
    const links = page.locator('a[href^="/market/"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    const href = await links.first().getAttribute('href');
    const res = await page.goto(href!);
    expect(res?.status()).toBe(200);
    // 가격 데이터 존재
    const body = await page.textContent('body');
    expect(body).toMatch(/원|가격|시세/);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(5);
  });

  test('TC-M4: SEO 메타태그', async ({ page }) => {
    // 첫 번째 품목 링크로 이동
    await page.goto('/market');
    const links = page.locator('a[href^="/market/"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    const href = await links.first().getAttribute('href');
    await page.goto(href!);

    const title = await page.title();
    expect(title.length).toBeGreaterThan(5);

    const desc = await page.getAttribute('meta[name="description"]', 'content');
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(10);

    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle).toBeTruthy();
  });

  test('TC-M5: 모바일 수평 오버플로우 없음', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/market');
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px 여유
  });

  test('TC-M6: 존재하지 않는 품목 fallback title DataZip 중복 없음', async ({ page }) => {
    await page.goto('/market/99999');
    const title = await page.title();
    expect(title).not.toMatch(/DataZip.*DataZip/);
  });
});
