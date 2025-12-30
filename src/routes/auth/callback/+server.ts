import { redirect, error, isRedirect } from '@sveltejs/kit';
import { keycloak, getKeycloakUserInfo } from '$lib/server/auth/keycloak';
import { createSession } from '$lib/server/auth/session';
import { findOrCreateUser, acceptPendingInvitation } from '$lib/server/auth/user-sync';
import { db } from '$lib/server/db';
import { hospitalMemberships, hospitals } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';

const STATE_COOKIE = 'oauth_state';
const VERIFIER_COOKIE = 'oauth_verifier';
const INVITATION_COOKIE = 'invitation_token';
const SESSION_COOKIE = 'session';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get(STATE_COOKIE);
	const codeVerifier = cookies.get(VERIFIER_COOKIE);
	const invitationToken = cookies.get(INVITATION_COOKIE);

	// Clear OAuth cookies
	cookies.delete(STATE_COOKIE, { path: '/' });
	cookies.delete(VERIFIER_COOKIE, { path: '/' });
	cookies.delete(INVITATION_COOKIE, { path: '/' });

	// Validate state
	if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
		throw error(400, 'Invalid OAuth callback');
	}

	try {
		// Exchange code for tokens
		const tokens = await keycloak.validateAuthorizationCode(code, codeVerifier);

		// Get user info from Keycloak
		const userInfo = await getKeycloakUserInfo(tokens.accessToken());

		// Find or create user in database
		const user = await findOrCreateUser(userInfo);

		// Check for pending invitation
		const acceptedInvitation = await acceptPendingInvitation(
			user.id,
			userInfo.email,
			invitationToken
		);

		// Determine initial hospital context
		let initialHospitalId: string | undefined;

		if (acceptedInvitation) {
			initialHospitalId = acceptedInvitation.hospitalId;
		} else if (!user.isServiceAdmin) {
			// Get user's first hospital if they have one
			const memberships = await db
				.select({ hospitalId: hospitalMemberships.hospitalId })
				.from(hospitalMemberships)
				.where(eq(hospitalMemberships.userId, user.id))
				.limit(1);

			if (memberships.length > 0) {
				initialHospitalId = memberships[0].hospitalId;
			}
		}

		// Create session
		const sessionId = await createSession(
			user.id,
			tokens.accessToken(),
			tokens.refreshToken() ?? null,
			tokens.accessTokenExpiresAt(),
			initialHospitalId
		);

		// Set session cookie
		cookies.set(SESSION_COOKIE, sessionId, {
			path: '/',
			httpOnly: true,
			secure: !dev,
			maxAge: 60 * 60 * 24, // 24 hours
			sameSite: 'lax'
		});

		// Redirect based on user type and context
		if (user.isServiceAdmin) {
			throw redirect(303, '/admin');
		}

		if (initialHospitalId) {
			// Get hospital slug for redirect
			const [hospital] = await db
				.select({ slug: hospitals.slug })
				.from(hospitals)
				.where(eq(hospitals.id, initialHospitalId))
				.limit(1);

			if (hospital) {
				throw redirect(303, `/${hospital.slug}`);
			}
		}

		// No hospital membership, redirect to a page that shows they need to be invited
		throw redirect(303, '/no-hospital');
	} catch (err) {
		// Re-throw redirects (SvelteKit 2.x uses Redirect class, not Response)
		if (isRedirect(err)) {
			throw err;
		}
		console.error('OAuth callback error:', err);
		throw error(500, 'Authentication failed');
	}
};
