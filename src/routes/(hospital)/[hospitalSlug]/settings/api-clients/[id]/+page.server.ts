import { error, fail, redirect, isRedirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hospitals, hospitalMemberships } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import {
	getApiClientById,
	updateApiClientEnabled,
	regenerateClientSecret,
	deleteApiClient
} from '$lib/server/repositories/api-clients';
import type { PageServerLoad, Actions } from './$types';

async function getHospitalAndCheckAdmin(hospitalSlug: string, userId: string, isServiceAdmin: boolean) {
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

	const isAdmin = membership?.role === 'hospital_admin' || isServiceAdmin;

	return { hospital, isAdmin };
}

export const load: PageServerLoad = async ({ params, parent }) => {
	const data = await parent();

	if (!data.isHospitalAdmin) {
		throw redirect(303, `/${data.hospital.slug}`);
	}

	const client = await getApiClientById(params.id);

	if (!client) {
		throw error(404, 'APIクライアントが見つかりません');
	}

	// Verify the client belongs to this hospital
	if (client.hospitalId !== data.hospital.id) {
		throw error(403, 'このAPIクライアントへのアクセス権限がありません');
	}

	return {
		client
	};
};

export const actions: Actions = {
	toggleEnabled: async ({ params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: '認証が必要です' });
		}

		const result = await getHospitalAndCheckAdmin(params.hospitalSlug, locals.user.id, locals.user.isServiceAdmin);

		if (!result || !result.isAdmin) {
			return fail(403, { error: 'この操作を行う権限がありません' });
		}

		const client = await getApiClientById(params.id);
		if (!client) {
			return fail(404, { error: 'APIクライアントが見つかりません' });
		}

		if (client.hospitalId !== result.hospital.id) {
			return fail(403, { error: 'このAPIクライアントへのアクセス権限がありません' });
		}

		try {
			await updateApiClientEnabled(params.id, !client.isEnabled);
			return { success: true, action: 'toggle' };
		} catch (err) {
			console.error('Failed to toggle client status:', err);
			return fail(500, { error: '状態の変更に失敗しました' });
		}
	},

	regenerateSecret: async ({ params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: '認証が必要です' });
		}

		const result = await getHospitalAndCheckAdmin(params.hospitalSlug, locals.user.id, locals.user.isServiceAdmin);

		if (!result || !result.isAdmin) {
			return fail(403, { error: 'この操作を行う権限がありません' });
		}

		const client = await getApiClientById(params.id);
		if (!client) {
			return fail(404, { error: 'APIクライアントが見つかりません' });
		}

		if (client.hospitalId !== result.hospital.id) {
			return fail(403, { error: 'このAPIクライアントへのアクセス権限がありません' });
		}

		try {
			const newSecret = await regenerateClientSecret(params.id);
			return {
				success: true,
				action: 'regenerate',
				newSecret
			};
		} catch (err) {
			console.error('Failed to regenerate secret:', err);
			return fail(500, { error: 'Secretの再生成に失敗しました' });
		}
	},

	delete: async ({ params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: '認証が必要です' });
		}

		const result = await getHospitalAndCheckAdmin(params.hospitalSlug, locals.user.id, locals.user.isServiceAdmin);

		if (!result || !result.isAdmin) {
			return fail(403, { error: 'この操作を行う権限がありません' });
		}

		const client = await getApiClientById(params.id);
		if (!client) {
			return fail(404, { error: 'APIクライアントが見つかりません' });
		}

		if (client.hospitalId !== result.hospital.id) {
			return fail(403, { error: 'このAPIクライアントへのアクセス権限がありません' });
		}

		try {
			await deleteApiClient(params.id);
			throw redirect(303, `/${result.hospital.slug}/settings/api-clients`);
		} catch (err) {
			if (isRedirect(err)) {
				throw err;
			}
			console.error('Failed to delete client:', err);
			return fail(500, { error: '削除に失敗しました' });
		}
	}
};
