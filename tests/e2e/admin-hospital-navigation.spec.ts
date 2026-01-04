import { test, expect } from '@playwright/test';

test.describe('Admin画面から所属病院への導線', () => {
	test.beforeEach(async ({ page }) => {
		// 認証済み状態でAdmin画面にアクセス
		await page.goto('/admin');
	});

	test.describe('正常系', () => {
		test.skip('所属病院セクションが表示される', async ({ page }) => {
			// Arrange: サービス管理者かつ病院に所属しているユーザーでログイン済み

			// Act: Admin画面を表示

			// Assert: 所属病院セクションが表示される
			await expect(page.getByText('所属病院')).toBeVisible();
		});

		test.skip('所属病院の一覧が表示される', async ({ page }) => {
			// Arrange: 病院に所属しているサービス管理者

			// Act: Admin画面を表示

			// Assert: 所属している病院名が表示される
			await expect(page.getByTestId('user-hospitals-section')).toBeVisible();
			// 具体的な病院名はシードデータに依存
		});

		test.skip('病院リンクをクリックすると病院画面に遷移する', async ({ page }) => {
			// Arrange: 病院に所属しているサービス管理者

			// Act: 病院リンクをクリック
			await page.getByTestId('hospital-link').first().click();

			// Assert: 病院のダッシュボードに遷移
			await expect(page.url()).toContain('/test-hospital');
			await expect(page.getByText('ダッシュボード')).toBeVisible();
		});

		test.skip('病院でのロールが表示される', async ({ page }) => {
			// Arrange: 病院に所属しているサービス管理者

			// Act: Admin画面を表示

			// Assert: ロール（管理者/ユーザー）が表示される
			const hospitalItem = page.getByTestId('hospital-link').first();
			await expect(
				hospitalItem.getByText('管理者').or(hospitalItem.getByText('ユーザー'))
			).toBeVisible();
		});
	});

	test.describe('エッジケース', () => {
		test.skip('所属病院がない場合はセクションが非表示', async ({ page }) => {
			// Arrange: 病院に所属していないサービス管理者でログイン
			// Note: この条件のテストユーザーが必要

			// Act: Admin画面を表示

			// Assert: 所属病院セクションが表示されない
			await expect(page.getByTestId('user-hospitals-section')).not.toBeVisible();
		});
	});
});
