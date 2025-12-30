import { db } from '$lib/server/db';
import { users, hospitalMemberships, invitations, type User } from '$lib/server/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';
import type { KeycloakUserInfo } from './keycloak';

export async function findOrCreateUser(userInfo: KeycloakUserInfo): Promise<User> {
	// First, try to find by Keycloak ID
	const existingByKeycloakId = await db
		.select()
		.from(users)
		.where(eq(users.keycloakId, userInfo.sub))
		.limit(1);

	if (existingByKeycloakId.length > 0) {
		return existingByKeycloakId[0];
	}

	// Try to find by email (for linking existing users)
	const existingByEmail = await db
		.select()
		.from(users)
		.where(eq(users.email, userInfo.email))
		.limit(1);

	if (existingByEmail.length > 0) {
		// Link existing user to Keycloak
		const [updated] = await db
			.update(users)
			.set({
				keycloakId: userInfo.sub,
				name: userInfo.name || existingByEmail[0].name,
				updatedAt: new Date()
			})
			.where(eq(users.id, existingByEmail[0].id))
			.returning();

		return updated;
	}

	// Create new user
	const [created] = await db
		.insert(users)
		.values({
			keycloakId: userInfo.sub,
			email: userInfo.email,
			name: userInfo.name || userInfo.preferred_username || userInfo.email.split('@')[0],
			isServiceAdmin: false
		})
		.returning();

	return created;
}

export async function acceptPendingInvitation(
	userId: string,
	email: string,
	invitationToken?: string
): Promise<{ hospitalId: string; role: 'hospital_admin' | 'hospital_user' } | null> {
	// If invitation token is provided, use it
	if (invitationToken) {
		const [invitation] = await db
			.select()
			.from(invitations)
			.where(
				and(
					eq(invitations.token, invitationToken),
					isNull(invitations.acceptedAt),
					gt(invitations.expiresAt, new Date())
				)
			)
			.limit(1);

		if (invitation) {
			// Accept the invitation
			await db
				.update(invitations)
				.set({ acceptedAt: new Date() })
				.where(eq(invitations.id, invitation.id));

			// Create membership
			await db
				.insert(hospitalMemberships)
				.values({
					userId,
					hospitalId: invitation.hospitalId,
					role: invitation.role
				})
				.onConflictDoNothing();

			return {
				hospitalId: invitation.hospitalId,
				role: invitation.role
			};
		}
	}

	// Check for any pending invitation by email
	const [pendingInvitation] = await db
		.select()
		.from(invitations)
		.where(
			and(
				eq(invitations.email, email),
				isNull(invitations.acceptedAt),
				gt(invitations.expiresAt, new Date())
			)
		)
		.limit(1);

	if (pendingInvitation) {
		// Accept the invitation
		await db
			.update(invitations)
			.set({ acceptedAt: new Date() })
			.where(eq(invitations.id, pendingInvitation.id));

		// Create membership
		await db
			.insert(hospitalMemberships)
			.values({
				userId,
				hospitalId: pendingInvitation.hospitalId,
				role: pendingInvitation.role
			})
			.onConflictDoNothing();

		return {
			hospitalId: pendingInvitation.hospitalId,
			role: pendingInvitation.role
		};
	}

	return null;
}

export async function getUserHospitals(userId: string) {
	return await db
		.select({
			membership: hospitalMemberships,
			hospital: {
				id: users.id,
				name: users.name
			}
		})
		.from(hospitalMemberships)
		.innerJoin(users, eq(hospitalMemberships.userId, users.id))
		.where(eq(hospitalMemberships.userId, userId));
}
