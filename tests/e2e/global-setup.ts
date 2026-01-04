/**
 * Playwright グローバルセットアップ
 *
 * E2Eテスト実行前に以下を行う:
 * 1. テスト用シードデータの投入
 * 2. 認証済みセッションのstorageStateを保存
 */

import { chromium, type FullConfig } from '@playwright/test';

const TEST_SESSION_ID = '00000000-0000-0000-0000-000000000401';
const AUTH_FILE = 'tests/e2e/.auth/user.json';

async function globalSetup(config: FullConfig) {
	console.log('グローバルセットアップを開始...');

	// シードデータを投入
	console.log('シードデータを投入中...');
	const { execSync } = await import('child_process');
	try {
		execSync('pnpm tsx scripts/seed-test-data.ts', { stdio: 'inherit' });
	} catch (error) {
		console.error('シードデータの投入に失敗しました:', error);
		throw error;
	}

	// ブラウザを起動してセッションCookieを設定
	console.log('認証済みセッションを設定中...');
	const browser = await chromium.launch();
	const context = await browser.newContext({
		baseURL: config.projects[0].use?.baseURL || 'http://localhost:5173'
	});
	const page = await context.newPage();

	// セッションCookieを設定
	// SvelteKitのセッション管理に合わせてCookieを設定
	await context.addCookies([
		{
			name: 'session',
			value: TEST_SESSION_ID,
			domain: 'localhost',
			path: '/',
			httpOnly: true,
			secure: false,
			sameSite: 'Lax'
		}
	]);

	// 認証状態を保存
	await context.storageState({ path: AUTH_FILE });

	await browser.close();
	console.log('グローバルセットアップ完了');
}

export default globalSetup;
