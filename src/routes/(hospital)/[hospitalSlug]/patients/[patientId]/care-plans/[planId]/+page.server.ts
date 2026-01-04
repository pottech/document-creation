import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hospitals, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getCarePlanById } from '$lib/server/repositories/care-plans';
import { getPatientById, isPatientInHospital } from '$lib/server/repositories/patients';
import { logAudit } from '$lib/server/services/audit-service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const [hospital] = await db
		.select()
		.from(hospitals)
		.where(eq(hospitals.slug, params.hospitalSlug))
		.limit(1);

	if (!hospital) {
		throw error(404, '病院が見つかりません');
	}

	// 患者がこの病院に属しているか確認
	const isInHospital = await isPatientInHospital(params.patientId, hospital.id);
	if (!isInHospital) {
		throw error(404, '患者が見つかりません');
	}

	const patient = await getPatientById(params.patientId);
	if (!patient) {
		throw error(404, '患者が見つかりません');
	}

	const carePlan = await getCarePlanById(params.planId);
	if (!carePlan) {
		throw error(404, '療養計画書が見つかりません');
	}

	// 医師情報取得
	let primaryDoctor = null;
	let secondaryDoctor = null;

	if (carePlan.primaryDoctorId) {
		const [doctor] = await db
			.select({ id: users.id, name: users.name })
			.from(users)
			.where(eq(users.id, carePlan.primaryDoctorId))
			.limit(1);
		primaryDoctor = doctor || null;
	}

	if (carePlan.secondaryDoctorId) {
		const [doctor] = await db
			.select({ id: users.id, name: users.name })
			.from(users)
			.where(eq(users.id, carePlan.secondaryDoctorId))
			.limit(1);
		secondaryDoctor = doctor || null;
	}

	// 閲覧の監査ログを記録（ユーザーがログイン中の場合のみ）
	if (locals.user) {
		// 非同期で記録（ページ表示をブロックしない）
		logAudit({
			userId: locals.user.id,
			userName: locals.user.name || locals.user.email,
			hospitalId: hospital.id,
			hospitalName: hospital.name,
			action: 'care_plan.view',
			targetType: 'care_plan',
			targetId: carePlan.id,
			targetName: `${patient.name} - 療養計画書 #${carePlan.sequenceNumber}`,
			metadata: {
				patientId: patient.id,
				patientName: patient.name
			},
			ipAddress: locals.clientInfo.ipAddress,
			userAgent: locals.clientInfo.userAgent
		}).catch((err) => console.error('Failed to log audit:', err));
	}

	return {
		patient,
		carePlan,
		primaryDoctor,
		secondaryDoctor
	};
};
