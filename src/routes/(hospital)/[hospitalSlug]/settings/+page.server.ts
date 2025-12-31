import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const data = await parent();

	if (!data.isHospitalAdmin) {
		throw redirect(303, `/${data.hospital.slug}`);
	}

	return {};
};
