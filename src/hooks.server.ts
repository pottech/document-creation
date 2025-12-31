import { json, type Handle } from '@sveltejs/kit';
import { getSession } from '$lib/server/auth/session';
import {
	validateBearerToken,
	getApiClientFromToken,
	extractBearerToken
} from '$lib/server/auth/api-auth';

const SESSION_COOKIE_NAME = 'session';

export const handle: Handle = async ({ event, resolve }) => {
	// Initialize locals
	event.locals.user = null;
	event.locals.hospital = null;
	event.locals.membership = null;
	event.locals.sessionId = null;
	event.locals.apiClient = null;

	const pathname = event.url.pathname;

	// Handle API v1 routes with Bearer token authentication
	if (pathname.startsWith('/api/v1/')) {
		const authHeader = event.request.headers.get('authorization');
		const token = extractBearerToken(authHeader);

		if (!token) {
			return json(
				{
					error: 'unauthorized',
					message: 'Authorization header with Bearer token is required',
					statusCode: 401
				},
				{ status: 401 }
			);
		}

		const tokenPayload = await validateBearerToken(token);

		if (!tokenPayload) {
			return json(
				{
					error: 'unauthorized',
					message: 'Invalid or expired access token',
					statusCode: 401
				},
				{ status: 401 }
			);
		}

		const apiClientContext = await getApiClientFromToken(tokenPayload);

		if (!apiClientContext) {
			return json(
				{
					error: 'forbidden',
					message: 'API client not found or disabled',
					statusCode: 403
				},
				{ status: 403 }
			);
		}

		event.locals.apiClient = apiClientContext;

		return resolve(event);
	}

	// Handle regular session-based authentication
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
