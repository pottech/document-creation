import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hospitals, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getCarePlanById } from '$lib/server/repositories/care-plans';
import { getPatientById, isPatientInHospital } from '$lib/server/repositories/patients';
import { generateCarePlanPdf, type CarePlanPdfData } from '$lib/server/services/pdf-generator';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	// 認証チェック
	if (!locals.user) {
		throw error(401, '認証が必要です');
	}

	// 病院取得
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

	// 計画書取得
	const carePlan = await getCarePlanById(params.planId);
	if (!carePlan) {
		throw error(404, '療養計画書が見つかりません');
	}

	// 患者情報取得
	const patient = await getPatientById(params.patientId);
	if (!patient) {
		throw error(404, '患者が見つかりません');
	}

	// 医師情報取得
	let primaryDoctorName: string | null = null;
	let secondaryDoctorName: string | null = null;

	if (carePlan.primaryDoctorId) {
		const [doctor] = await db
			.select({ name: users.name })
			.from(users)
			.where(eq(users.id, carePlan.primaryDoctorId))
			.limit(1);
		primaryDoctorName = doctor?.name || null;
	}

	if (carePlan.secondaryDoctorId) {
		const [doctor] = await db
			.select({ name: users.name })
			.from(users)
			.where(eq(users.id, carePlan.secondaryDoctorId))
			.limit(1);
		secondaryDoctorName = doctor?.name || null;
	}

	// 年齢計算
	const birthDate = new Date(patient.birthDate);
	const today = new Date();
	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
		age--;
	}

	// PDFデータ作成
	const pdfData: CarePlanPdfData = {
		patientName: patient.name,
		patientNumber: patient.patientNumber,
		birthDate: patient.birthDate,
		age,
		gender: patient.gender === 'male' ? '男' : '女',

		planType: carePlan.planType as 'initial' | 'continuous',
		sequenceNumber: carePlan.sequenceNumber,
		recordDate: carePlan.recordDate,
		consultationDate: carePlan.consultationDate,

		hasDiabetes: carePlan.hasDiabetes,
		hasHypertension: carePlan.hasHypertension,
		hasHyperlipidemia: carePlan.hasHyperlipidemia,

		height: carePlan.height,
		weightCurrent: carePlan.weightCurrent,
		weightTarget: carePlan.weightTarget,
		bmi: carePlan.bmi,
		waistCurrent: carePlan.waistCurrent,
		waistTarget: carePlan.waistTarget,
		bloodPressureSystolic: carePlan.bloodPressureSystolic,
		bloodPressureDiastolic: carePlan.bloodPressureDiastolic,

		bloodTestDate: carePlan.bloodTestDate,
		bloodGlucose: carePlan.bloodGlucose,
		hba1cCurrent: carePlan.hba1cCurrent,
		hba1cTarget: carePlan.hba1cTarget,
		totalCholesterol: carePlan.totalCholesterol,
		triglycerides: carePlan.triglycerides,
		hdlCholesterol: carePlan.hdlCholesterol,
		ldlCholesterol: carePlan.ldlCholesterol,

		achievementGoal: carePlan.achievementGoal,
		behaviorGoal: carePlan.behaviorGoal,

		goalAchievementStatus: carePlan.goalAchievementStatus,
		nextGoal: carePlan.nextGoal,

		patientSignature: carePlan.patientSignature,
		primaryDoctorName,
		secondaryDoctorName,

		hospitalName: hospital.name
	};

	// PDF生成
	const pdfBytes = await generateCarePlanPdf(pdfData);

	// ファイル名生成
	const fileName = `療養計画書_${patient.patientNumber}_${carePlan.consultationDate}.pdf`;
	const encodedFileName = encodeURIComponent(fileName);

	return new Response(Buffer.from(pdfBytes), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
			'Content-Length': pdfBytes.length.toString()
		}
	});
};
