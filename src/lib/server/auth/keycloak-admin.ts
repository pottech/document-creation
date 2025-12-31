import {
	KEYCLOAK_URL,
	KEYCLOAK_REALM,
	KEYCLOAK_ADMIN,
	KEYCLOAK_ADMIN_PASSWORD
} from '$env/static/private';

const ADMIN_TOKEN_URL = `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`;
const CLIENTS_URL = `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/clients`;

interface AdminTokenResponse {
	access_token: string;
	expires_in: number;
	token_type: string;
}

interface KeycloakClient {
	id: string;
	clientId: string;
	name?: string;
	description?: string;
	enabled: boolean;
	serviceAccountsEnabled: boolean;
	secret?: string;
}

interface CreateClientParams {
	clientId: string;
	name: string;
	description?: string;
}

// Cache admin token to avoid excessive token requests
let cachedAdminToken: { token: string; expiresAt: number } | null = null;

/**
 * Get admin access token for Keycloak Admin API
 */
export async function getAdminAccessToken(): Promise<string> {
	// Check if cached token is still valid (with 60 second buffer)
	if (cachedAdminToken && cachedAdminToken.expiresAt > Date.now() + 60000) {
		return cachedAdminToken.token;
	}

	const response = await fetch(ADMIN_TOKEN_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			grant_type: 'password',
			client_id: 'admin-cli',
			username: KEYCLOAK_ADMIN,
			password: KEYCLOAK_ADMIN_PASSWORD
		})
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to get admin token: ${error}`);
	}

	const data: AdminTokenResponse = await response.json();

	// Cache the token
	cachedAdminToken = {
		token: data.access_token,
		expiresAt: Date.now() + data.expires_in * 1000
	};

	return data.access_token;
}

/**
 * Create a new client in Keycloak for API access
 */
export async function createKeycloakClient(params: CreateClientParams): Promise<{
	id: string;
	clientId: string;
	clientSecret: string;
}> {
	const token = await getAdminAccessToken();

	// Create client with service account enabled
	const response = await fetch(CLIENTS_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			clientId: params.clientId,
			name: params.name,
			description: params.description,
			enabled: true,
			clientAuthenticatorType: 'client-secret',
			serviceAccountsEnabled: true,
			standardFlowEnabled: false,
			implicitFlowEnabled: false,
			directAccessGrantsEnabled: false,
			publicClient: false,
			protocol: 'openid-connect'
		})
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to create Keycloak client: ${error}`);
	}

	// Get the created client's internal ID from Location header
	const location = response.headers.get('Location');
	if (!location) {
		throw new Error('No Location header in response');
	}

	const clientUuid = location.split('/').pop()!;

	// Get the client secret
	const secretResponse = await fetch(`${CLIENTS_URL}/${clientUuid}/client-secret`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!secretResponse.ok) {
		throw new Error('Failed to get client secret');
	}

	const secretData = await secretResponse.json();

	return {
		id: clientUuid,
		clientId: params.clientId,
		clientSecret: secretData.value
	};
}

/**
 * Get client secret from Keycloak
 */
export async function getClientSecret(keycloakClientUuid: string): Promise<string> {
	const token = await getAdminAccessToken();

	const response = await fetch(`${CLIENTS_URL}/${keycloakClientUuid}/client-secret`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!response.ok) {
		throw new Error('Failed to get client secret');
	}

	const data = await response.json();
	return data.value;
}

/**
 * Regenerate client secret in Keycloak
 */
export async function regenerateClientSecret(keycloakClientUuid: string): Promise<string> {
	const token = await getAdminAccessToken();

	const response = await fetch(`${CLIENTS_URL}/${keycloakClientUuid}/client-secret`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!response.ok) {
		throw new Error('Failed to regenerate client secret');
	}

	const data = await response.json();
	return data.value;
}

/**
 * Enable or disable a client in Keycloak
 */
export async function setClientEnabled(keycloakClientUuid: string, enabled: boolean): Promise<void> {
	const token = await getAdminAccessToken();

	// First get current client config
	const getResponse = await fetch(`${CLIENTS_URL}/${keycloakClientUuid}`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!getResponse.ok) {
		throw new Error('Failed to get client');
	}

	const client: KeycloakClient = await getResponse.json();

	// Update with new enabled status
	const response = await fetch(`${CLIENTS_URL}/${keycloakClientUuid}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			...client,
			enabled
		})
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to update client: ${error}`);
	}
}

/**
 * Delete a client from Keycloak
 */
export async function deleteKeycloakClient(keycloakClientUuid: string): Promise<void> {
	const token = await getAdminAccessToken();

	const response = await fetch(`${CLIENTS_URL}/${keycloakClientUuid}`, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to delete client: ${error}`);
	}
}

/**
 * Get client by clientId (not UUID)
 */
export async function getKeycloakClientByClientId(clientId: string): Promise<KeycloakClient | null> {
	const token = await getAdminAccessToken();

	const response = await fetch(`${CLIENTS_URL}?clientId=${encodeURIComponent(clientId)}`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!response.ok) {
		throw new Error('Failed to search clients');
	}

	const clients: KeycloakClient[] = await response.json();
	return clients.length > 0 ? clients[0] : null;
}
