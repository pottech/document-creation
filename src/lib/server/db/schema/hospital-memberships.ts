import { pgTable, uuid, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { hospitals } from './hospitals';

export const hospitalRoleEnum = pgEnum('hospital_role', ['hospital_admin', 'hospital_user']);

export const hospitalMemberships = pgTable(
	'hospital_memberships',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		hospitalId: uuid('hospital_id')
			.notNull()
			.references(() => hospitals.id, { onDelete: 'cascade' }),
		role: hospitalRoleEnum('role').notNull().default('hospital_user'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [unique().on(table.userId, table.hospitalId)]
);

export type HospitalMembership = typeof hospitalMemberships.$inferSelect;
export type NewHospitalMembership = typeof hospitalMemberships.$inferInsert;
