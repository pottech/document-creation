import { pgTable, uuid, varchar, timestamp, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { carePlans } from './care-plans';
import { users } from './users';

// 担当領域
export const guidanceAreaEnum = ['diet', 'exercise', 'smoking', 'other', 'medication'] as const;
export type GuidanceArea = (typeof guidanceAreaEnum)[number];

export const carePlanStaffs = pgTable(
	'care_plan_staffs',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		carePlanId: uuid('care_plan_id')
			.notNull()
			.references(() => carePlans.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id),
		guidanceArea: varchar('guidance_area', { length: 50 }).notNull().$type<GuidanceArea>(),
		displayOrder: integer('display_order').notNull().default(1),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		uniqueIndex('care_plan_staffs_plan_area_order_idx').on(
			table.carePlanId,
			table.guidanceArea,
			table.displayOrder
		)
	]
);

export type CarePlanStaff = typeof carePlanStaffs.$inferSelect;
export type NewCarePlanStaff = typeof carePlanStaffs.$inferInsert;
