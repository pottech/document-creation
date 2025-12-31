import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hospitals } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
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

	let hospitalList;

	if (apiClient.client.hospitalId) {
		// Hospital-scoped client: only return the associated hospital
		hospitalList = await db
			.select({
				id: hospitals.id,
				name: hospitals.name,
				slug: hospitals.slug,
				createdAt: hospitals.createdAt,
				updatedAt: hospitals.updatedAt
			})
			.from(hospitals)
			.where(eq(hospitals.id, apiClient.client.hospitalId));
	} else {
		// System-wide client: return all hospitals
		hospitalList = await db
			.select({
				id: hospitals.id,
				name: hospitals.name,
				slug: hospitals.slug,
				createdAt: hospitals.createdAt,
				updatedAt: hospitals.updatedAt
			})
			.from(hospitals)
			.orderBy(hospitals.name);
	}

	return json({
		data: hospitalList,
		meta: {
			total: hospitalList.length,
			scope: apiClient.client.hospitalId ? 'hospital' : 'system'
		}
	});
};
