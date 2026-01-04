import { test, expect } from '@playwright/test';
import { SELECTORS, TEST_CONFIG, TEST_IDS } from './fixtures';

/**
 * 患者管理のE2Eテスト
 * 認証済み状態で実行（storageStateがplaywrightConfigで設定済み）
 */
test.describe('患者管理', () => {
	test.describe('患者一覧', () => {
		test('患者一覧ページのUI要素が正しく表示される @smoke', async ({ page }) => {
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients`);

			// ページタイトルを確認
			await expect(page.locator('h1')).toContainText('患者管理');

			// シードデータの患者が表示されている
			await expect(page.locator(`text=${TEST_CONFIG.SEEDED_PATIENT.name}`)).toBeVisible();
		});

		test('患者の検索が機能する', async ({ page }) => {
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients`);

			// 検索ボックスに入力
			await page.fill(SELECTORS.SEARCH_INPUT, TEST_CONFIG.SEEDED_PATIENT.name);

			// 検索を実行（Enterキーまたはボタン）
			await page.keyboard.press('Enter');

			// 検索結果に山田花子が表示される
			await expect(page.locator(`text=${TEST_CONFIG.SEEDED_PATIENT.name}`)).toBeVisible();
		});

		test('患者番号で検索できる', async ({ page }) => {
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients`);

			// 患者番号で検索
			await page.fill(SELECTORS.SEARCH_INPUT, TEST_CONFIG.SEEDED_PATIENT.patientNumber);
			await page.keyboard.press('Enter');

			// 該当の患者が表示される
			await expect(page.locator(`text=${TEST_CONFIG.SEEDED_PATIENT.name}`)).toBeVisible();
		});

		test('存在しない検索条件で空の結果が表示される', async ({ page }) => {
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients`);

			// 存在しない患者を検索
			await page.fill(SELECTORS.SEARCH_INPUT, '存在しない患者99999');

			// 検索ボタンをクリック
			await page.click(SELECTORS.SEARCH_BUTTON);

			// ページの更新を待つ
			await page.waitForLoadState('networkidle');

			// 空の状態メッセージが表示されることを確認
			await expect(page.locator('.empty-state')).toBeVisible();
		});
	});

	test.describe('患者登録', () => {
		test('患者登録モーダルが開閉する', async ({ page }) => {
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients`);

			// モーダルを開く
			await page.click(SELECTORS.ADD_PATIENT_BUTTON);

			// モーダルが表示される
			await expect(page.locator('.modal')).toBeVisible();

			// 閉じるボタンをクリック
			await page.click('.close-btn');

			// モーダルが閉じることを確認
			await expect(page.locator('.modal')).not.toBeVisible();
		});

		test('新規患者を登録できる', async ({ page }) => {
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients`);

			// モーダルを開く
			await page.click(SELECTORS.ADD_PATIENT_BUTTON);
			await expect(page.locator('.modal, [role="dialog"]')).toBeVisible();

			// フォームに入力
			const newPatient = {
				patientNumber: `P${Date.now()}`, // ユニークな患者番号
				name: 'テスト 新規登録',
				nameKana: 'テスト シンキトウロク',
				birthDate: '1985-06-20',
				gender: 'female'
			};

			await page.fill(SELECTORS.PATIENT_NUMBER_INPUT, newPatient.patientNumber);
			await page.fill(SELECTORS.PATIENT_NAME_INPUT, newPatient.name);
			await page.fill(SELECTORS.PATIENT_NAME_KANA_INPUT, newPatient.nameKana);
			await page.fill(SELECTORS.BIRTH_DATE_INPUT, newPatient.birthDate);
			await page.selectOption(SELECTORS.GENDER_SELECT, newPatient.gender);

			// 登録ボタンをクリック
			await page.click(SELECTORS.SUBMIT_BUTTON);

			// モーダルが閉じる
			await expect(page.locator('.modal, [role="dialog"]')).not.toBeVisible();

			// 登録した患者が一覧に表示される
			await expect(page.locator(`text=${newPatient.name}`)).toBeVisible();
		});

		test('重複した患者番号でエラーが表示される', async ({ page }) => {
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients`);

			// モーダルを開く
			await page.click(SELECTORS.ADD_PATIENT_BUTTON);
			await expect(page.locator('.modal')).toBeVisible();

			// シードデータと同じ患者番号で登録を試みる
			await page.fill(SELECTORS.PATIENT_NUMBER_INPUT, TEST_CONFIG.SEEDED_PATIENT.patientNumber);
			await page.fill(SELECTORS.PATIENT_NAME_INPUT, '重複テスト患者');
			await page.fill(SELECTORS.PATIENT_NAME_KANA_INPUT, 'チョウフクテストカンジャ');
			await page.fill(SELECTORS.BIRTH_DATE_INPUT, '1990-01-01');
			await page.selectOption(SELECTORS.GENDER_SELECT, 'male');

			await page.click(SELECTORS.SUBMIT_BUTTON);

			// エラーメッセージが表示される
			await expect(page.locator('.error-message')).toBeVisible();
		});
	});

	test.describe('患者詳細', () => {
		test('患者詳細ページに遷移できる', async ({ page }) => {
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients`);

			// シードデータの患者リンクをクリック
			await page.click(`text=${TEST_CONFIG.SEEDED_PATIENT.name}`);

			// 患者詳細ページに遷移
			await expect(page).toHaveURL(new RegExp(`/patients/${TEST_IDS.PATIENT_ID}`));
		});

		test('患者詳細から療養計画書作成ページに遷移できる', async ({ page }) => {
			// 患者詳細ページに直接アクセス
			await page.goto(`/${TEST_CONFIG.HOSPITAL_SLUG}/patients/${TEST_IDS.PATIENT_ID}`);

			// 療養計画書を作成リンクをクリック
			await page.click('a:has-text("療養計画書を作成")');

			// 療養計画書作成ページに遷移
			await expect(page).toHaveURL(new RegExp(`/patients/${TEST_IDS.PATIENT_ID}/care-plans/new`));
		});
	});
});
