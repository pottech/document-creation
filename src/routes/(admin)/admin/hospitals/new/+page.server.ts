import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hospitals } from '$lib/server/db/schema';
import { createInvitation } from '$lib/server/auth/invitation';
import { eq } from 'drizzle-orm';
import { ORIGIN } from '$env/static/private';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const slug = formData.get('slug') as string;
		const adminEmail = formData.get('adminEmail') as string;

		const values = { name, slug, adminEmail };

		// Validation
		if (!name || !slug || !adminEmail) {
			return fail(400, {
				error: 'すべての必須項目を入力してください',
				values
			});
		}

		// Check if slug is valid
		if (!/^[a-z0-9-]+$/.test(slug)) {
			return fail(400, {
				error: 'スラッグは半角英数字とハイフンのみ使用できます',
				values
			});
		}

		// Check if slug is already taken
		const existing = await db.select().from(hospitals).where(eq(hospitals.slug, slug)).limit(1);

		if (existing.length > 0) {
			return fail(400, {
				error: 'このスラッグは既に使用されています',
				values
			});
		}

		// Create hospital
		const [hospital] = await db
			.insert(hospitals)
			.values({
				name,
				slug
			})
			.returning();

		// Create invitation for hospital admin
		const invitation = await createInvitation({
			email: adminEmail,
			hospitalId: hospital.id,
			role: 'hospital_admin',
			invitedBy: locals.user!.id
		});

		// TODO: Send invitation email
		// For now, log the invitation URL
		const inviteUrl = `${ORIGIN}/invite/${invitation.token}`;
		console.log(`Invitation URL for ${adminEmail}: ${inviteUrl}`);

		throw redirect(303, `/admin/hospitals/${hospital.id}`);
	}
};
