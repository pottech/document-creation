import type { Handle } from '@sveltejs/kit';
import { getSession } from '$lib/server/auth/session';

const SESSION_COOKIE_NAME = 'session';

export const handle: Handle = async ({ event, resolve }) => {
	// Initialize locals
	event.locals.user = null;
	event.locals.hospital = null;
	event.locals.membership = null;
	event.locals.sessionId = null;

	// Get session from cookie
	const sessionId = event.cookies.get(SESSION_COOKIE_NAME);

	if (sessionId) {
		const sessionData = await getSession(sessionId);

		if (sessionData) {
			event.locals.user = sessionData.user;
			event.locals.hospital = sessionData.hospital;
			event.locals.membership = sessionData.membership;
			event.locals.sessionId = sessionId;
		} else {
			// Invalid session, clear cookie
			event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		}
	}

	return resolve(event);
};
