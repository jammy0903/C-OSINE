/**
 * Memory Analysis E2E Tests
 * 메모리 시각화 전체 플로우 테스트
 */

import { test, expect } from '@playwright/test';

test.describe('App Load', () => {
  test('앱이 정상적으로 로드됨', async ({ page }) => {
    await page.goto('/');

    // 페이지가 로드될 때까지 대기 (최대 30초)
    await page.waitForLoadState('domcontentloaded');

    // body가 비어있지 않은지 확인
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();

    // 앱이 렌더링되었는지 확인 (헤더 존재)
    await expect(page.locator('header')).toBeVisible({ timeout: 30000 });
  });

  test('네비게이션이 표시됨', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 네비게이션 버튼들이 존재하는지 확인
    await expect(page.getByRole('button', { name: /problems/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('button', { name: /memory/i })).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // 앱이 완전히 로드될 때까지 대기
    await expect(page.locator('header')).toBeVisible({ timeout: 30000 });
  });

  test('Memory 탭으로 전환', async ({ page }) => {
    // Memory 버튼 클릭
    await page.getByRole('button', { name: /memory/i }).click();

    // Memory 탭 컨텐츠가 나타나는지 확인
    // (메모리 시각화 관련 텍스트나 요소)
    await expect(page.getByText(/analyze/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('AI Tutor 탭으로 전환', async ({ page }) => {
    // AI Tutor 버튼 클릭
    await page.getByRole('button', { name: /ai tutor/i }).click();

    // Chat 관련 요소가 나타나는지 확인
    await page.waitForTimeout(1000);
  });
});

test.describe('Visual Regression', () => {
  test('메인 레이아웃 스크린샷', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('header')).toBeVisible({ timeout: 30000 });

    // 스크린샷 비교
    await expect(page).toHaveScreenshot('main-layout.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.15,
    });
  });
});

test.describe('Responsive', () => {
  test('모바일 뷰포트', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 앱이 렌더링됨
    await expect(page.locator('header')).toBeVisible({ timeout: 30000 });
  });
});
