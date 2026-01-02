import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getAuditLogs,
	actionLabels,
	targetTypeLabels
} from '$lib/server/services/audit-service';
import type { AuditAction, TargetType } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { users, hospitalMemberships } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ parent, url }) => {
	const parentData = await parent();

	// 病院管理者のみアクセス可能
	if (!parentData.isHospitalAdmin) {
		throw error(403, 'この機能は病院管理者のみアクセス可能です');
	}

	const hospitalId = parentData.hospital.id;

	// フィルターパラメータ
	const userId = url.searchParams.get('userId') || undefined;
	const action = url.searchParams.get('action') as AuditAction | undefined;
	const targetType = url.searchParams.get('targetType') as TargetType | undefined;
	const dateFrom = url.searchParams.get('dateFrom') || undefined;
	const dateTo = url.searchParams.get('dateTo') || undefined;
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const limit = 50;
	const offset = (page - 1) * limit;

	// 監査ログ取得（この病院のログのみ）
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

	// この病院のユーザー一覧（フィルター用）
	const memberships = await db
		.select({
			userId: hospitalMemberships.userId
		})
		.from(hospitalMemberships)
		.where(eq(hospitalMemberships.hospitalId, hospitalId));

	const memberUserIds = memberships.map((m) => m.userId);

	const userList = memberUserIds.length > 0
		? await db
				.select({ id: users.id, name: users.name, email: users.email })
				.from(users)
				.where(
					memberUserIds.length === 1
						? eq(users.id, memberUserIds[0])
						: undefined
				)
		: [];

	// memberUserIdsが複数の場合はフィルタリング
	const filteredUserList = userList.filter((u) => memberUserIds.includes(u.id));

	const totalPages = Math.ceil(total / limit);

	return {
		logs,
		total,
		page,
		totalPages,
		filters: {
			userId,
			action,
			targetType,
			dateFrom,
			dateTo
		},
		userList: filteredUserList,
		actionLabels,
		targetTypeLabels
	};
};
