import { db } from '$lib/server/db';
import { invitations, hospitals, users, type Invitation } from '$lib/server/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';

const INVITATION_EXPIRY_DAYS = 7;

export function generateInvitationToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface CreateInvitationParams {
	email: string;
	hospitalId: string;
	role: 'hospital_admin' | 'hospital_user';
	invitedBy: string;
}

export async function createInvitation(params: CreateInvitationParams): Promise<Invitation> {
	const token = generateInvitationToken();
	const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

	const [invitation] = await db
		.insert(invitations)
		.values({
			email: params.email,
			hospitalId: params.hospitalId,
			role: params.role,
			invitedBy: params.invitedBy,
			token,
			expiresAt
		})
		.returning();

	return invitation;
}

export async function getInvitationByToken(token: string) {
	const result = await db
		.select({
			invitation: invitations,
			hospital: hospitals,
			invitedByUser: users
		})
		.from(invitations)
		.innerJoin(hospitals, eq(invitations.hospitalId, hospitals.id))
		.innerJoin(users, eq(invitations.invitedBy, users.id))
		.where(
			and(
				eq(invitations.token, token),
				isNull(invitations.acceptedAt),
				gt(invitations.expiresAt, new Date())
			)
		)
		.limit(1);

	if (result.length === 0) {
		return null;
	}

	return result[0];
}

export async function getHospitalInvitations(hospitalId: string) {
	return await db
		.select({
			invitation: invitations,
			invitedByUser: users
		})
		.from(invitations)
		.innerJoin(users, eq(invitations.invitedBy, users.id))
		.where(eq(invitations.hospitalId, hospitalId))
		.orderBy(invitations.createdAt);
}

export async function cancelInvitation(invitationId: string): Promise<void> {
	await db.delete(invitations).where(eq(invitations.id, invitationId));
}
