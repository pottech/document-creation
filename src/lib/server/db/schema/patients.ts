import { pgTable, uuid, varchar, timestamp, date, uniqueIndex } from 'drizzle-orm/pg-core';
import { hospitals } from './hospitals';

// 性別
export const genderEnum = ['male', 'female'] as const;
export type Gender = (typeof genderEnum)[number];

export const patients = pgTable(
	'patients',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		hospitalId: uuid('hospital_id')
			.notNull()
			.references(() => hospitals.id),
		patientNumber: varchar('patient_number', { length: 50 }).notNull(),
		name: varchar('name', { length: 100 }).notNull(),
		nameKana: varchar('name_kana', { length: 100 }),
		birthDate: date('birth_date').notNull(),
		gender: varchar('gender', { length: 10 }).notNull().$type<Gender>(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [uniqueIndex('patients_hospital_patient_number_idx').on(table.hospitalId, table.patientNumber)]
);

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
