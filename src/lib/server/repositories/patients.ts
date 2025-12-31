import { db } from '$lib/server/db';
import { patients, type Patient, type NewPatient, type Gender } from '$lib/server/db/schema';
import { eq, and, ilike, or, desc, sql } from 'drizzle-orm';

interface GetPatientsOptions {
	search?: string;
	limit?: number;
	offset?: number;
}

interface PatientsResult {
	patients: Patient[];
	total: number;
}

/**
 * 患者一覧を取得
 */
export async function getPatients(
	hospitalId: string,
	options: GetPatientsOptions = {}
): Promise<PatientsResult> {
	const { search, limit = 50, offset = 0 } = options;

	let whereClause = eq(patients.hospitalId, hospitalId);

	if (search) {
		whereClause = and(
			whereClause,
			or(ilike(patients.name, `%${search}%`), ilike(patients.patientNumber, `%${search}%`))
		)!;
	}

	const [result, countResult] = await Promise.all([
		db
			.select()
			.from(patients)
			.where(whereClause)
			.orderBy(desc(patients.updatedAt))
			.limit(limit)
			.offset(offset),
		db
			.select({ count: sql<number>`count(*)` })
			.from(patients)
			.where(whereClause)
	]);

	return {
		patients: result,
		total: Number(countResult[0]?.count ?? 0)
	};
}

/**
 * 患者をIDで取得
 */
export async function getPatientById(id: string): Promise<Patient | null> {
	const [patient] = await db.select().from(patients).where(eq(patients.id, id)).limit(1);

	return patient ?? null;
}

/**
 * 患者を患者番号で取得（病院内）
 */
export async function getPatientByNumber(
	hospitalId: string,
	patientNumber: string
): Promise<Patient | null> {
	const [patient] = await db
		.select()
		.from(patients)
		.where(and(eq(patients.hospitalId, hospitalId), eq(patients.patientNumber, patientNumber)))
		.limit(1);

	return patient ?? null;
}

interface CreatePatientParams {
	hospitalId: string;
	patientNumber: string;
	name: string;
	nameKana?: string;
	birthDate: string;
	gender: Gender;
}

/**
 * 患者を登録
 */
export async function createPatient(params: CreatePatientParams): Promise<Patient> {
	// 患者番号の重複チェック
	const existing = await getPatientByNumber(params.hospitalId, params.patientNumber);
	if (existing) {
		throw new Error('Patient number already exists');
	}

	const [patient] = await db
		.insert(patients)
		.values({
			hospitalId: params.hospitalId,
			patientNumber: params.patientNumber,
			name: params.name,
			nameKana: params.nameKana,
			birthDate: params.birthDate,
			gender: params.gender
		})
		.returning();

	return patient;
}

interface UpdatePatientParams {
	name?: string;
	nameKana?: string;
	birthDate?: string;
	gender?: Gender;
}

/**
 * 患者を更新
 */
export async function updatePatient(id: string, params: UpdatePatientParams): Promise<Patient> {
	const [patient] = await db
		.update(patients)
		.set({
			...params,
			updatedAt: new Date()
		})
		.where(eq(patients.id, id))
		.returning();

	if (!patient) {
		throw new Error('Patient not found');
	}

	return patient;
}

/**
 * 患者を削除
 */
export async function deletePatient(id: string): Promise<void> {
	const result = await db.delete(patients).where(eq(patients.id, id));

	// Note: Drizzle doesn't return affected rows count easily,
	// so we check existence separately if needed
}

/**
 * 患者がこの病院に属しているかチェック
 */
export async function isPatientInHospital(patientId: string, hospitalId: string): Promise<boolean> {
	const [patient] = await db
		.select({ id: patients.id })
		.from(patients)
		.where(and(eq(patients.id, patientId), eq(patients.hospitalId, hospitalId)))
		.limit(1);

	return !!patient;
}

/**
 * 年齢を計算
 */
export function calculateAge(birthDate: string | Date): number {
	const birth = new Date(birthDate);
	const today = new Date();
	let age = today.getFullYear() - birth.getFullYear();
	const monthDiff = today.getMonth() - birth.getMonth();

	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
		age--;
	}

	return age;
}
