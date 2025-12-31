import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hospitals } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const apiClient = locals.apiClient;

	if (!apiClient) {
		return json(
			{
				error: 'unauthorized',
				message: 'API client context not found',
				statusCode: 401
			},
			{ status: 401 }
		);
	}

	// Check if the client has access to this hospital
	if (apiClient.client.hospitalId && apiClient.client.hospitalId !== params.id) {
		return json(
			{
				error: 'forbidden',
				message: 'Access to this hospital is not allowed',
				statusCode: 403
			},
			{ status: 403 }
		);
	}

	const [hospital] = await db
		.select({
			id: hospitals.id,
			name: hospitals.name,
			slug: hospitals.slug,
			createdAt: hospitals.createdAt,
			updatedAt: hospitals.updatedAt
		})
		.from(hospitals)
		.where(eq(hospitals.id, params.id))
		.limit(1);

	if (!hospital) {
		return json(
			{
				error: 'not_found',
				message: 'Hospital not found',
				statusCode: 404
			},
			{ status: 404 }
		);
	}

	return json({
		data: hospital
	});
};
