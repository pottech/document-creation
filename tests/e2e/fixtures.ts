import { test as base, expect } from '@playwright/test';

/**
 * 認証済み状態のテストフィクスチャ
 * 実際のKeycloak認証をテストする場合はstorageStateを使用
 */
export const test = base.extend<{
	authenticatedPage: ReturnType<typeof base.page>;
}>({
	authenticatedPage: async ({ page }, use) => {
		// 認証が必要なテストではここで認証処理を行う
		// Keycloakにログインしてセッションを保存する場合:
		// await page.goto('/login');
		// await page.click('button:has-text("Keycloakでサインイン")');
		// ... Keycloakでの認証フロー
		await use(page);
	}
});

export { expect };

/**
 * テスト用定数
 */
export const TEST_CONFIG = {
	// テスト用病院スラッグ（実際のテスト環境に合わせて変更）
	HOSPITAL_SLUG: 'test-hospital',
	// テスト用患者データ
	TEST_PATIENT: {
		patientNumber: `P${Date.now()}`,
		name: 'テスト 患者',
		nameKana: 'テスト カンジャ',
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
