import { db } from '$lib/server/db';
import { hospitals, hospitalMemberships } from '$lib/server/db/schema';
import { eq, count } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const hospitalList = await db
		.select({
			id: hospitals.id,
			name: hospitals.name,
			slug: hospitals.slug,
			createdAt: hospitals.createdAt
		})
		.from(hospitals)
		.orderBy(hospitals.createdAt);

	// Get member counts for each hospital
	const hospitalsWithCounts = await Promise.all(
		hospitalList.map(async (hospital) => {
			const [result] = await db
				.select({ count: count() })
				.from(hospitalMemberships)
				.where(eq(hospitalMemberships.hospitalId, hospital.id));

			return {
				...hospital,
				memberCount: result.count
			};
		})
	);

	return {
		hospitals: hospitalsWithCounts
	};
};
