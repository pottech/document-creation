import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hospitals, hospitalMemberships } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { createApiClient } from '$lib/server/repositories/api-clients';
import type { PageServerLoad, Actions } from './$types';

async function getHospitalAndCheckAdmin(hospitalSlug: string, userId: string) {
	const [hospital] = await db
		.select()
		.from(hospitals)
		.where(eq(hospitals.slug, hospitalSlug))
		.limit(1);

	if (!hospital) {
		return null;
	}

	const [membership] = await db
		.select()
		.from(hospitalMemberships)
		.where(
			and(eq(hospitalMemberships.hospitalId, hospital.id), eq(hospitalMemberships.userId, userId))
		)
		.limit(1);

	const isAdmin = membership?.role === 'hospital_admin';

	return { hospital, isAdmin };
}

export const load: PageServerLoad = async ({ parent }) => {
	const data = await parent();

	if (!data.isHospitalAdmin) {
		throw redirect(303, `/${data.hospital.slug}`);
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: '認証が必要です' });
		}

		const result = await getHospitalAndCheckAdmin(params.hospitalSlug, locals.user.id);

		if (!result) {
			return fail(404, { error: '病院が見つかりません' });
		}

		if (!result.isAdmin && !locals.user.isServiceAdmin) {
			return fail(403, { error: 'この操作を行う権限がありません' });
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const description = formData.get('description') as string;

		const values = { name, description };

		if (!name) {
			return fail(400, {
				error: 'クライアント名を入力してください',
				values
			});
		}

		try {
			const apiResult = await createApiClient({
				hospitalId: result.hospital.id,
				name,
				description: description || undefined,
				createdBy: locals.user.id
			});

			return {
				success: true,
				clientId: apiResult.client.keycloakClientId,
				clientSecret: apiResult.clientSecret,
				apiClientId: apiResult.client.id
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
