import type { PageServerLoad } from './$types';
import {
	getAuditLogs,
	actionLabels,
	targetTypeLabels
} from '$lib/server/services/audit-service';
import type { AuditAction, TargetType } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { hospitals, users } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ url }) => {
	// フィルターパラメータ
	const hospitalId = url.searchParams.get('hospitalId') || undefined;
	const userId = url.searchParams.get('userId') || undefined;
	const action = url.searchParams.get('action') as AuditAction | undefined;
	const targetType = url.searchParams.get('targetType') as TargetType | undefined;
	const dateFrom = url.searchParams.get('dateFrom') || undefined;
	const dateTo = url.searchParams.get('dateTo') || undefined;
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const limit = 50;
	const offset = (page - 1) * limit;

	// 監査ログ取得
	const { logs, total } = await getAuditLogs({
		hospitalId,
		userId,
		action,
		targetType,
		dateFrom,
		dateTo,
		limit,
		offset
	});

	// 病院一覧（フィルター用）
	const hospitalList = await db.select({ id: hospitals.id, name: hospitals.name }).from(hospitals);

	// ユーザー一覧（フィルター用）
	const userList = await db.select({ id: users.id, name: users.name, email: users.email }).from(users);

	const totalPages = Math.ceil(total / limit);

	return {
		logs,
		total,
		page,
		totalPages,
		filters: {
			hospitalId,
			userId,
			action,
			targetType,
			dateFrom,
			dateTo
		},
		hospitalList,
		userList,
		actionLabels,
		targetTypeLabels
	};
};
