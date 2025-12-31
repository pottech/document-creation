import { db } from '$lib/server/db';
import {
	carePlans,
	carePlanStaffs,
	patients,
	users,
	type CarePlan,
	type NewCarePlan,
	type CarePlanStaff,
	type NewCarePlanStaff,
	type PlanType,
	type PlanStatus,
	type GuidanceArea
} from '$lib/server/db/schema';
import { eq, and, desc, sql, gte, lte, asc } from 'drizzle-orm';

// 患者情報付きの療養計画書
export interface CarePlanWithPatient extends CarePlan {
	patient: {
		id: string;
		patientNumber: string;
		name: string;
		birthDate: string;
		gender: string;
	};
}

// 詳細情報付きの療養計画書
export interface CarePlanWithDetails extends CarePlanWithPatient {
	primaryDoctor: { id: string; name: string } | null;
	secondaryDoctor: { id: string; name: string } | null;
	createdByUser: { id: string; name: string };
	staffs: Array<{
		id: string;
		userId: string;
		userName: string;
		guidanceArea: GuidanceArea;
		displayOrder: number;
	}>;
}

interface GetCarePlansOptions {
	patientId?: string;
	consultationDate?: string;
	dateFrom?: string;
	dateTo?: string;
	status?: PlanStatus;
	planType?: PlanType;
	limit?: number;
	offset?: number;
}

interface CarePlansResult {
	carePlans: CarePlanWithPatient[];
	total: number;
}

/**
 * 療養計画書一覧を取得
 */
export async function getCarePlans(
	hospitalId: string,
	options: GetCarePlansOptions = {}
): Promise<CarePlansResult> {
	const { patientId, consultationDate, dateFrom, dateTo, status, planType, limit = 50, offset = 0 } = options;

	const conditions = [eq(carePlans.hospitalId, hospitalId)];

	if (patientId) {
		conditions.push(eq(carePlans.patientId, patientId));
	}
	if (consultationDate) {
		conditions.push(eq(carePlans.consultationDate, consultationDate));
	}
	if (dateFrom) {
		conditions.push(gte(carePlans.consultationDate, dateFrom));
	}
	if (dateTo) {
		conditions.push(lte(carePlans.consultationDate, dateTo));
	}
	if (status) {
		conditions.push(eq(carePlans.status, status));
	}
	if (planType) {
		conditions.push(eq(carePlans.planType, planType));
	}

	const whereClause = and(...conditions);

	const [result, countResult] = await Promise.all([
		db
			.select({
				carePlan: carePlans,
				patient: {
					id: patients.id,
					patientNumber: patients.patientNumber,
					name: patients.name,
					birthDate: patients.birthDate,
					gender: patients.gender
				}
			})
			.from(carePlans)
			.innerJoin(patients, eq(carePlans.patientId, patients.id))
			.where(whereClause)
			.orderBy(desc(carePlans.consultationDate), desc(carePlans.createdAt))
			.limit(limit)
			.offset(offset),
		db
			.select({ count: sql<number>`count(*)` })
			.from(carePlans)
			.where(whereClause)
	]);

	return {
		carePlans: result.map((row) => ({
			...row.carePlan,
			patient: row.patient
		})),
		total: Number(countResult[0]?.count ?? 0)
	};
}

/**
 * 患者別の療養計画書履歴を取得
 */
export async function getCarePlansByPatient(patientId: string): Promise<CarePlanWithPatient[]> {
	const result = await db
		.select({
			carePlan: carePlans,
			patient: {
				id: patients.id,
				patientNumber: patients.patientNumber,
				name: patients.name,
				birthDate: patients.birthDate,
				gender: patients.gender
			}
		})
		.from(carePlans)
		.innerJoin(patients, eq(carePlans.patientId, patients.id))
		.where(eq(carePlans.patientId, patientId))
		.orderBy(desc(carePlans.consultationDate), desc(carePlans.sequenceNumber));

	return result.map((row) => ({
		...row.carePlan,
		patient: row.patient
	}));
}

/**
 * 診療日別の療養計画書一覧を取得
 */
export async function getCarePlansByDate(
	hospitalId: string,
	date: string
): Promise<CarePlanWithPatient[]> {
	const result = await db
		.select({
			carePlan: carePlans,
			patient: {
				id: patients.id,
				patientNumber: patients.patientNumber,
				name: patients.name,
				birthDate: patients.birthDate,
				gender: patients.gender
			}
		})
		.from(carePlans)
		.innerJoin(patients, eq(carePlans.patientId, patients.id))
		.where(and(eq(carePlans.hospitalId, hospitalId), eq(carePlans.consultationDate, date)))
		.orderBy(asc(patients.patientNumber));

	return result.map((row) => ({
		...row.carePlan,
		patient: row.patient
	}));
}

/**
 * 療養計画書をIDで取得（詳細情報付き）
 */
export async function getCarePlanById(id: string): Promise<CarePlanWithDetails | null> {
	const result = await db
		.select({
			carePlan: carePlans,
			patient: {
				id: patients.id,
				patientNumber: patients.patientNumber,
				name: patients.name,
				birthDate: patients.birthDate,
				gender: patients.gender
			},
			primaryDoctor: {
				id: sql<string>`pd.id`,
				name: sql<string>`pd.name`
			},
			secondaryDoctor: {
				id: sql<string>`sd.id`,
				name: sql<string>`sd.name`
			},
			createdByUser: {
				id: sql<string>`cb.id`,
				name: sql<string>`cb.name`
			}
		})
		.from(carePlans)
		.innerJoin(patients, eq(carePlans.patientId, patients.id))
		.leftJoin(sql`${users} as pd`, sql`${carePlans.primaryDoctorId} = pd.id`)
		.leftJoin(sql`${users} as sd`, sql`${carePlans.secondaryDoctorId} = sd.id`)
		.innerJoin(sql`${users} as cb`, sql`${carePlans.createdBy} = cb.id`)
		.where(eq(carePlans.id, id))
		.limit(1);

	if (result.length === 0) {
		return null;
	}

	const row = result[0];

	// 担当者を取得
	const staffsResult = await db
		.select({
			id: carePlanStaffs.id,
			userId: carePlanStaffs.userId,
			userName: users.name,
			guidanceArea: carePlanStaffs.guidanceArea,
			displayOrder: carePlanStaffs.displayOrder
		})
		.from(carePlanStaffs)
		.innerJoin(users, eq(carePlanStaffs.userId, users.id))
		.where(eq(carePlanStaffs.carePlanId, id))
		.orderBy(carePlanStaffs.guidanceArea, carePlanStaffs.displayOrder);

	return {
		...row.carePlan,
		patient: row.patient,
		primaryDoctor: row.primaryDoctor?.id ? row.primaryDoctor : null,
		secondaryDoctor: row.secondaryDoctor?.id ? row.secondaryDoctor : null,
		createdByUser: row.createdByUser,
		staffs: staffsResult.map((s) => ({
			...s,
			guidanceArea: s.guidanceArea as GuidanceArea
		}))
	};
}

/**
 * 患者の最新の療養計画書を取得
 */
export async function getLatestCarePlan(patientId: string): Promise<CarePlan | null> {
	const [result] = await db
		.select()
		.from(carePlans)
		.where(eq(carePlans.patientId, patientId))
		.orderBy(desc(carePlans.consultationDate), desc(carePlans.sequenceNumber))
		.limit(1);

	return result ?? null;
}

/**
 * 患者の療養計画書の回数を取得
 */
export async function getCarePlanCount(patientId: string): Promise<number> {
	const [result] = await db
		.select({ count: sql<number>`count(*)` })
		.from(carePlans)
		.where(eq(carePlans.patientId, patientId));

	return Number(result?.count ?? 0);
}

// 療養計画書作成パラメータ
export type CreateCarePlanParams = Omit<NewCarePlan, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 療養計画書を作成
 */
export async function createCarePlan(params: CreateCarePlanParams): Promise<CarePlan> {
	const [carePlan] = await db.insert(carePlans).values(params).returning();

	return carePlan;
}

// 療養計画書更新パラメータ
export type UpdateCarePlanParams = Partial<Omit<NewCarePlan, 'id' | 'hospitalId' | 'patientId' | 'createdBy' | 'createdAt'>>;

/**
 * 療養計画書を更新
 */
export async function updateCarePlan(id: string, params: UpdateCarePlanParams): Promise<CarePlan> {
	const [carePlan] = await db
		.update(carePlans)
		.set({
			...params,
			updatedAt: new Date()
		})
		.where(eq(carePlans.id, id))
		.returning();

	if (!carePlan) {
		throw new Error('Care plan not found');
	}

	return carePlan;
}

/**
 * 療養計画書を削除
 */
export async function deleteCarePlan(id: string): Promise<void> {
	await db.delete(carePlans).where(eq(carePlans.id, id));
}

/**
 * 担当者を設定
 */
export async function setCarePlanStaffs(
	carePlanId: string,
	staffs: Array<{ userId: string; guidanceArea: GuidanceArea; displayOrder?: number }>
): Promise<void> {
	// 既存の担当者を削除
	await db.delete(carePlanStaffs).where(eq(carePlanStaffs.carePlanId, carePlanId));

	// 新しい担当者を追加
	if (staffs.length > 0) {
		await db.insert(carePlanStaffs).values(
			staffs.map((s, index) => ({
				carePlanId,
				userId: s.userId,
				guidanceArea: s.guidanceArea,
				displayOrder: s.displayOrder ?? index + 1
			}))
		);
	}
}

/**
 * 療養計画書がこの病院に属しているかチェック
 */
export async function isCarePlanInHospital(carePlanId: string, hospitalId: string): Promise<boolean> {
	const [result] = await db
		.select({ id: carePlans.id })
		.from(carePlans)
		.where(and(eq(carePlans.id, carePlanId), eq(carePlans.hospitalId, hospitalId)))
		.limit(1);

	return !!result;
}

// 統計情報
interface CarePlanStats {
	total: number;
	byStatus: { status: PlanStatus; count: number }[];
	byDisease: { disease: string; count: number }[];
}

/**
 * 療養計画書の統計情報を取得
 */
export async function getCarePlanStats(
	hospitalId: string,
	dateFrom?: string,
	dateTo?: string
): Promise<CarePlanStats> {
	const conditions = [eq(carePlans.hospitalId, hospitalId)];
	if (dateFrom) {
		conditions.push(gte(carePlans.consultationDate, dateFrom));
	}
	if (dateTo) {
		conditions.push(lte(carePlans.consultationDate, dateTo));
	}
	const whereClause = and(...conditions);

	const [totalResult, statusResult] = await Promise.all([
		db.select({ count: sql<number>`count(*)` }).from(carePlans).where(whereClause),
		db
			.select({
				status: carePlans.status,
				count: sql<number>`count(*)`
			})
			.from(carePlans)
			.where(whereClause)
			.groupBy(carePlans.status)
	]);

	// 疾患別の集計
	const diseaseResult = await db
		.select({
			diabetes: sql<number>`sum(case when ${carePlans.hasDiabetes} then 1 else 0 end)`,
			hypertension: sql<number>`sum(case when ${carePlans.hasHypertension} then 1 else 0 end)`,
			hyperlipidemia: sql<number>`sum(case when ${carePlans.hasHyperlipidemia} then 1 else 0 end)`
		})
		.from(carePlans)
		.where(whereClause);

	const byDisease = [
		{ disease: 'diabetes', count: Number(diseaseResult[0]?.diabetes ?? 0) },
		{ disease: 'hypertension', count: Number(diseaseResult[0]?.hypertension ?? 0) },
		{ disease: 'hyperlipidemia', count: Number(diseaseResult[0]?.hyperlipidemia ?? 0) }
	];

	return {
		total: Number(totalResult[0]?.count ?? 0),
		byStatus: statusResult.map((r) => ({
			status: r.status as PlanStatus,
			count: Number(r.count)
		})),
		byDisease
	};
}

/**
 * 月別の作成件数を取得
 */
export async function getMonthlyCarePlanCounts(
	hospitalId: string,
	year: number,
	month: number
): Promise<{ date: string; count: number }[]> {
	const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
	const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // 月末

	const result = await db
		.select({
			date: carePlans.consultationDate,
			count: sql<number>`count(*)`
		})
		.from(carePlans)
		.where(
			and(
				eq(carePlans.hospitalId, hospitalId),
				gte(carePlans.consultationDate, startDate),
				lte(carePlans.consultationDate, endDate)
			)
		)
		.groupBy(carePlans.consultationDate)
		.orderBy(carePlans.consultationDate);

	return result.map((r) => ({
		date: r.date,
		count: Number(r.count)
	}));
}
