import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { hospitals } from './hospitals';
import { hospitalRoleEnum } from './hospital-memberships';

export const invitations = pgTable('invitations', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: varchar('email', { length: 255 }).notNull(),
	hospitalId: uuid('hospital_id')
		.notNull()
		.references(() => hospitals.id, { onDelete: 'cascade' }),
	role: hospitalRoleEnum('role').notNull().default('hospital_user'),
	invitedBy: uuid('invited_by')
		.notNull()
		.references(() => users.id),
	token: varchar('token', { length: 64 }).notNull().unique(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	acceptedAt: timestamp('accepted_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
