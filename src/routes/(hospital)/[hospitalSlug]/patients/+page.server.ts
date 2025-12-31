import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hospitals } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getPatients, createPatient, deletePatient } from '$lib/server/repositories/patients';
import { getCarePlansByPatient } from '$lib/server/repositories/care-plans';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, parent, url }) => {
	const parentData = await parent();

	const [hospital] = await db
		.select()
		.from(hospitals)
		.where(eq(hospitals.slug, params.hospitalSlug))
		.limit(1);

	if (!hospital) {
		throw error(404, '病院が見つかりません');
	}

	const search = url.searchParams.get('search') || undefined;
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const limit = 20;
	const offset = (page - 1) * limit;

	const { patients, total } = await getPatients(hospital.id, {
		search,
		limit,
		offset
	});

	// 各患者の最新計画書情報を取得
	const patientsWithStats = await Promise.all(
		patients.map(async (patient) => {
			const carePlans = await getCarePlansByPatient(patient.id);
			return {
				...patient,
				carePlanCount: carePlans.length,
				latestCarePlan: carePlans[0] || null
			};
		})
	);

	return {
		patients: patientsWithStats,
		total,
		page,
		totalPages: Math.ceil(total / limit),
		search
	};
};

export const actions: Actions = {
	create: async ({ request, params }) => {
		const [hospital] = await db
			.select()
			.from(hospitals)
			.where(eq(hospitals.slug, params.hospitalSlug))
			.limit(1);

		if (!hospital) {
			return fail(404, { error: '病院が見つかりません' });
		}

		const formData = await request.formData();
		const patientNumber = formData.get('patientNumber')?.toString();
		const name = formData.get('name')?.toString();
		const nameKana = formData.get('nameKana')?.toString();
		const birthDate = formData.get('birthDate')?.toString();
		const gender = formData.get('gender')?.toString() as 'male' | 'female';

		if (!patientNumber || !name || !birthDate || !gender) {
			return fail(400, { error: '必須項目を入力してください' });
		}

		try {
			const patient = await createPatient({
				hospitalId: hospital.id,
				patientNumber,
				name,
				nameKana: nameKana || undefined,
				birthDate,
				gender
			});

			return { success: true, patient };
		} catch (e) {
			if (e instanceof Error && e.message === 'Patient number already exists') {
				return fail(400, { error: 'この患者番号は既に登録されています' });
			}
			return fail(500, { error: '患者の登録に失敗しました' });
		}
	},

	delete: async ({ request, params }) => {
		const [hospital] = await db
			.select()
			.from(hospitals)
			.where(eq(hospitals.slug, params.hospitalSlug))
			.limit(1);

		if (!hospital) {
			return fail(404, { error: '病院が見つかりません' });
		}

		const formData = await request.formData();
		const patientId = formData.get('patientId')?.toString();

		if (!patientId) {
			return fail(400, { error: '患者IDが指定されていません' });
		}

		try {
			await deletePatient(patientId);
			return { success: true };
		} catch (e) {
			return fail(500, { error: '患者の削除に失敗しました' });
		}
	}
};
