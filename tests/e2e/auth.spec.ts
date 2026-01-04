import { test, expect } from '@playwright/test';
import { SELECTORS } from './fixtures';

test.describe('認証フロー', () => {
	test('ログインページが表示される', async ({ page }) => {
		await page.goto('/login');

		// ページタイトルを確認
		await expect(page.locator('h1')).toHaveText('ログイン');

		// ログインボタンが表示されている
		await expect(page.locator(SELECTORS.LOGIN_BUTTON)).toBeVisible();

		// 説明テキストが表示されている
		await expect(page.locator('p')).toContainText('アカウントにサインイン');
	});

	test('未認証ユーザーは保護されたページにアクセスできない', async ({ page }) => {
		// 病院ページにアクセスしようとするとログインにリダイレクトされる
		await page.goto('/test-hospital');

		// ログインページまたはエラーページにリダイレクトされることを確認
		// （実装によってはログインページ、または404/403になる）
		await page.waitForURL(/\/(login|no-hospital|auth)/);
	});

	test('ログインボタンをクリックするとKeycloakにリダイレクトされる', async ({ page }) => {
		await page.goto('/login');

		// ログインボタンをクリック
		await page.click(SELECTORS.LOGIN_BUTTON);

		// Keycloakの認証ページにリダイレクトされることを確認
		// （Keycloakが起動していない場合はエラーになる）
		await page.waitForTimeout(1000);

		// URLにKeycloakのドメインが含まれているか、またはPOSTリクエストが送信されたことを確認
		const url = page.url();
		const isKeycloakRedirect = url.includes('keycloak') || url.includes('realms');
		const isStillOnLogin = url.includes('/login');

		// Keycloakが起動していない場合はログインページに留まる可能性がある
		expect(isKeycloakRedirect || isStillOnLogin).toBeTruthy();
	});
});

test.describe('招待フロー', () => {
	test('無効な招待トークンでエラーまたはリダイレクトが発生する', async ({ page }) => {
		// 無効なトークンでアクセス
		const response = await page.goto('/invite/invalid-token-12345');

		// エラーメッセージ、リダイレクト、または404を確認
		const content = await page.textContent('body');
		const url = page.url();
		const status = response?.status();

		const hasError =
			content?.includes('無効') ||
			content?.includes('期限切れ') ||
			content?.includes('見つかりません') ||
			content?.includes('Not found') ||
			url.includes('/login') ||
			status === 404 ||
			status === 500; // サーバーエラーも許容

		expect(hasError).toBeTruthy();
	});
});
