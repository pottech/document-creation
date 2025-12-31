import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hospitals, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getCarePlanById } from '$lib/server/repositories/care-plans';
import { getPatientById, isPatientInHospital } from '$lib/server/repositories/patients';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
	const parentData = await parent();

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

	return {
		patient,
		carePlan,
		primaryDoctor,
		secondaryDoctor
	};
};
