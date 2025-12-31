import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hospitals } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import {
	getCarePlansByDate,
	getCarePlanStats,
	getMonthlyCarePlanCounts
} from '$lib/server/repositories/care-plans';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent, url }) => {
	const parentData = await parent();

	const [hospital] = await db
		.select()
		.from(hospitals)
		.where(eq(hospitals.slug, params.hospitalSlug))
		.limit(1);

	if (!hospital) {
		throw error(404, '病院が見つかりません');
	}

	// 日付パラメータ（デフォルトは今日）
	const today = new Date().toISOString().split('T')[0];
	const selectedDate = url.searchParams.get('date') || today;

	// 選択された日付の計画書一覧
	const carePlans = await getCarePlansByDate(hospital.id, selectedDate);

	// 月のカレンダーデータ
	const [year, month] = selectedDate.split('-').map(Number);
	const monthlyData = await getMonthlyCarePlanCounts(hospital.id, year, month);

	// 統計情報
	const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
	const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0];
	const stats = await getCarePlanStats(hospital.id, startOfMonth, endOfMonth);

	return {
		selectedDate,
		carePlans,
		monthlyData,
		stats,
		year,
		month
	};
};
