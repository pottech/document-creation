import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hospitals } from '$lib/server/db/schema';
import { createApiClient } from '$lib/server/repositories/api-clients';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	// Get all hospitals for dropdown
	const hospitalList = await db
		.select({
			id: hospitals.id,
			name: hospitals.name,
			slug: hospitals.slug
		})
		.from(hospitals)
		.orderBy(hospitals.name);

	return {
		hospitals: hospitalList
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const description = formData.get('description') as string;
		const hospitalId = formData.get('hospitalId') as string;
		const scope = formData.get('scope') as string;

		const values = { name, description, hospitalId, scope };

		// Validation
		if (!name) {
			return fail(400, {
				error: 'クライアント名を入力してください',
				values
			});
		}

		if (!scope) {
			return fail(400, {
				error: 'スコープを選択してください',
				values
			});
		}

		if (scope === 'hospital' && !hospitalId) {
			return fail(400, {
				error: '病院を選択してください',
				values
			});
		}

		try {
			const result = await createApiClient({
				hospitalId: scope === 'hospital' ? hospitalId : null,
				name,
				description: description || undefined,
				createdBy: locals.user!.id
			});

			// Return success with client secret (shown only once)
			return {
				success: true,
				clientId: result.client.keycloakClientId,
				clientSecret: result.clientSecret,
				apiClientId: result.client.id
			};
		} catch (err) {
			console.error('Failed to create API client:', err);
			return fail(500, {
				error: 'APIクライアントの作成に失敗しました',
				values
			});
		}
	}
};
