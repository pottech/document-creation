import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const hospitalGroups = pgTable('hospital_groups', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: varchar('name', { length: 255 }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type HospitalGroup = typeof hospitalGroups.$inferSelect;
export type NewHospitalGroup = typeof hospitalGroups.$inferInsert;
