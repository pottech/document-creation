import { error, fail, redirect } from '@sveltejs/kit';
import {
	getApiClientById,
	updateApiClientEnabled,
	regenerateClientSecret,
	deleteApiClient
} from '$lib/server/repositories/api-clients';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const client = await getApiClientById(params.id);

	if (!client) {
		throw error(404, 'APIクライアントが見つかりません');
	}

	return {
		client
	};
};

export const actions: Actions = {
	toggleEnabled: async ({ params }) => {
		const client = await getApiClientById(params.id);
		if (!client) {
			return fail(404, { error: 'APIクライアントが見つかりません' });
		}

		try {
			await updateApiClientEnabled(params.id, !client.isEnabled);
			return { success: true, action: 'toggle' };
		} catch (err) {
			console.error('Failed to toggle client status:', err);
			return fail(500, { error: '状態の変更に失敗しました' });
		}
	},

	regenerateSecret: async ({ params }) => {
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

	delete: async ({ params }) => {
		try {
			await deleteApiClient(params.id);
			throw redirect(303, '/admin/api-clients');
		} catch (err) {
			if (err instanceof Response) {
				throw err;
			}
			console.error('Failed to delete client:', err);
			return fail(500, { error: '削除に失敗しました' });
		}
	}
};
