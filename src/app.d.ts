// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { User, Hospital, HospitalMembership, ApiClient } from '$lib/server/db/schema';

// API Client context for external API requests
interface ApiClientContext {
	client: ApiClient;
	scopes: string[];
}

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
			apiClient: ApiClientContext | null;
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
