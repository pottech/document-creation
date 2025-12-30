import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hospitals, hospitalMemberships } from '$lib/server/db/schema';
import { createInvitation } from '$lib/server/auth/invitation';
import { eq, and } from 'drizzle-orm';
import { ORIGIN } from '$env/static/private';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const parentData = await parent();

	// Only hospital admins can access this page
	if (!parentData.isHospitalAdmin) {
		throw error(403, 'この機能へのアクセス権限がありません');
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		if (!locals.user) {
			throw error(401, '認証が必要です');
		}

		// Get hospital
		const [hospital] = await db
			.select()
			.from(hospitals)
			.where(eq(hospitals.slug, params.hospitalSlug))
			.limit(1);

		if (!hospital) {
			throw error(404, '病院が見つかりません');
		}

		// Check if user is hospital admin
		const [membership] = await db
			.select()
			.from(hospitalMemberships)
			.where(
				and(
					eq(hospitalMemberships.hospitalId, hospital.id),
					eq(hospitalMemberships.userId, locals.user.id)
				)
			)
			.limit(1);

		const isHospitalAdmin = membership?.role === 'hospital_admin' || locals.user.isServiceAdmin;

		if (!isHospitalAdmin) {
			throw error(403, 'この機能へのアクセス権限がありません');
		}

		const formData = await request.formData();
		const email = formData.get('email') as string;
		const role = formData.get('role') as 'hospital_admin' | 'hospital_user';

		const values = { email, role };

		if (!email || !role) {
			return fail(400, {
				error: 'すべての項目を入力してください',
				values
			});
		}

		const invitation = await createInvitation({
			email,
			hospitalId: hospital.id,
			role,
			invitedBy: locals.user.id
		});

		// TODO: Send invitation email
		const inviteUrl = `${ORIGIN}/invite/${invitation.token}`;
		console.log(`Invitation URL for ${email}: ${inviteUrl}`);

		return { success: true };
	}
};
