import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { hospitalMemberships, hospitals } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	if (!locals.user.isServiceAdmin) {
		throw redirect(303, '/');
	}

	// ユーザーの所属病院を取得
	const userHospitals = await db
		.select({
			hospitalId: hospitals.id,
			hospitalName: hospitals.name,
			hospitalSlug: hospitals.slug,
			role: hospitalMemberships.role
		})
		.from(hospitalMemberships)
		.innerJoin(hospitals, eq(hospitals.id, hospitalMemberships.hospitalId))
		.where(eq(hospitalMemberships.userId, locals.user.id))
		.orderBy(hospitals.name);

	return {
		user: locals.user,
		userHospitals
	};
};
