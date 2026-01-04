import { test as base, expect, type Page } from '@playwright/test';

/**
 * テストフィクスチャ
 * authenticatedプロジェクトではstorageStateによりセッションCookieが自動設定される
 */
export const test = base.extend<{
	authenticatedPage: Page;
}>({
	authenticatedPage: async ({ page }, use) => {
		await use(page);
	}
});

export { expect };

/**
 * シードデータのID（scripts/seed-test-data.tsと同期）
 */
export const TEST_IDS = {
	USER_ID: '00000000-0000-0000-0000-000000000001',
	ADMIN_USER_ID: '00000000-0000-0000-0000-000000000002',
	HOSPITAL_ID: '00000000-0000-0000-0000-000000000101',
	PATIENT_ID: '00000000-0000-0000-0000-000000000201',
	PATIENT_ID_2: '00000000-0000-0000-0000-000000000202',
	CARE_PLAN_ID: '00000000-0000-0000-0000-000000000301'
};

/**
 * テスト用定数
 */
export const TEST_CONFIG = {
	// テスト用病院スラッグ
	HOSPITAL_SLUG: 'test-hospital',
	// シードデータの患者情報
	SEEDED_PATIENT: {
		id: TEST_IDS.PATIENT_ID,
		patientNumber: 'P001',
		name: '山田花子',
		nameKana: 'ヤマダハナコ',
		birthDate: '1965-03-15',
		gender: 'female'
	},
	SEEDED_PATIENT_2: {
		id: TEST_IDS.PATIENT_ID_2,
		patientNumber: 'P002',
		name: '鈴木一郎',
		nameKana: 'スズキイチロウ',
		birthDate: '1958-07-22',
		gender: 'male'
	},
	// 新規登録テスト用患者データ
	NEW_PATIENT: {
		patientNumber: `P${Date.now()}`,
		name: 'テスト 新規患者',
		nameKana: 'テスト シンキカンジャ',
		birthDate: '1990-01-15',
		gender: 'male'
	}
};

/**
 * ページ要素のセレクター
 */
export const SELECTORS = {
	// ログインページ
	LOGIN_BUTTON: 'button:has-text("Keycloakでサインイン")',

	// 患者管理ページ
	PATIENTS_PAGE_TITLE: 'h1:has-text("患者管理")',
	ADD_PATIENT_BUTTON: 'button:has-text("患者を登録")',
	PATIENT_NUMBER_INPUT: '#patientNumber',
	PATIENT_NAME_INPUT: '#name',
	PATIENT_NAME_KANA_INPUT: '#nameKana',
	BIRTH_DATE_INPUT: '#birthDate',
	GENDER_SELECT: '#gender',
	SUBMIT_BUTTON: 'button[type="submit"]:has-text("登録する")',
	SEARCH_INPUT: 'input[placeholder*="患者番号または氏名"]',
	SEARCH_BUTTON: 'button:has-text("検索")',

	// 療養計画書作成ページ
	CARE_PLAN_TITLE: 'h1:has-text("療養計画書作成")',
	RECORD_DATE_INPUT: '#recordDate',
	CONSULTATION_DATE_INPUT: '#consultationDate',
	NEXT_BUTTON: 'button:has-text("次へ")',
	PREV_BUTTON: 'button:has-text("前へ")',
	SAVE_BUTTON: 'button:has-text("保存する")',

	// サイドナビゲーション
	NAV_PATIENTS: 'a:has-text("患者管理")',
	NAV_CARE_PLANS: 'a:has-text("療養計画書")',
	NAV_DASHBOARD: 'a:has-text("ダッシュボード")',
	LOGOUT_BUTTON: 'button:has-text("ログアウト")'
};
