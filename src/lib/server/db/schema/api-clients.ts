import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';
import { hospitals } from './hospitals';

export const apiClients = pgTable('api_clients', {
	id: uuid('id').primaryKey().defaultRandom(),
	hospitalId: uuid('hospital_id').references(() => hospitals.id, { onDelete: 'cascade' }),
	keycloakClientId: varchar('keycloak_client_id', { length: 255 }).notNull().unique(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),
	isEnabled: boolean('is_enabled').notNull().default(true),
	createdBy: uuid('created_by')
		.notNull()
		.references(() => users.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type ApiClient = typeof apiClients.$inferSelect;
export type NewApiClient = typeof apiClients.$inferInsert;
