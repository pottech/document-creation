import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hospitals } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getPatientById, updatePatient, isPatientInHospital } from '$lib/server/repositories/patients';
import { getCarePlansByPatient } from '$lib/server/repositories/care-plans';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
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

	// 療養計画書履歴を取得
	const carePlans = await getCarePlansByPatient(params.patientId);

	return {
		patient,
		carePlans
	};
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const [hospital] = await db
			.select()
			.from(hospitals)
			.where(eq(hospitals.slug, params.hospitalSlug))
			.limit(1);

		if (!hospital) {
			return fail(404, { error: '病院が見つかりません' });
		}

		const isInHospital = await isPatientInHospital(params.patientId, hospital.id);
		if (!isInHospital) {
			return fail(404, { error: '患者が見つかりません' });
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const nameKana = formData.get('nameKana')?.toString();
		const birthDate = formData.get('birthDate')?.toString();
		const gender = formData.get('gender')?.toString() as 'male' | 'female';

		if (!name || !birthDate || !gender) {
			return fail(400, { error: '必須項目を入力してください' });
		}

		try {
			const patient = await updatePatient(params.patientId, {
				name,
				nameKana: nameKana || undefined,
				birthDate,
				gender
			});

			return { success: true, patient };
		} catch {
			return fail(500, { error: '患者情報の更新に失敗しました' });
		}
	}
};
