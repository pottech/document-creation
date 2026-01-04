import { defineConfig, devices } from '@playwright/test';

const AUTH_FILE = 'tests/e2e/.auth/user.json';

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [['html', { open: 'never' }], ['list']],

	// グローバルセットアップ（シードデータ投入・認証設定）
	globalSetup: './tests/e2e/global-setup.ts',

	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure'
	},
	projects: [
		// 認証不要なテスト（ログインページ等）
		{
			name: 'unauthenticated',
			testMatch: /auth\.spec\.ts/,
			use: { ...devices['Desktop Chrome'] }
		},
		// 認証済みテスト
		{
			name: 'authenticated',
			testIgnore: /auth\.spec\.ts/,
			use: {
				...devices['Desktop Chrome'],
				storageState: AUTH_FILE
			}
		}
	],
	webServer: {
		command: 'pnpm dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120000
	},
	timeout: 30000,
	expect: {
		timeout: 10000
	}
});
