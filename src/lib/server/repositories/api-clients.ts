import { db } from '$lib/server/db';
import { apiClients, hospitals, users, type ApiClient, type NewApiClient } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import {
	createKeycloakClient,
	deleteKeycloakClient,
	setClientEnabled,
	regenerateClientSecret as regenerateKeycloakSecret,
	getKeycloakClientByClientId
} from '$lib/server/auth/keycloak-admin';

interface CreateApiClientParams {
	hospitalId: string | null;
	name: string;
	description?: string;
	createdBy: string;
}

interface ApiClientWithDetails extends ApiClient {
	hospital: { id: string; name: string; slug: string } | null;
	createdByUser: { id: string; name: string; email: string };
}

/**
 * Generate a unique client ID for Keycloak
 */
function generateClientId(hospitalSlug: string | null): string {
	const prefix = hospitalSlug ? `api-${hospitalSlug}` : 'api-system';
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 8);
	return `${prefix}-${timestamp}-${random}`;
}

/**
 * Get all API clients with optional hospital filter
 */
export async function getApiClients(hospitalId?: string): Promise<ApiClientWithDetails[]> {
	const whereClause = hospitalId ? eq(apiClients.hospitalId, hospitalId) : undefined;

	const results = await db
		.select({
			client: apiClients,
			hospital: {
				id: hospitals.id,
				name: hospitals.name,
				slug: hospitals.slug
			},
			createdByUser: {
				id: users.id,
				name: users.name,
				email: users.email
			}
		})
		.from(apiClients)
		.leftJoin(hospitals, eq(apiClients.hospitalId, hospitals.id))
		.innerJoin(users, eq(apiClients.createdBy, users.id))
		.where(whereClause)
		.orderBy(apiClients.createdAt);

	return results.map((row) => ({
		...row.client,
		hospital: row.hospital,
		createdByUser: row.createdByUser
	}));
}

/**
 * Get system-wide API clients (no hospital association)
 */
export async function getSystemApiClients(): Promise<ApiClientWithDetails[]> {
	const results = await db
		.select({
			client: apiClients,
			hospital: {
				id: hospitals.id,
				name: hospitals.name,
				slug: hospitals.slug
			},
			createdByUser: {
				id: users.id,
				name: users.name,
				email: users.email
			}
		})
		.from(apiClients)
		.leftJoin(hospitals, eq(apiClients.hospitalId, hospitals.id))
		.innerJoin(users, eq(apiClients.createdBy, users.id))
		.where(isNull(apiClients.hospitalId))
		.orderBy(apiClients.createdAt);

	return results.map((row) => ({
		...row.client,
		hospital: row.hospital,
		createdByUser: row.createdByUser
	}));
}

/**
 * Get API client by ID with details
 */
export async function getApiClientById(id: string): Promise<ApiClientWithDetails | null> {
	const results = await db
		.select({
			client: apiClients,
			hospital: {
				id: hospitals.id,
				name: hospitals.name,
				slug: hospitals.slug
			},
			createdByUser: {
				id: users.id,
				name: users.name,
				email: users.email
			}
		})
		.from(apiClients)
		.leftJoin(hospitals, eq(apiClients.hospitalId, hospitals.id))
		.innerJoin(users, eq(apiClients.createdBy, users.id))
		.where(eq(apiClients.id, id))
		.limit(1);

	if (results.length === 0) {
		return null;
	}

	const row = results[0];
	return {
		...row.client,
		hospital: row.hospital,
		createdByUser: row.createdByUser
	};
}

/**
 * Get API client by Keycloak client ID
 */
export async function getApiClientByKeycloakClientId(
	keycloakClientId: string
): Promise<ApiClient | null> {
	const [client] = await db
		.select()
		.from(apiClients)
		.where(eq(apiClients.keycloakClientId, keycloakClientId))
		.limit(1);

	return client ?? null;
}

/**
 * Create a new API client (creates in both Keycloak and database)
 */
export async function createApiClient(
	params: CreateApiClientParams
): Promise<{ client: ApiClient; clientSecret: string }> {
	// Get hospital slug if hospital-specific
	let hospitalSlug: string | null = null;
	if (params.hospitalId) {
		const [hospital] = await db
			.select({ slug: hospitals.slug })
			.from(hospitals)
			.where(eq(hospitals.id, params.hospitalId))
			.limit(1);

		if (!hospital) {
			throw new Error('Hospital not found');
		}
		hospitalSlug = hospital.slug;
	}

	// Generate unique client ID
	const keycloakClientId = generateClientId(hospitalSlug);

	// Create client in Keycloak
	const keycloakResult = await createKeycloakClient({
		clientId: keycloakClientId,
		name: params.name,
		description: params.description
	});

	// Create client in database
	const [client] = await db
		.insert(apiClients)
		.values({
			hospitalId: params.hospitalId,
			keycloakClientId: keycloakResult.clientId,
			name: params.name,
			description: params.description,
			createdBy: params.createdBy
		})
		.returning();

	return {
		client,
		clientSecret: keycloakResult.clientSecret
	};
}

/**
 * Update API client enabled status
 */
export async function updateApiClientEnabled(id: string, isEnabled: boolean): Promise<void> {
	// Get client
	const [client] = await db.select().from(apiClients).where(eq(apiClients.id, id)).limit(1);

	if (!client) {
		throw new Error('API client not found');
	}

	// Get Keycloak client UUID
	const keycloakClient = await getKeycloakClientByClientId(client.keycloakClientId);
	if (!keycloakClient) {
		throw new Error('Keycloak client not found');
	}

	// Update in Keycloak
	await setClientEnabled(keycloakClient.id, isEnabled);

	// Update in database
	await db
		.update(apiClients)
		.set({ isEnabled, updatedAt: new Date() })
		.where(eq(apiClients.id, id));
}

/**
 * Regenerate client secret
 */
export async function regenerateClientSecret(id: string): Promise<string> {
	// Get client
	const [client] = await db.select().from(apiClients).where(eq(apiClients.id, id)).limit(1);

	if (!client) {
		throw new Error('API client not found');
	}

	// Get Keycloak client UUID
	const keycloakClient = await getKeycloakClientByClientId(client.keycloakClientId);
	if (!keycloakClient) {
		throw new Error('Keycloak client not found');
	}

	// Regenerate in Keycloak
	const newSecret = await regenerateKeycloakSecret(keycloakClient.id);

	// Update timestamp in database
	await db.update(apiClients).set({ updatedAt: new Date() }).where(eq(apiClients.id, id));

	return newSecret;
}

/**
 * Delete API client (deletes from both Keycloak and database)
 */
export async function deleteApiClient(id: string): Promise<void> {
	// Get client
	const [client] = await db.select().from(apiClients).where(eq(apiClients.id, id)).limit(1);

	if (!client) {
		throw new Error('API client not found');
	}

	// Get Keycloak client UUID
	const keycloakClient = await getKeycloakClientByClientId(client.keycloakClientId);
	if (keycloakClient) {
		// Delete from Keycloak
		await deleteKeycloakClient(keycloakClient.id);
	}

	// Delete from database
	await db.delete(apiClients).where(eq(apiClients.id, id));
}

/**
 * Check if user has access to API client
 */
export async function canUserAccessApiClient(
	userId: string,
	clientId: string,
	isServiceAdmin: boolean
): Promise<boolean> {
	if (isServiceAdmin) {
		return true;
	}

	const client = await getApiClientById(clientId);
	if (!client) {
		return false;
	}

	// System-wide clients can only be accessed by service admins
	if (!client.hospitalId) {
		return false;
	}

	// Check if user is hospital admin
	const { hospitalMemberships } = await import('$lib/server/db/schema');
	const [membership] = await db
		.select()
		.from(hospitalMemberships)
		.where(
			and(
				eq(hospitalMemberships.userId, userId),
				eq(hospitalMemberships.hospitalId, client.hospitalId),
				eq(hospitalMemberships.role, 'hospital_admin')
			)
		)
		.limit(1);

	return !!membership;
}
