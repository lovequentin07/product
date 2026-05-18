/**
 * 홈 페이지 (/) Phase 01 리디자인 테스트
 *
 * 시나리오:
 *   TC-H1: 홈 페이지 로드 및 기본 콘텐츠 표시
 *   TC-H2: 장바구니 시세 카드 — PercentileBadge 4단계 텍스트 표시
 *   TC-H3: 장바구니 시세 카드 — Sparkline SVG 요소 존재
 *   TC-H4: 가이드 카드 4개 — 링크 및 텍스트 확인
 *   TC-H5: 서비스 카드 — 아파트 실거래가·관리비 링크 확인
 */

import { test, expect } from '@playwright/test';

test.describe('홈 페이지 (/)', () => {
  test('TC-H1: 홈 페이지 로드', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/DataZip/i);
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('장바구니 시세');
  });

  test('TC-H2: 장바구니 카드 — PercentileBadge 하위N% 표시', async ({ page }) => {
    await page.goto('/');
    // "하위 N%" 텍스트를 포함하는 뱃지가 최소 1개 이상 표시되어야 함
    const badges = page.locator('text=/하위 \\d+%/');
    await expect(badges.first()).toBeVisible();
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC-H3: 장바구니 카드 — Sparkline SVG 존재', async ({ page }) => {
    await page.goto('/');
    // Sparkline 컴포넌트가 SVG를 렌더링해야 함
    const svgs = page.locator('section svg');
    await expect(svgs.first()).toBeVisible();
    const count = await svgs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC-H4: 가이드 카드 4개 링크 확인', async ({ page }) => {
    await page.goto('/');
    // guide 카드 4개 링크가 모두 존재해야 함
    const guideLinks = [
      '/guide/apt-price-guide',
      '/guide/mgmt-fee-guide',
      '/guide/market-price-guide',
      '/guide/market-shopping-guide',
    ];
    for (const href of guideLinks) {
      const link = page.locator(`a[href="${href}"]`);
      await expect(link).toBeVisible();
    }
    // GUIDE 섹션 레이블 확인
    await expect(page.locator('text=GUIDE')).toBeVisible();
  });

  test('TC-H5: 서비스 카드 — 실거래가·관리비 링크 확인', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/apt"]')).toBeVisible();
    await expect(page.locator('a[href="/apt-mgmt"]')).toBeVisible();
  });
});
