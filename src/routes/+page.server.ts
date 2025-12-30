import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hospitalMemberships, hospitals } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Not logged in - redirect to login
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Service admin - redirect to admin panel
	if (locals.user.isServiceAdmin) {
		throw redirect(303, '/admin');
	}

	// Get user's first hospital membership
	const memberships = await db
		.select({
			hospitalId: hospitalMemberships.hospitalId,
			hospitalSlug: hospitals.slug
		})
		.from(hospitalMemberships)
		.innerJoin(hospitals, eq(hospitals.id, hospitalMemberships.hospitalId))
		.where(eq(hospitalMemberships.userId, locals.user.id))
		.limit(1);

	if (memberships.length > 0) {
		throw redirect(303, `/${memberships[0].hospitalSlug}`);
	}

	// No hospital membership
	throw redirect(303, '/no-hospital');
};
