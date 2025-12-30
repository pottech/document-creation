import { db } from '$lib/server/db';
import { sessions, users, hospitals, hospitalMemberships } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { keycloak } from './keycloak';
import type { User, Hospital, HospitalMembership } from '$lib/server/db/schema';

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes before expiry

export function generateSessionId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface SessionData {
	user: User;
	hospital: Hospital | null;
	membership: HospitalMembership | null;
	accessToken: string;
}

export async function createSession(
	userId: string,
	accessToken: string,
	refreshToken: string | null,
	accessTokenExpiresAt: Date,
	currentHospitalId?: string
): Promise<string> {
	const sessionId = generateSessionId();
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

	await db.insert(sessions).values({
		id: sessionId,
		userId,
		accessToken,
		refreshToken,
		accessTokenExpiresAt,
		currentHospitalId: currentHospitalId ?? null,
		expiresAt
	});

	return sessionId;
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
	const result = await db
		.select({
			session: sessions,
			user: users
		})
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
		.limit(1);

	if (result.length === 0) {
		return null;
	}

	const { session, user } = result[0];

	// Check if access token needs refresh
	const now = new Date();
	const tokenExpiresAt = new Date(session.accessTokenExpiresAt);

	let accessToken = session.accessToken;

	if (tokenExpiresAt.getTime() - now.getTime() < TOKEN_REFRESH_THRESHOLD_MS) {
		// Token is about to expire, try to refresh
		if (session.refreshToken) {
			try {
				const tokens = await keycloak.refreshAccessToken(session.refreshToken);

				await db
					.update(sessions)
					.set({
						accessToken: tokens.accessToken(),
						refreshToken: tokens.refreshToken() ?? session.refreshToken,
						accessTokenExpiresAt: tokens.accessTokenExpiresAt()
					})
					.where(eq(sessions.id, sessionId));

				accessToken = tokens.accessToken();
			} catch {
				// Refresh failed, session is invalid
				await deleteSession(sessionId);
				return null;
			}
		}
	}

	// Get current hospital and membership if set
	let hospital: Hospital | null = null;
	let membership: HospitalMembership | null = null;

	if (session.currentHospitalId) {
		const hospitalResult = await db
			.select({
				hospital: hospitals,
				membership: hospitalMemberships
			})
			.from(hospitals)
			.leftJoin(
				hospitalMemberships,
				and(
					eq(hospitalMemberships.hospitalId, hospitals.id),
					eq(hospitalMemberships.userId, user.id)
				)
			)
			.where(eq(hospitals.id, session.currentHospitalId))
			.limit(1);

		if (hospitalResult.length > 0) {
			hospital = hospitalResult[0].hospital;
			membership = hospitalResult[0].membership;
		}
	}

	return {
		user,
		hospital,
		membership,
		accessToken
	};
}

export async function updateSessionHospital(
	sessionId: string,
	hospitalId: string | null
): Promise<void> {
	await db.update(sessions).set({ currentHospitalId: hospitalId }).where(eq(sessions.id, sessionId));
}

export async function deleteSession(sessionId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function deleteUserSessions(userId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.userId, userId));
}
