import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { hospitalGroups } from './hospital-groups';

export const hospitals = pgTable('hospitals', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: varchar('name', { length: 255 }).notNull(),
	slug: varchar('slug', { length: 100 }).notNull().unique(),
	hospitalGroupId: uuid('hospital_group_id').references(() => hospitalGroups.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type Hospital = typeof hospitals.$inferSelect;
export type NewHospital = typeof hospitals.$inferInsert;
