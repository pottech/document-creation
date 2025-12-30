import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hospitals, hospitalMemberships, invitations, users } from '$lib/server/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
	const parentData = await parent();

	// Only hospital admins can access this page
	if (!parentData.isHospitalAdmin) {
		throw error(403, 'この機能へのアクセス権限がありません');
	}

	const [hospital] = await db
		.select()
		.from(hospitals)
		.where(eq(hospitals.slug, params.hospitalSlug))
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
			expiresAt: invitations.expiresAt
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
		members,
		invitations: pendingInvitations
	};
};
