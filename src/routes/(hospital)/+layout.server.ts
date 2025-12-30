import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Service admins should go to admin panel
	if (locals.user.isServiceAdmin && !locals.hospital) {
		throw redirect(303, '/admin');
	}

	return {
		user: locals.user
	};
};
