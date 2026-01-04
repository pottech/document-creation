/**
 * E2Eテスト用シードデータ作成スクリプト
 *
 * 使用方法:
 *   pnpm db:seed:test
 *
 * 注意:
 *   - 開発/テスト環境でのみ使用してください
 *   - 既存のテストデータは削除されます
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, like, sql } from 'drizzle-orm';
import * as schema from '../src/lib/server/db/schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema });

// テスト用の固定ID（Playwrightテストで参照しやすくするため）
export const TEST_IDS = {
	USER_ID: '00000000-0000-0000-0000-000000000001',
	USER_KEYCLOAK_ID: 'test-keycloak-user-001',
	ADMIN_USER_ID: '00000000-0000-0000-0000-000000000002',
	ADMIN_KEYCLOAK_ID: 'test-keycloak-admin-001',
	HOSPITAL_ID: '00000000-0000-0000-0000-000000000101',
	HOSPITAL_SLUG: 'test-hospital',
	PATIENT_ID: '00000000-0000-0000-0000-000000000201',
	PATIENT_ID_2: '00000000-0000-0000-0000-000000000202',
	CARE_PLAN_ID: '00000000-0000-0000-0000-000000000301',
	SESSION_ID: '00000000-0000-0000-0000-000000000401',
	CARE_PLAN_TEMPLATE_ID: '00000000-0000-0000-0000-000000000501'
};

async function clearTestData() {
	console.log('既存のテストデータを削除中...');

	// テストデータのみ削除（IDプレフィックスで識別）
	// 依存関係の順序で削除（子テーブルから先に）
	// UUIDカラムはtext型にキャストしてLIKEを使用

	// 1. 監査ログ（テストユーザーまたはテスト病院に関連）
	await db.delete(schema.auditLogs).where(sql`${schema.auditLogs.userId}::text like '00000000%'`);
	await db.delete(schema.auditLogs).where(sql`${schema.auditLogs.hospitalId}::text like '00000000%'`);

	// 2. 療養計画書関連（carePlansを参照）
	await db.delete(schema.carePlanStaffs).where(sql`${schema.carePlanStaffs.carePlanId}::text like '00000000%'`);

	// 3. 療養計画書（患者・病院を参照）
	await db.delete(schema.carePlans).where(sql`${schema.carePlans.id}::text like '00000000%'`);
	await db.delete(schema.carePlans).where(sql`${schema.carePlans.hospitalId}::text like '00000000%'`);
	await db.delete(schema.carePlans).where(sql`${schema.carePlans.patientId}::text like '00000000%'`);

	// 4. テンプレート（病院を参照）
	await db.delete(schema.carePlanTemplates).where(sql`${schema.carePlanTemplates.id}::text like '00000000%'`);
	await db.delete(schema.carePlanTemplates).where(sql`${schema.carePlanTemplates.hospitalId}::text like '00000000%'`);

	// 5. 患者（病院を参照） - 病院削除前に必ず削除
	await db.delete(schema.patients).where(sql`${schema.patients.id}::text like '00000000%'`);
	await db.delete(schema.patients).where(sql`${schema.patients.hospitalId}::text like '00000000%'`);

	// 6. セッション（ユーザーを参照）
	await db.delete(schema.sessions).where(sql`${schema.sessions.id}::text like '00000000%'`);
	await db.delete(schema.sessions).where(sql`${schema.sessions.userId}::text like '00000000%'`);

	// 7. APIクライアント（病院を参照）
	await db.delete(schema.apiClients).where(sql`${schema.apiClients.hospitalId}::text like '00000000%'`);

	// 8. メンバーシップ（ユーザー・病院を参照）
	await db.delete(schema.hospitalMemberships).where(sql`${schema.hospitalMemberships.userId}::text like '00000000%'`);
	await db.delete(schema.hospitalMemberships).where(sql`${schema.hospitalMemberships.hospitalId}::text like '00000000%'`);

	// 9. 招待（病院を参照）
	await db.delete(schema.invitations).where(sql`${schema.invitations.hospitalId}::text like '00000000%'`);

	// 10. 病院（他テーブルから参照されるため最後に近い順で削除）
	await db.delete(schema.hospitals).where(sql`${schema.hospitals.id}::text like '00000000%'`);

	// 11. ユーザー（最後に削除）
	await db.delete(schema.users).where(sql`${schema.users.id}::text like '00000000%'`);

	console.log('テストデータの削除完了');
}

async function seedUsers() {
	console.log('テストユーザーを作成中...');

	const users = [
		{
			id: TEST_IDS.USER_ID,
			keycloakId: TEST_IDS.USER_KEYCLOAK_ID,
			email: 'test-user@example.com',
			name: 'テスト太郎',
			isServiceAdmin: false
		},
		{
			id: TEST_IDS.ADMIN_USER_ID,
			keycloakId: TEST_IDS.ADMIN_KEYCLOAK_ID,
			email: 'test-admin@example.com',
			name: 'テスト管理者',
			isServiceAdmin: true
		}
	];

	await db.insert(schema.users).values(users);
	console.log(`${users.length}件のユーザーを作成しました`);
}

async function seedHospitals() {
	console.log('テスト病院を作成中...');

	const hospitals = [
		{
			id: TEST_IDS.HOSPITAL_ID,
			name: 'テスト総合病院',
			slug: TEST_IDS.HOSPITAL_SLUG
		}
	];

	await db.insert(schema.hospitals).values(hospitals);
	console.log(`${hospitals.length}件の病院を作成しました`);
}

async function seedMemberships() {
	console.log('病院メンバーシップを作成中...');

	const memberships = [
		{
			userId: TEST_IDS.USER_ID,
			hospitalId: TEST_IDS.HOSPITAL_ID,
			role: 'hospital_admin' as const
		},
		{
			userId: TEST_IDS.ADMIN_USER_ID,
			hospitalId: TEST_IDS.HOSPITAL_ID,
			role: 'hospital_admin' as const
		}
	];

	await db.insert(schema.hospitalMemberships).values(memberships);
	console.log(`${memberships.length}件のメンバーシップを作成しました`);
}

async function seedPatients() {
	console.log('テスト患者を作成中...');

	const patients = [
		{
			id: TEST_IDS.PATIENT_ID,
			hospitalId: TEST_IDS.HOSPITAL_ID,
			patientNumber: 'P001',
			name: '山田花子',
			nameKana: 'ヤマダハナコ',
			birthDate: '1965-03-15',
			gender: 'female' as const
		},
		{
			id: TEST_IDS.PATIENT_ID_2,
			hospitalId: TEST_IDS.HOSPITAL_ID,
			patientNumber: 'P002',
			name: '鈴木一郎',
			nameKana: 'スズキイチロウ',
			birthDate: '1958-07-22',
			gender: 'male' as const
		}
	];

	await db.insert(schema.patients).values(patients);
	console.log(`${patients.length}件の患者を作成しました`);
}

async function seedCarePlans() {
	console.log('テスト療養計画書を作成中...');

	const carePlans = [
		{
			id: TEST_IDS.CARE_PLAN_ID,
			hospitalId: TEST_IDS.HOSPITAL_ID,
			patientId: TEST_IDS.PATIENT_ID,
			planType: 'initial' as const,
			status: 'draft' as const,
			recordDate: new Date().toISOString().split('T')[0],
			consultationDate: new Date().toISOString().split('T')[0],
			hasDiabetes: true,
			hasHypertension: true,
			hasHyperlipidemia: false,
			height: '158.0',
			weightCurrent: '65.0',
			weightTarget: '60.0',
			bloodPressureSystolic: 140,
			bloodPressureDiastolic: 88,
			hba1cCurrent: '7.2',
			hba1cTarget: '6.5',
			createdBy: TEST_IDS.USER_ID
		}
	];

	await db.insert(schema.carePlans).values(carePlans);
	console.log(`${carePlans.length}件の療養計画書を作成しました`);
}

async function seedCarePlanTemplates() {
	console.log('テスト療養計画書テンプレートを作成中...');

	const templates = [
		{
			id: TEST_IDS.CARE_PLAN_TEMPLATE_ID,
			hospitalId: TEST_IDS.HOSPITAL_ID,
			name: '糖尿病標準テンプレート',
			description: '糖尿病患者向けの標準的な療養計画テンプレート',
			targetDisease: 'diabetes',
			templateData: {
				hasDiabetes: true,
				hasHypertension: false,
				hasHyperlipidemia: false,
				achievementGoalTemplate: 'HbA1cを目標値まで下げる',
				behaviorGoalTemplate: '毎日30分のウォーキングを行う',
				dietGuidance: {
					properIntake: true,
					reduceSalt: true,
					increaseFiber: true
				},
				exerciseGuidance: {
					prescription: {
						type: 'ウォーキング',
						duration: '30分',
						frequency: '毎日',
						weeklyDays: 7
					}
				}
			},
			isDefault: true,
			createdBy: TEST_IDS.USER_ID
		}
	];

	await db.insert(schema.carePlanTemplates).values(templates);
	console.log(`${templates.length}件のテンプレートを作成しました`);
}

async function seedSessions() {
	console.log('テストセッションを作成中...');

	// E2Eテスト用に有効なセッションを作成
	// expiresAtは24時間後に設定
	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
	const accessTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1時間後

	const sessions = [
		{
			id: TEST_IDS.SESSION_ID,
			userId: TEST_IDS.USER_ID,
			currentHospitalId: TEST_IDS.HOSPITAL_ID,
			accessToken: 'test-access-token-for-e2e',
			refreshToken: 'test-refresh-token-for-e2e',
			accessTokenExpiresAt,
			expiresAt
		}
	];

	await db.insert(schema.sessions).values(sessions);
	console.log(`${sessions.length}件のセッションを作成しました`);
}

async function main() {
	console.log('=== E2Eテスト用シードデータの作成を開始 ===\n');

	try {
		await clearTestData();
		await seedUsers();
		await seedHospitals();
		await seedMemberships();
		await seedPatients();
		await seedCarePlans();
		await seedCarePlanTemplates();
		await seedSessions();

		console.log('\n=== シードデータの作成が完了しました ===');
		console.log('\nテストデータ概要:');
		console.log(`  - ユーザー: 2名 (テスト太郎, テスト管理者)`);
		console.log(`  - 病院: テスト総合病院 (slug: ${TEST_IDS.HOSPITAL_SLUG})`);
		console.log(`  - 患者: 2名 (山田花子, 鈴木一郎)`);
		console.log(`  - 療養計画書: 1件`);
		console.log(`  - テンプレート: 1件 (糖尿病標準テンプレート)`);
		console.log(`  - セッション: 1件 (E2Eテスト用)`);
	} catch (error) {
		console.error('シードデータの作成に失敗しました:', error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

main();
