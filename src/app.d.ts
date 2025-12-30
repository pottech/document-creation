// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { User, Hospital, HospitalMembership } from '$lib/server/db/schema';

declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}
		interface Locals {
			user: User | null;
			hospital: Hospital | null;
			membership: HospitalMembership | null;
			sessionId: string | null;
		}
		interface PageData {
			user: User | null;
			hospital: Hospital | null;
			membership: HospitalMembership | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
