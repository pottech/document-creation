import { env } from '$env/dynamic/private';
import { getApiClientByKeycloakClientId } from '$lib/server/repositories/api-clients';

interface TokenIntrospectionResponse {
	active: boolean;
	client_id?: string;
	scope?: string;
	exp?: number;
	iat?: number;
	sub?: string;
	aud?: string | string[];
	iss?: string;
	token_type?: string;
}

/**
 * Validate a Bearer token using Keycloak token introspection endpoint
 */
export async function validateBearerToken(token: string): Promise<TokenIntrospectionResponse | null> {
	const realm = env.KEYCLOAK_REALM || 'document-creation';
	const baseUrl = env.KEYCLOAK_URL || 'http://localhost:8080';
	const clientId = env.KEYCLOAK_CLIENT_ID || 'sveltekit-app';
	const clientSecret = env.KEYCLOAK_CLIENT_SECRET;

	if (!clientSecret) {
		console.error('KEYCLOAK_CLIENT_SECRET is not set');
		return null;
	}

	const introspectionUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token/introspect`;

	try {
		const response = await fetch(introspectionUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
			},
			body: new URLSearchParams({
				token,
				token_type_hint: 'access_token'
			})
		});

		if (!response.ok) {
			console.error('Token introspection failed:', response.status, await response.text());
			return null;
		}

		const result: TokenIntrospectionResponse = await response.json();

		if (!result.active) {
			return null;
		}

		return result;
	} catch (error) {
		console.error('Token introspection error:', error);
		return null;
	}
}

/**
 * Get API client context from a validated token
 */
export async function getApiClientFromToken(
	tokenPayload: TokenIntrospectionResponse
): Promise<App.Locals['apiClient']> {
	if (!tokenPayload.client_id) {
		return null;
	}

	// Look up the API client by Keycloak client ID
	const apiClient = await getApiClientByKeycloakClientId(tokenPayload.client_id);

	if (!apiClient) {
		// This might be a valid Keycloak client but not registered in our system
		return null;
	}

	if (!apiClient.isEnabled) {
		return null;
	}

	// Parse scopes from token
	const scopes = tokenPayload.scope?.split(' ') || [];

	return {
		client: apiClient,
		scopes
	};
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
	if (!authHeader) {
		return null;
	}

	const parts = authHeader.split(' ');
	if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
		return null;
	}

	return parts[1];
}
