import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hospitals, hospitalMemberships, invitations, users } from '$lib/server/db/schema';
import { createInvitation } from '$lib/server/auth/invitation';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { ORIGIN } from '$env/static/private';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [hospital] = await db
		.select()
		.from(hospitals)
		.where(eq(hospitals.id, params.id))
		.limit(1);

	if (!hospital) {
		throw error(404, '病院が見つかりません');
	}

	// Get members
	const members = await db
		.select({
			id: hospitalMemberships.id,
			role: hospitalMemberships.role,
			createdAt: hospitalMemberships.createdAt,
			user: {
				id: users.id,
				name: users.name,
				email: users.email
			}
		})
		.from(hospitalMemberships)
		.innerJoin(users, eq(hospitalMemberships.userId, users.id))
		.where(eq(hospitalMemberships.hospitalId, hospital.id));

	// Get pending invitations
	const pendingInvitations = await db
		.select({
			id: invitations.id,
			email: invitations.email,
			role: invitations.role,
			expiresAt: invitations.expiresAt,
			createdAt: invitations.createdAt
		})
		.from(invitations)
		.where(
			and(
				eq(invitations.hospitalId, hospital.id),
				isNull(invitations.acceptedAt),
				gt(invitations.expiresAt, new Date())
			)
		);

	return {
		hospital,
		members,
		invitations: pendingInvitations
	};
};

export const actions: Actions = {
	invite: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		if (!email) {
			return fail(400, { error: 'メールアドレスを入力してください' });
		}

		const invitation = await createInvitation({
			email,
			hospitalId: params.id,
			role: 'hospital_admin',
			invitedBy: locals.user!.id
		});

		// TODO: Send invitation email
		const inviteUrl = `${ORIGIN}/invite/${invitation.token}`;
		console.log(`Invitation URL for ${email}: ${inviteUrl}`);

		return { success: true };
	}
};
