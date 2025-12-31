import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	boolean,
	text,
	jsonb,
	index
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { hospitals } from './hospitals';

// 操作種別
export const auditActionEnum = [
	'care_plan.create',
	'care_plan.update',
	'care_plan.view',
	'care_plan.delete',
	'care_plan.pdf',
	'care_plan.sign',
	'patient.create',
	'patient.update',
	'patient.view',
	'patient.delete',
	'auth.login',
	'auth.logout',
	'user.create',
	'user.update',
	'hospital.create',
	'hospital.update'
] as const;
export type AuditAction = (typeof auditActionEnum)[number];

// 対象リソース種別
export const targetTypeEnum = [
	'care_plan',
	'patient',
	'user',
	'hospital',
	'session'
] as const;
export type TargetType = (typeof targetTypeEnum)[number];

// 変更内容の型
export interface AuditChanges {
	[fieldName: string]: {
		before: unknown;
		after: unknown;
	};
}

// メタデータの型
export interface AuditMetadata {
	[key: string]: unknown;
}

export const auditLogs = pgTable(
	'audit_logs',
	{
		id: uuid('id').primaryKey().defaultRandom(),

		// 操作者
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id),
		userName: varchar('user_name', { length: 100 }).notNull(),

		// 病院コンテキスト
		hospitalId: uuid('hospital_id').references(() => hospitals.id),
		hospitalName: varchar('hospital_name', { length: 200 }),

		// 操作内容
		action: varchar('action', { length: 50 }).notNull().$type<AuditAction>(),
		targetType: varchar('target_type', { length: 50 }).notNull().$type<TargetType>(),
		targetId: uuid('target_id'),
		targetName: varchar('target_name', { length: 200 }),

		// 変更内容
		changes: jsonb('changes').$type<AuditChanges>(),
		metadata: jsonb('metadata').$type<AuditMetadata>(),

		// クライアント情報
		ipAddress: varchar('ip_address', { length: 45 }),
		userAgent: text('user_agent'),

		// 結果
		success: boolean('success').notNull().default(true),
		errorMessage: text('error_message'),

		// タイムスタンプ
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('audit_logs_user_id_idx').on(table.userId),
		index('audit_logs_hospital_id_idx').on(table.hospitalId),
		index('audit_logs_target_idx').on(table.targetType, table.targetId),
		index('audit_logs_action_idx').on(table.action),
		index('audit_logs_created_at_idx').on(table.createdAt)
	]
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
