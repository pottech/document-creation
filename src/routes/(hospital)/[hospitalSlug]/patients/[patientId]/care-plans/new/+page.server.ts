import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hospitals, users, hospitalMemberships } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getPatientById, isPatientInHospital } from '$lib/server/repositories/patients';
import {
	getLatestCarePlan,
	getCarePlanCount,
	createCarePlan,
	setCarePlanStaffs,
	type CreateCarePlanParams
} from '$lib/server/repositories/care-plans';
import { logAudit } from '$lib/server/services/audit-service';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, parent, locals }) => {
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

	// 最新の計画書を取得（継続作成用）
	const latestCarePlan = await getLatestCarePlan(params.patientId);
	const carePlanCount = await getCarePlanCount(params.patientId);

	// 病院のスタッフ一覧を取得（担当者選択用）
	const staffMembers = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email
		})
		.from(hospitalMemberships)
		.innerJoin(users, eq(hospitalMemberships.userId, users.id))
		.where(eq(hospitalMemberships.hospitalId, hospital.id));

	// 今日の日付
	const today = new Date().toISOString().split('T')[0];

	return {
		patient,
		latestCarePlan,
		carePlanCount,
		staffMembers,
		today,
		isInitial: carePlanCount === 0
	};
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		// 認証チェック
		if (!locals.user) {
			return fail(401, { error: 'ログインが必要です' });
		}

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

		// 監査ログ用に患者情報を取得
		const patient = await getPatientById(params.patientId);
		if (!patient) {
			return fail(404, { error: '患者が見つかりません' });
		}

		const formData = await request.formData();

		// 基本情報
		const planType = formData.get('planType')?.toString() as 'initial' | 'continuous';
		const sequenceNumber = parseInt(formData.get('sequenceNumber')?.toString() || '1', 10);
		const recordDate = formData.get('recordDate')?.toString();
		const consultationDate = formData.get('consultationDate')?.toString();

		// 主病
		const hasDiabetes = formData.get('hasDiabetes') === 'on';
		const hasHypertension = formData.get('hasHypertension') === 'on';
		const hasHyperlipidemia = formData.get('hasHyperlipidemia') === 'on';

		// バリデーション
		if (!planType || !recordDate || !consultationDate) {
			return fail(400, { error: '必須項目を入力してください' });
		}

		if (!hasDiabetes && !hasHypertension && !hasHyperlipidemia) {
			return fail(400, { error: '主病を1つ以上選択してください' });
		}

		// 検査項目
		const height = formData.get('height')?.toString() || null;
		const weightCurrent = formData.get('weightCurrent')?.toString() || null;
		const weightTarget = formData.get('weightTarget')?.toString() || null;
		const waistCurrent = formData.get('waistCurrent')?.toString() || null;
		const waistTarget = formData.get('waistTarget')?.toString() || null;
		const nutritionStatus = formData.get('nutritionStatus')?.toString() || null;
		const bloodPressureSystolic = formData.get('bloodPressureSystolic')?.toString() || null;
		const bloodPressureDiastolic = formData.get('bloodPressureDiastolic')?.toString() || null;
		const hasExerciseEcg = formData.get('hasExerciseEcg') === 'on';

		// BMI計算
		let bmi: string | null = null;
		if (height && weightCurrent) {
			const h = parseFloat(height) / 100;
			const w = parseFloat(weightCurrent);
			bmi = (w / (h * h)).toFixed(1);
		}

		// 血液検査
		const bloodTestDate = formData.get('bloodTestDate')?.toString() || null;
		const bloodGlucoseCondition = formData.get('bloodGlucoseCondition')?.toString() || null;
		const bloodGlucosePostMealHours = formData.get('bloodGlucosePostMealHours')?.toString() || null;
		const bloodGlucose = formData.get('bloodGlucose')?.toString() || null;
		const hba1cCurrent = formData.get('hba1cCurrent')?.toString() || null;
		const hba1cTarget = formData.get('hba1cTarget')?.toString() || null;
		const totalCholesterol = formData.get('totalCholesterol')?.toString() || null;
		const triglycerides = formData.get('triglycerides')?.toString() || null;
		const hdlCholesterol = formData.get('hdlCholesterol')?.toString() || null;
		const ldlCholesterol = formData.get('ldlCholesterol')?.toString() || null;

		// 問診
		const dietarySituation = formData.get('dietarySituation')?.toString() || null;
		const exerciseSituation = formData.get('exerciseSituation')?.toString() || null;
		const smokingSituation = formData.get('smokingSituation')?.toString() || null;
		const otherLifestyle = formData.get('otherLifestyle')?.toString() || null;

		// 目標
		const achievementGoal = formData.get('achievementGoal')?.toString() || null;
		const behaviorGoal = formData.get('behaviorGoal')?.toString() || null;
		const goalAchievementStatus = formData.get('goalAchievementStatus')?.toString() || null;
		const nextGoal = formData.get('nextGoal')?.toString() || null;

		// 食事指導
		const dietGuidance = {
			properIntake: formData.get('diet_properIntake') === 'on',
			reduceSalt: formData.get('diet_reduceSalt') === 'on',
			increaseFiber: formData.get('diet_increaseFiber') === 'on',
			eatingOutNotes: formData.get('diet_eatingOutNotes')?.toString() || undefined,
			reduceOil: formData.get('diet_reduceOil') === 'on',
			other: formData.get('diet_other')?.toString() || undefined,
			reduceAlcohol: {
				enabled: formData.get('diet_reduceAlcohol') === 'on',
				typeAndAmount: formData.get('diet_reduceAlcohol_type')?.toString() || undefined,
				weeklyFrequency: formData.get('diet_reduceAlcohol_freq')
					? parseInt(formData.get('diet_reduceAlcohol_freq')?.toString() || '0', 10)
					: undefined
			},
			reduceSnacks: {
				enabled: formData.get('diet_reduceSnacks') === 'on',
				typeAndAmount: formData.get('diet_reduceSnacks_type')?.toString() || undefined,
				weeklyFrequency: formData.get('diet_reduceSnacks_freq')
					? parseInt(formData.get('diet_reduceSnacks_freq')?.toString() || '0', 10)
					: undefined
			},
			eatingStyle: {
				slowEating: formData.get('diet_slowEating') === 'on',
				other: formData.get('diet_eatingStyle_other')?.toString() || undefined
			},
			regularMeals: formData.get('diet_regularMeals') === 'on',
			noGuidanceNeeded: formData.get('diet_noGuidanceNeeded') === 'on'
		};

		// 運動指導
		const exerciseGuidance = {
			prescription: {
				type: formData.get('exercise_type')?.toString() || undefined,
				duration: formData.get('exercise_duration')?.toString() || undefined,
				frequency: formData.get('exercise_frequency')?.toString() || undefined,
				weeklyDays: formData.get('exercise_weeklyDays')
					? parseInt(formData.get('exercise_weeklyDays')?.toString() || '0', 10)
					: undefined,
				intensity: formData.get('exercise_intensity')?.toString() || undefined,
				heartRate: formData.get('exercise_heartRate')
					? parseInt(formData.get('exercise_heartRate')?.toString() || '0', 10)
					: undefined
			},
			dailyActivityIncrease: formData.get('exercise_dailyActivity')?.toString() || undefined,
			exerciseNotes: formData.get('exercise_notes')?.toString() || undefined,
			noGuidanceNeeded: formData.get('exercise_noGuidanceNeeded') === 'on'
		};

		// たばこ指導
		const smokingGuidance = {
			isNonSmoker: formData.get('smoking_isNonSmoker') === 'on',
			quitSmokingEffectiveness: formData.get('smoking_effectiveness') === 'on',
			quitSmokingMethod: formData.get('smoking_method') === 'on'
		};

		// その他指導
		const otherGuidance = {
			work: formData.get('other_work') === 'on',
			leisure: formData.get('other_leisure') === 'on',
			sleepQuality: formData.get('other_sleep') === 'on',
			weightLoss: formData.get('other_weightLoss') === 'on',
			homeMeasurement: formData.get('other_homeMeasurement') === 'on',
			other: formData.get('other_other')?.toString() || undefined
		};

		// 服薬指導
		const hasNoPrescription = formData.get('hasNoPrescription') === 'on';
		const hasMedicationExplanation = formData.get('hasMedicationExplanation') === 'on';

		// 問題点
		const treatmentIssues = formData.get('treatmentIssues')?.toString() || null;
		const otherFacilityUsage = formData.get('otherFacilityUsage')?.toString() || null;

		// 署名
		const patientSignature = formData.get('patientSignature')?.toString() || null;
		const primaryDoctorId = formData.get('primaryDoctorId')?.toString() || null;
		const secondaryDoctorId = formData.get('secondaryDoctorId')?.toString() || null;

		// ステータス
		const status = (formData.get('status')?.toString() || 'draft') as 'draft' | 'completed' | 'signed';

		try {
			const carePlanData: CreateCarePlanParams = {
				hospitalId: hospital.id,
				patientId: params.patientId,
				planType,
				sequenceNumber,
				recordDate,
				consultationDate,
				hasDiabetes,
				hasHypertension,
				hasHyperlipidemia,
				height,
				weightCurrent,
				weightTarget,
				bmi,
				waistCurrent,
				waistTarget,
				nutritionStatus: nutritionStatus as any,
				bloodPressureSystolic: bloodPressureSystolic ? parseInt(bloodPressureSystolic, 10) : null,
				bloodPressureDiastolic: bloodPressureDiastolic ? parseInt(bloodPressureDiastolic, 10) : null,
				hasExerciseEcg,
				bloodTestDate,
				bloodGlucoseCondition: bloodGlucoseCondition as any,
				bloodGlucosePostMealHours: bloodGlucosePostMealHours
					? parseInt(bloodGlucosePostMealHours, 10)
					: null,
				bloodGlucose: bloodGlucose ? parseInt(bloodGlucose, 10) : null,
				hba1cCurrent,
				hba1cTarget,
				totalCholesterol: totalCholesterol ? parseInt(totalCholesterol, 10) : null,
				triglycerides: triglycerides ? parseInt(triglycerides, 10) : null,
				hdlCholesterol: hdlCholesterol ? parseInt(hdlCholesterol, 10) : null,
				ldlCholesterol: ldlCholesterol ? parseInt(ldlCholesterol, 10) : null,
				dietarySituation,
				exerciseSituation,
				smokingSituation,
				otherLifestyle,
				achievementGoal,
				behaviorGoal,
				goalAchievementStatus,
				nextGoal,
				dietGuidance,
				exerciseGuidance,
				smokingGuidance,
				otherGuidance,
				hasNoPrescription,
				hasMedicationExplanation,
				treatmentIssues,
				otherFacilityUsage,
				patientSignature,
				primaryDoctorId,
				secondaryDoctorId,
				status,
				createdBy: locals.user.id
			};

			const carePlan = await createCarePlan(carePlanData);

			// 担当者を設定
			const staffEntries: Array<{ userId: string; guidanceArea: any; displayOrder: number }> = [];

			// 各領域の担当者を取得
			const areas = ['diet', 'exercise', 'smoking', 'other', 'medication'] as const;
			for (const area of areas) {
				const staffId = formData.get(`staff_${area}`)?.toString();
				if (staffId) {
					staffEntries.push({
						userId: staffId,
						guidanceArea: area,
						displayOrder: 1
					});
				}
			}

			if (staffEntries.length > 0) {
				await setCarePlanStaffs(carePlan.id, staffEntries);
			}

			// 監査ログを記録
			await logAudit({
				userId: locals.user.id,
				userName: locals.user.name || locals.user.email,
				hospitalId: hospital.id,
				hospitalName: hospital.name,
				action: 'care_plan.create',
				targetType: 'care_plan',
				targetId: carePlan.id,
				targetName: `${patient.name} - 療養計画書 #${sequenceNumber}`,
				metadata: {
					patientId: patient.id,
					patientName: patient.name,
					planType,
					sequenceNumber,
					recordDate,
					consultationDate
				},
				ipAddress: locals.clientInfo.ipAddress,
				userAgent: locals.clientInfo.userAgent
			});

			throw redirect(302, `/${params.hospitalSlug}/patients/${params.patientId}`);
		} catch (e: unknown) {
			// SvelteKitのredirectは再スロー
			if (e && typeof e === 'object' && 'status' in e && 'location' in e) {
				throw e;
			}
			console.error('Care plan creation error:', e);
			const errorMessage = e instanceof Error ? e.message : '療養計画書の作成に失敗しました';
			return fail(500, { error: errorMessage });
		}
	}
};
