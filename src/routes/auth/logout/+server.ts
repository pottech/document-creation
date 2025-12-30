import { redirect } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/auth/session';
import { getKeycloakLogoutUrl } from '$lib/server/auth/keycloak';
import { ORIGIN } from '$env/static/private';
import type { RequestHandler } from './$types';

const SESSION_COOKIE = 'session';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	if (locals.sessionId) {
		await deleteSession(locals.sessionId);
	}

	cookies.delete(SESSION_COOKIE, { path: '/' });

	// Redirect to Keycloak logout for full SSO logout
	const logoutUrl = getKeycloakLogoutUrl(ORIGIN);

	throw redirect(303, logoutUrl);
};
