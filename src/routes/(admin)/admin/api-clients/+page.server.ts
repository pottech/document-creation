import { getApiClients } from '$lib/server/repositories/api-clients';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const clients = await getApiClients();

	return {
		clients
	};
};
