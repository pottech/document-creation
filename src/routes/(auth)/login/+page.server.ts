import { redirect } from '@sveltejs/kit';
import { keycloak } from '$lib/server/auth/keycloak';
import { generateState, generateCodeVerifier } from 'arctic';
import { dev } from '$app/environment';
import type { Actions, PageServerLoad } from './$types';

const STATE_COOKIE = 'oauth_state';
const VERIFIER_COOKIE = 'oauth_verifier';

export const load: PageServerLoad = async ({ locals }) => {
	// If already logged in, redirect to appropriate page
	if (locals.user) {
		if (locals.user.isServiceAdmin) {
			throw redirect(303, '/admin');
		}
		throw redirect(303, '/');
	}

	return {};
};

export const actions: Actions = {
	default: async ({ cookies }) => {
		const state = generateState();
		const codeVerifier = generateCodeVerifier();

		const url = keycloak.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);

		// Store state and verifier in cookies for validation
		cookies.set(STATE_COOKIE, state, {
			path: '/',
			httpOnly: true,
			secure: !dev,
			maxAge: 60 * 10, // 10 minutes
			sameSite: 'lax'
		});

		cookies.set(VERIFIER_COOKIE, codeVerifier, {
			path: '/',
			httpOnly: true,
			secure: !dev,
			maxAge: 60 * 10,
			sameSite: 'lax'
		});

		throw redirect(303, url.toString());
	}
};
