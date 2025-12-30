import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hospitals, hospitalMemberships } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { updateSessionHospital } from '$lib/server/auth/session';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, locals, cookies }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Find hospital by slug
	const [hospital] = await db
		.select()
		.from(hospitals)
		.where(eq(hospitals.slug, params.hospitalSlug))
		.limit(1);

	if (!hospital) {
		throw error(404, '病院が見つかりません');
	}

	// Check if user is a member of this hospital
	const [membership] = await db
		.select()
		.from(hospitalMemberships)
		.where(
			and(eq(hospitalMemberships.hospitalId, hospital.id), eq(hospitalMemberships.userId, locals.user.id))
		)
		.limit(1);

	// Service admins can access any hospital
	if (!membership && !locals.user.isServiceAdmin) {
		throw error(403, 'この病院へのアクセス権限がありません');
	}

	// Update session with current hospital context if different
	if (locals.sessionId && locals.hospital?.id !== hospital.id) {
		await updateSessionHospital(locals.sessionId, hospital.id);
	}

	return {
		hospital,
		membership: membership ?? null,
		isHospitalAdmin: membership?.role === 'hospital_admin' || locals.user.isServiceAdmin
	};
};
