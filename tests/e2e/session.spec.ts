import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './fixtures';

/**
 * セッション管理のE2Eテスト
 * 認証済み状態で実行（authenticatedプロジェクト）
 */
test.describe('セッション管理', () => {
	test('ログアウトボタンが機能する', async ({ page }) => {
		// 病院ダッシュボードにアクセス
		await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}`);

		// ページが表示されることを確認
		await expect(page.locator('.hospital-nav')).toBeVisible();

		// ログアウトボタンをクリック
		await page.click('.logout-btn');

		// ログインページにリダイレクトされることを確認
		await page.waitForURL(/\/(login|auth)/);
	});

	test('サイドナビゲーションが正しく表示される', async ({ page }) => {
		await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}`);

		// ナビゲーションメニューが表示される
		const nav = page.locator('.hospital-nav');
		await expect(nav).toBeVisible();

		// メニュー項目が表示される（ナビゲーション内に限定）
		await expect(nav.locator('a:has-text("ダッシュボード")')).toBeVisible();
		await expect(nav.locator('a:has-text("患者管理")')).toBeVisible();
		await expect(nav.locator('a:has-text("療養計画書")')).toBeVisible();
	});

	test('ユーザー情報が表示される', async ({ page }) => {
		await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}`);

		// ユーザー情報セクションが表示される
		await expect(page.locator('.nav-user')).toBeVisible();

		// ユーザー名が表示される
		await expect(page.locator('.user-name')).toBeVisible();
	});
});
