import '@testing-library/svelte/vitest';
import { vi } from 'vitest';
import { readable } from 'svelte/store';

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({
	browser: false,
	dev: true,
	building: false
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadData: vi.fn(),
	preloadCode: vi.fn(),
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn()
}));

vi.mock('$app/stores', () => {
	return {
		page: readable({
			url: new URL('http://localhost'),
			params: {},
			route: { id: null },
			status: 200,
			error: null,
			data: {},
			form: null
		}),
		navigating: readable(null),
		updated: {
			subscribe: readable(false).subscribe,
			check: vi.fn()
		}
	};
});
