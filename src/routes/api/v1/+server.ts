import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const apiClient = locals.apiClient;

	return json({
		version: '1.0.0',
		name: 'Document Creation API',
		client: {
			id: apiClient?.client.keycloakClientId,
			name: apiClient?.client.name,
			scope: apiClient?.client.hospitalId ? 'hospital' : 'system'
		},
		endpoints: {
			hospitals: '/api/v1/hospitals'
		}
	});
};
