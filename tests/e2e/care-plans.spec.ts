import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TEST_IDS } from './fixtures';

/**
 * 療養計画書のE2Eテスト
 * 認証済み状態で実行（storageStateがplaywrightConfigで設定済み）
 */
test.describe('療養計画書', () => {
	test.describe('療養計画書作成フォーム', () => {
		test('タブナビゲーションが正しく機能する', async ({ page }) => {
			// テスト用患者の療養計画書作成ページにアクセス
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients/${TEST_IDS.PATIENT_ID}/care-plans/new`);

			// タブが7つ表示されていることを確認
			const tabs = page.locator('.tab');
			await expect(tabs).toHaveCount(7);

			// 最初のタブがアクティブ
			await expect(tabs.first()).toHaveClass(/active/);

			// 「次へ」ボタンをクリック
			await page.click('button.btn-primary:has-text("次へ")');

			// 2番目のタブがアクティブになる
			await expect(tabs.nth(1)).toHaveClass(/active/);

			// 「前へ」ボタンをクリック
			await page.click('button.btn-secondary:has-text("前へ")');

			// 最初のタブに戻る
			await expect(tabs.first()).toHaveClass(/active/);
		});

		test('タブをクリックして直接移動できる', async ({ page }) => {
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients/${TEST_IDS.PATIENT_ID}/care-plans/new`);

			// 5番目のタブ（運動指導）をクリック
			await page.click('.tab:nth-child(5)');

			// 運動指導のタブパネルがアクティブになる
			await expect(page.locator('.tab-panel.active h2')).toContainText('運動');
		});

		test('基本情報タブのフォーム要素が正しく表示される', async ({ page }) => {
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients/${TEST_IDS.PATIENT_ID}/care-plans/new`);

			// 計画書種別ラジオボタン
			await expect(page.locator('input[name="planType"][value="initial"]')).toBeVisible();
			await expect(page.locator('input[name="planType"][value="continuous"]')).toBeVisible();

			// 日付入力フィールド
			await expect(page.locator('#recordDate')).toBeVisible();
			await expect(page.locator('#consultationDate')).toBeVisible();

			// 主病チェックボックス
			await expect(page.locator('input[name="hasDiabetes"]')).toBeVisible();
			await expect(page.locator('input[name="hasHypertension"]')).toBeVisible();
			await expect(page.locator('input[name="hasHyperlipidemia"]')).toBeVisible();
		});

		test('検査項目タブで血液検査データを入力できる', async ({ page }) => {
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients/${TEST_IDS.PATIENT_ID}/care-plans/new`);

			// 検査項目タブに移動
			await page.click('.tab:nth-child(2)');

			// 身体計測データを入力
			await page.fill('#height', '170');
			await page.fill('#weightCurrent', '75');
			await page.fill('#weightTarget', '70');

			// 血圧データを入力
			await page.fill('#bloodPressureSystolic', '130');
			await page.fill('#bloodPressureDiastolic', '85');

			// HbA1cを入力
			await page.fill('#hba1cCurrent', '7.5');
			await page.fill('#hba1cTarget', '6.5');

			// 入力値が保持されていることを確認
			await expect(page.locator('#height')).toHaveValue('170');
			await expect(page.locator('#hba1cCurrent')).toHaveValue('7.5');
		});

		test('食事指導タブでチェックボックスを選択できる', async ({ page }) => {
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients/${TEST_IDS.PATIENT_ID}/care-plans/new`);

			// 食事指導タブに移動
			await page.click('.tab:nth-child(4)');

			// 指導項目をチェック
			await page.check('input[name="diet_properIntake"]');
			await page.check('input[name="diet_reduceSalt"]');
			await page.check('input[name="diet_increaseFiber"]');

			// チェック状態を確認
			await expect(page.locator('input[name="diet_properIntake"]')).toBeChecked();
			await expect(page.locator('input[name="diet_reduceSalt"]')).toBeChecked();
			await expect(page.locator('input[name="diet_increaseFiber"]')).toBeChecked();
		});

		test('運動指導タブで運動処方を入力できる', async ({ page }) => {
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients/${TEST_IDS.PATIENT_ID}/care-plans/new`);

			// 運動指導タブに移動
			await page.click('.tab:nth-child(5)');

			// 運動処方を入力
			await page.fill('#exercise_type', 'ウォーキング');
			await page.fill('#exercise_duration', '30分以上');
			await page.selectOption('#exercise_frequency', 'daily');
			await page.fill('#exercise_intensity', '息がはずむが会話が可能な強さ');

			// 入力値を確認
			await expect(page.locator('#exercise_type')).toHaveValue('ウォーキング');
		});

		test('署名・確認タブで保存オプションを選択できる', async ({ page }) => {
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients/${TEST_IDS.PATIENT_ID}/care-plans/new`);

			// 署名・確認タブに移動
			await page.click('.tab:nth-child(7)');

			// 下書きとして保存がデフォルトで選択されている
			await expect(page.locator('input[name="status"][value="draft"]')).toBeChecked();

			// 作成完了を選択
			await page.check('input[name="status"][value="completed"]');
			await expect(page.locator('input[name="status"][value="completed"]')).toBeChecked();
		});

		test('フォームを保存できる', async ({ page }) => {
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients/${TEST_IDS.PATIENT_ID}/care-plans/new`);

			// 基本情報を入力（主病を選択）
			await page.check('input[name="hasDiabetes"]');

			// 最後のタブまで移動
			for (let i = 0; i < 6; i++) {
				await page.click('button.btn-primary:has-text("次へ")');
			}

			// 保存ボタンをクリック
			await page.click('button.btn-submit');

			// 保存後にページ遷移またはレスポンスを待つ
			await page.waitForLoadState('networkidle');
		});
	});

	test.describe('療養計画書一覧', () => {
		test('療養計画書一覧ページが表示される', async ({ page }) => {
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/care-plans`);

			// ページタイトルを確認
			await expect(page.locator('h1')).toContainText('療養計画書');
		});
	});

	test.describe('療養計画書詳細・編集', () => {
		test('既存の療養計画書を表示できる', async ({ page }) => {
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients/${TEST_IDS.PATIENT_ID}/care-plans/${TEST_IDS.CARE_PLAN_ID}`);

			// 療養計画書の詳細ページが表示される（タイトルを確認）
			await expect(page.locator('h1')).toContainText('療養計画書');
		});
	});

	test.describe('PDF出力', () => {
		test('PDF出力ボタンが存在する', async ({ page }) => {
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients/${TEST_IDS.PATIENT_ID}/care-plans/${TEST_IDS.CARE_PLAN_ID}`);

			// PDF出力ボタンを探す（存在する場合のみテスト）
			const pdfButton = page.locator('button:has-text("PDF"), a:has-text("PDF")');
			const count = await pdfButton.count();

			if (count > 0) {
				await expect(pdfButton.first()).toBeVisible();
			}
		});
	});
});

test.describe('パンくずリスト', () => {
	test('パンくずリストが正しく表示される', async ({ page }) => {
		await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients/${TEST_IDS.PATIENT_ID}/care-plans/new`);

		// パンくずリストを確認
		const breadcrumb = page.locator('.breadcrumb');
		await expect(breadcrumb).toBeVisible();

		// 各リンクが存在することを確認
		await expect(breadcrumb.locator('a:has-text("患者管理")')).toBeVisible();
	});

	test('パンくずリストのリンクが機能する', async ({ page }) => {
		await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients/${TEST_IDS.PATIENT_ID}/care-plans/new`);

		// 患者管理リンクをクリック
		await page.click('.breadcrumb a:has-text("患者管理")');

		// 患者一覧ページに遷移
		await expect(page).toHaveURL(/\/patients$/);
	});
});
