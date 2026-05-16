/**
 * 관리비 지킴이 (/apt-mgmt) 테스트
 *
 * 시나리오:
 *   TC-AM1: 검색 페이지 로드 및 h1 표시
 *   TC-AM2: 구 목록 또는 검색 입력 존재
 *   TC-AM3: 단지 상세 페이지 로드 (강남구 첫 번째 단지)
 *   TC-AM4: 상세 페이지 — 관리비 순위 데이터 표시
 *   TC-AM5: SEO 메타태그 (상세 페이지)
 *   TC-AM6: 모바일 수평 오버플로우 없음
 */

import { test, expect } from '@playwright/test';

test.describe('관리비 지킴이 (/apt-mgmt)', () => {
  test('TC-AM1: 검색 페이지 로드', async ({ page }) => {
    const res = await page.goto('/apt-mgmt');
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/관리비/i);
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('TC-AM2: 검색 입력 또는 단지 링크 존재', async ({ page }) => {
    await page.goto('/apt-mgmt');
    // 검색 input 또는 단지 목록 링크 중 하나는 반드시 존재
    const hasInput = await page.locator('input[type="text"], input[type="search"]').count();
    const hasLinks = await page.locator('a[href*="/apt-mgmt/"]').count();
    expect(hasInput + hasLinks).toBeGreaterThan(0);
  });

  test('TC-AM3: 단지 상세 페이지 로드', async ({ page }) => {
    // 강남구 내 단지 직접 접근 (URL 패턴 확인)
    await page.goto('/apt-mgmt');
    const links = page.locator('a[href*="/apt-mgmt/"]');
    const count = await links.count();
    if (count > 0) {
      const href = await links.first().getAttribute('href');
      const res = await page.goto(href!);
      expect(res?.status()).toBe(200);
      const body = await page.textContent('body');
      expect(body).toMatch(/관리비|만원|순위/);
    } else {
      // 직접 강남구 경로 시도
      const res = await page.goto('/apt-mgmt/강남구');
      expect([200, 404]).toContain(res?.status());
    }
  });

  test('TC-AM4: 상세 페이지 — 관리비 데이터 표시', async ({ page }) => {
    await page.goto('/apt-mgmt');
    const links = page.locator('a[href*="/apt-mgmt/"]');
    const count = await links.count();
    if (count === 0) {
      test.skip();
      return;
    }
    const href = await links.first().getAttribute('href');
    await page.goto(href!);
    const body = await page.textContent('body');
    // 관리비 수치 또는 순위 관련 텍스트
    expect(body).toMatch(/원|순위|상위|%/);
  });

  test('TC-AM5: SEO 메타태그', async ({ page }) => {
    await page.goto('/apt-mgmt');
    const links = page.locator('a[href*="/apt-mgmt/"]');
    const count = await links.count();
    if (count === 0) {
      test.skip();
      return;
    }
    const href = await links.first().getAttribute('href');
    await page.goto(href!);

    const title = await page.title();
    expect(title.length).toBeGreaterThan(5);

    const desc = await page.getAttribute('meta[name="description"]', 'content');
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(10);
  });

  test('TC-AM6: 모바일 수평 오버플로우 없음', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/apt-mgmt');
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('TC-AM7: 상세 페이지 title에 현재 연도 포함', async ({ page }) => {
    await page.goto('/apt-mgmt');
    const links = page.locator('a[href*="/apt-mgmt/"]');
    if (await links.count() === 0) { test.skip(); return; }
    const href = await links.first().getAttribute('href');
    await page.goto(href!);
    const title = await page.title();
    expect(title).toContain(String(new Date().getFullYear()));
  });

  test('TC-AM8: 상세 페이지 description에 세대당 관리비 문구 포함', async ({ page }) => {
    await page.goto('/apt-mgmt');
    const links = page.locator('a[href*="/apt-mgmt/"]');
    if (await links.count() === 0) { test.skip(); return; }
    const href = await links.first().getAttribute('href');
    await page.goto(href!);
    const desc = await page.getAttribute('meta[name="description"]', 'content');
    expect(desc).toMatch(/세대당|월 관리비/);
  });
});
