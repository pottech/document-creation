import { redirect, error } from '@sveltejs/kit';
import { keycloak } from '$lib/server/auth/keycloak';
import { getInvitationByToken } from '$lib/server/auth/invitation';
import { generateState, generateCodeVerifier } from 'arctic';
import { dev } from '$app/environment';
import type { Actions, PageServerLoad } from './$types';

const STATE_COOKIE = 'oauth_state';
const VERIFIER_COOKIE = 'oauth_verifier';
const INVITATION_COOKIE = 'invitation_token';

export const load: PageServerLoad = async ({ params, locals }) => {
	const invitation = await getInvitationByToken(params.token);

	if (!invitation) {
		throw error(404, {
			message: '招待が見つからないか、有効期限が切れています'
		});
	}

	// If user is already logged in, they can directly accept
	if (locals.user) {
		return {
			invitation: {
				email: invitation.invitation.email,
				hospitalName: invitation.hospital.name,
				role: invitation.invitation.role,
				invitedBy: invitation.invitedByUser.name
			},
			isLoggedIn: true
		};
	}

	return {
		invitation: {
			email: invitation.invitation.email,
			hospitalName: invitation.hospital.name,
			role: invitation.invitation.role,
			invitedBy: invitation.invitedByUser.name
		},
		isLoggedIn: false
	};
};

export const actions: Actions = {
	accept: async ({ params, cookies }) => {
		const state = generateState();
		const codeVerifier = generateCodeVerifier();

		const url = keycloak.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);

		// Store state, verifier, and invitation token in cookies
		cookies.set(STATE_COOKIE, state, {
			path: '/',
			httpOnly: true,
			secure: !dev,
			maxAge: 60 * 10,
			sameSite: 'lax'
		});

		cookies.set(VERIFIER_COOKIE, codeVerifier, {
			path: '/',
			httpOnly: true,
			secure: !dev,
			maxAge: 60 * 10,
			sameSite: 'lax'
		});

		// Store invitation token so we can process it after OAuth callback
		cookies.set(INVITATION_COOKIE, params.token, {
			path: '/',
			httpOnly: true,
			secure: !dev,
			maxAge: 60 * 10,
			sameSite: 'lax'
		});

		throw redirect(303, url.toString());
	}
};
