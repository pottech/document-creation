import { pgTable, uuid, varchar, timestamp, boolean, text, jsonb } from 'drizzle-orm/pg-core';
import { hospitals } from './hospitals';
import { users } from './users';
import type { DietGuidance, ExerciseGuidance, SmokingGuidance, OtherGuidance } from './care-plans';

// テンプレートデータ型
export interface CarePlanTemplateData {
	// 主病デフォルト
	hasDiabetes?: boolean;
	hasHypertension?: boolean;
	hasHyperlipidemia?: boolean;

	// 目標テンプレート
	achievementGoalTemplate?: string;
	behaviorGoalTemplate?: string;

	// 重点指導項目デフォルト
	dietGuidance?: DietGuidance;
	exerciseGuidance?: ExerciseGuidance;
	smokingGuidance?: SmokingGuidance;
	otherGuidance?: OtherGuidance;

	// 服薬指導デフォルト
	hasNoPrescription?: boolean;
	hasMedicationExplanation?: boolean;
}

export const carePlanTemplates = pgTable('care_plan_templates', {
	id: uuid('id').primaryKey().defaultRandom(),
	hospitalId: uuid('hospital_id')
		.notNull()
		.references(() => hospitals.id),
	name: varchar('name', { length: 100 }).notNull(),
	description: text('description'),
	targetDisease: varchar('target_disease', { length: 50 }),
	templateData: jsonb('template_data').notNull().$type<CarePlanTemplateData>(),
	isDefault: boolean('is_default').notNull().default(false),
	createdBy: uuid('created_by')
		.notNull()
		.references(() => users.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type CarePlanTemplate = typeof carePlanTemplates.$inferSelect;
export type NewCarePlanTemplate = typeof carePlanTemplates.$inferInsert;
