import { db } from '$lib/server/db';
import {
	auditLogs,
	type AuditAction,
	type TargetType,
	type AuditChanges,
	type AuditMetadata,
	type AuditLog
} from '$lib/server/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

/**
 * 監査ログ記録パラメータ
 */
export interface LogAuditParams {
	// 操作者（必須）
	userId: string;
	userName: string;

	// 病院コンテキスト（オプション）
	hospitalId?: string;
	hospitalName?: string;

	// 操作内容（必須）
	action: AuditAction;
	targetType: TargetType;

	// 対象（オプション）
	targetId?: string;
	targetName?: string;

	// 変更内容（オプション）
	changes?: AuditChanges;
	metadata?: AuditMetadata;

	// クライアント情報（オプション）
	ipAddress?: string;
	userAgent?: string;

	// 結果（オプション、デフォルトは成功）
	success?: boolean;
	errorMessage?: string;
}

/**
 * 監査ログを記録
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
	try {
		await db.insert(auditLogs).values({
			userId: params.userId,
			userName: params.userName,
			hospitalId: params.hospitalId || null,
			hospitalName: params.hospitalName || null,
			action: params.action,
			targetType: params.targetType,
			targetId: params.targetId || null,
			targetName: params.targetName || null,
			changes: params.changes || null,
			metadata: params.metadata || null,
			ipAddress: params.ipAddress || null,
			userAgent: params.userAgent || null,
			success: params.success ?? true,
			errorMessage: params.errorMessage || null
		});
	} catch (error) {
		// 監査ログの記録失敗はシステムに影響を与えないようにする
		// ただし、エラーはログに出力
		console.error('Failed to write audit log:', error);
		console.error('Audit params:', JSON.stringify(params, null, 2));
	}
}

/**
 * 監査ログフィルター
 */
export interface AuditLogFilters {
	hospitalId?: string;
	userId?: string;
	action?: AuditAction;
	targetType?: TargetType;
	targetId?: string;
	dateFrom?: string;
	dateTo?: string;
	success?: boolean;
	limit?: number;
	offset?: number;
}

/**
 * 監査ログ一覧取得結果
 */
export interface AuditLogResult {
	logs: AuditLog[];
	total: number;
}

/**
 * 監査ログ一覧を取得
 */
export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogResult> {
	const { hospitalId, userId, action, targetType, targetId, dateFrom, dateTo, success, limit = 50, offset = 0 } = filters;

	const conditions = [];

	if (hospitalId) {
		conditions.push(eq(auditLogs.hospitalId, hospitalId));
	}
	if (userId) {
		conditions.push(eq(auditLogs.userId, userId));
	}
	if (action) {
		conditions.push(eq(auditLogs.action, action));
	}
	if (targetType) {
		conditions.push(eq(auditLogs.targetType, targetType));
	}
	if (targetId) {
		conditions.push(eq(auditLogs.targetId, targetId));
	}
	if (dateFrom) {
		conditions.push(gte(auditLogs.createdAt, new Date(dateFrom)));
	}
	if (dateTo) {
		conditions.push(lte(auditLogs.createdAt, new Date(dateTo + 'T23:59:59.999Z')));
	}
	if (success !== undefined) {
		conditions.push(eq(auditLogs.success, success));
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const [logs, countResult] = await Promise.all([
		db
			.select()
			.from(auditLogs)
			.where(whereClause)
			.orderBy(desc(auditLogs.createdAt))
			.limit(limit)
			.offset(offset),
		db
			.select({ count: sql<number>`count(*)` })
			.from(auditLogs)
			.where(whereClause)
	]);

	return {
		logs,
		total: Number(countResult[0]?.count ?? 0)
	};
}

/**
 * 特定のリソースの監査ログを取得
 */
export async function getAuditLogsForTarget(
	targetType: TargetType,
	targetId: string,
	limit = 50
): Promise<AuditLog[]> {
	return db
		.select()
		.from(auditLogs)
		.where(and(eq(auditLogs.targetType, targetType), eq(auditLogs.targetId, targetId)))
		.orderBy(desc(auditLogs.createdAt))
		.limit(limit);
}

/**
 * ユーザーの監査ログを取得
 */
export async function getAuditLogsForUser(userId: string, limit = 50): Promise<AuditLog[]> {
	return db
		.select()
		.from(auditLogs)
		.where(eq(auditLogs.userId, userId))
		.orderBy(desc(auditLogs.createdAt))
		.limit(limit);
}

/**
 * オブジェクトの変更差分を計算
 */
export function calculateChanges<T extends Record<string, unknown>>(
	before: T,
	after: T,
	fieldsToTrack: (keyof T)[]
): AuditChanges | null {
	const changes: AuditChanges = {};
	let hasChanges = false;

	for (const field of fieldsToTrack) {
		const beforeValue = before[field];
		const afterValue = after[field];

		// JSONで比較（オブジェクトや配列も対応）
		if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
			changes[field as string] = {
				before: beforeValue,
				after: afterValue
			};
			hasChanges = true;
		}
	}

	return hasChanges ? changes : null;
}

/**
 * 操作種別の日本語ラベル
 */
export const actionLabels: Record<AuditAction, string> = {
	'care_plan.create': '療養計画書作成',
	'care_plan.update': '療養計画書編集',
	'care_plan.view': '療養計画書閲覧',
	'care_plan.delete': '療養計画書削除',
	'care_plan.pdf': 'PDF出力',
	'care_plan.sign': '署名',
	'patient.create': '患者登録',
	'patient.update': '患者情報編集',
	'patient.view': '患者情報閲覧',
	'patient.delete': '患者削除',
	'auth.login': 'ログイン',
	'auth.logout': 'ログアウト',
	'user.create': 'ユーザー作成',
	'user.update': 'ユーザー編集',
	'hospital.create': '病院作成',
	'hospital.update': '病院編集'
};

/**
 * 対象種別の日本語ラベル
 */
export const targetTypeLabels: Record<TargetType, string> = {
	care_plan: '療養計画書',
	patient: '患者',
	user: 'ユーザー',
	hospital: '病院',
	session: 'セッション'
};
