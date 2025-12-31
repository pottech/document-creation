import { redirect } from '@sveltejs/kit';
import { getApiClients } from '$lib/server/repositories/api-clients';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const data = await parent();

	if (!data.isHospitalAdmin) {
		throw redirect(303, `/${data.hospital.slug}`);
	}

	const clients = await getApiClients(data.hospital.id);

	return {
		clients
	};
};
