import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	date,
	boolean,
	integer,
	decimal,
	text,
	jsonb,
	index
} from 'drizzle-orm/pg-core';
import { hospitals } from './hospitals';
import { patients } from './patients';
import { users } from './users';

// 計画書種別
export const planTypeEnum = ['initial', 'continuous'] as const;
export type PlanType = (typeof planTypeEnum)[number];

// 計画書ステータス
export const planStatusEnum = ['draft', 'completed', 'signed'] as const;
export type PlanStatus = (typeof planStatusEnum)[number];

// 血糖測定条件
export const bloodGlucoseConditionEnum = ['fasting', 'random', 'postprandial'] as const;
export type BloodGlucoseCondition = (typeof bloodGlucoseConditionEnum)[number];

// 栄養状態
export const nutritionStatusEnum = ['malnourished', 'good', 'obese'] as const;
export type NutritionStatus = (typeof nutritionStatusEnum)[number];

// 食事指導データ型
export interface DietGuidance {
	properIntake?: boolean;
	reduceSalt?: boolean;
	increaseFiber?: boolean;
	eatingOutNotes?: string;
	reduceOil?: boolean;
	other?: string;
	reduceAlcohol?: {
		enabled: boolean;
		typeAndAmount?: string;
		weeklyFrequency?: number;
	};
	reduceSnacks?: {
		enabled: boolean;
		typeAndAmount?: string;
		weeklyFrequency?: number;
	};
	eatingStyle?: {
		slowEating?: boolean;
		other?: string;
	};
	regularMeals?: boolean;
	noGuidanceNeeded?: boolean;
}

// 運動指導データ型
export interface ExerciseGuidance {
	prescription?: {
		type?: string;
		duration?: string;
		frequency?: string;
		weeklyDays?: number;
		intensity?: string;
		heartRate?: number;
	};
	dailyActivityIncrease?: string;
	exerciseNotes?: string;
	noGuidanceNeeded?: boolean;
}

// たばこ指導データ型
export interface SmokingGuidance {
	isNonSmoker?: boolean;
	quitSmokingEffectiveness?: boolean;
	quitSmokingMethod?: boolean;
}

// その他指導データ型
export interface OtherGuidance {
	work?: boolean;
	leisure?: boolean;
	sleepQuality?: boolean;
	weightLoss?: boolean;
	homeMeasurement?: boolean;
	other?: string;
}

export const carePlans = pgTable(
	'care_plans',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		hospitalId: uuid('hospital_id')
			.notNull()
			.references(() => hospitals.id),
		patientId: uuid('patient_id')
			.notNull()
			.references(() => patients.id),

		// 計画書種別
		planType: varchar('plan_type', { length: 20 }).notNull().$type<PlanType>(),
		sequenceNumber: integer('sequence_number').notNull().default(1),

		// 基本情報
		recordDate: date('record_date').notNull(),
		consultationDate: date('consultation_date').notNull(),

		// 主病（複数選択可）
		hasDiabetes: boolean('has_diabetes').notNull().default(false),
		hasHypertension: boolean('has_hypertension').notNull().default(false),
		hasHyperlipidemia: boolean('has_hyperlipidemia').notNull().default(false),

		// 検査項目
		height: decimal('height', { precision: 5, scale: 1 }),
		weightCurrent: decimal('weight_current', { precision: 5, scale: 1 }),
		weightTarget: decimal('weight_target', { precision: 5, scale: 1 }),
		bmi: decimal('bmi', { precision: 4, scale: 1 }),
		waistCurrent: decimal('waist_current', { precision: 5, scale: 1 }),
		waistTarget: decimal('waist_target', { precision: 5, scale: 1 }),
		nutritionStatus: varchar('nutrition_status', { length: 20 }).$type<NutritionStatus>(),
		bloodPressureSystolic: integer('blood_pressure_systolic'),
		bloodPressureDiastolic: integer('blood_pressure_diastolic'),
		hasExerciseEcg: boolean('has_exercise_ecg').default(false),

		// 血液検査項目
		bloodTestDate: date('blood_test_date'),
		bloodGlucoseCondition: varchar('blood_glucose_condition', {
			length: 20
		}).$type<BloodGlucoseCondition>(),
		bloodGlucosePostMealHours: integer('blood_glucose_post_meal_hours'),
		bloodGlucose: integer('blood_glucose'),
		hba1cCurrent: decimal('hba1c_current', { precision: 3, scale: 1 }),
		hba1cTarget: decimal('hba1c_target', { precision: 3, scale: 1 }),
		totalCholesterol: integer('total_cholesterol'),
		triglycerides: integer('triglycerides'),
		hdlCholesterol: integer('hdl_cholesterol'),
		ldlCholesterol: integer('ldl_cholesterol'),

		// 問診
		dietarySituation: text('dietary_situation'),
		exerciseSituation: text('exercise_situation'),
		smokingSituation: text('smoking_situation'),
		otherLifestyle: text('other_lifestyle'),

		// 達成目標・行動目標
		achievementGoal: text('achievement_goal'),
		behaviorGoal: text('behavior_goal'),

		// 継続用固有項目
		goalAchievementStatus: text('goal_achievement_status'),
		nextGoal: text('next_goal'),

		// 重点指導項目（JSONB）
		dietGuidance: jsonb('diet_guidance').$type<DietGuidance>(),
		exerciseGuidance: jsonb('exercise_guidance').$type<ExerciseGuidance>(),
		smokingGuidance: jsonb('smoking_guidance').$type<SmokingGuidance>(),
		otherGuidance: jsonb('other_guidance').$type<OtherGuidance>(),

		// 服薬指導
		hasNoPrescription: boolean('has_no_prescription').default(false),
		hasMedicationExplanation: boolean('has_medication_explanation').default(false),

		// 療養上の問題点
		treatmentIssues: text('treatment_issues'),
		otherFacilityUsage: text('other_facility_usage'),

		// 署名・承認
		patientSignature: varchar('patient_signature', { length: 100 }),
		primaryDoctorId: uuid('primary_doctor_id').references(() => users.id),
		secondaryDoctorId: uuid('secondary_doctor_id').references(() => users.id),

		// ステータス
		status: varchar('status', { length: 20 }).notNull().default('draft').$type<PlanStatus>(),
		pdfPath: varchar('pdf_path', { length: 500 }),

		// 監査
		createdBy: uuid('created_by')
			.notNull()
			.references(() => users.id),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('care_plans_hospital_consultation_date_idx').on(table.hospitalId, table.consultationDate),
		index('care_plans_patient_created_at_idx').on(table.patientId, table.createdAt)
	]
);

export type CarePlan = typeof carePlans.$inferSelect;
export type NewCarePlan = typeof carePlans.$inferInsert;
