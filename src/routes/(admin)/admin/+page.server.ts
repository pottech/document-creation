import { db } from '$lib/server/db';
import { hospitals, users } from '$lib/server/db/schema';
import { count } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [hospitalResult] = await db.select({ count: count() }).from(hospitals);
	const [userResult] = await db.select({ count: count() }).from(users);

	return {
		hospitalCount: hospitalResult.count,
		userCount: userResult.count
	};
};
