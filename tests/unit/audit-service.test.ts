import { describe, it, expect } from 'vitest';

// calculateChanges の純粋なロジックをテスト
type AuditChanges = Record<string, { before: unknown; after: unknown }>;

function calculateChanges<T extends Record<string, unknown>>(
	before: T,
	after: T,
	fieldsToTrack: (keyof T)[]
): AuditChanges | null {
	const changes: AuditChanges = {};
	let hasChanges = false;

	for (const field of fieldsToTrack) {
		const beforeValue = before[field];
		const afterValue = after[field];

		if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
			changes[field as string] = {
				before: beforeValue,
				after: afterValue
			};
			hasChanges = true;
		}
	}

	return hasChanges ? changes : null;
}

describe('AuditService', () => {
	describe('calculateChanges', () => {
		it('変更がある場合は差分を返す', () => {
			const before = { name: '山田太郎', age: 30, email: 'yamada@example.com' };
			const after = { name: '山田花子', age: 30, email: 'yamada@example.com' };

			const changes = calculateChanges(before, after, ['name', 'age', 'email']);

			expect(changes).toEqual({
				name: { before: '山田太郎', after: '山田花子' }
			});
		});

		it('変更がない場合は null を返す', () => {
			const before = { name: '山田太郎', age: 30 };
			const after = { name: '山田太郎', age: 30 };

			const changes = calculateChanges(before, after, ['name', 'age']);

			expect(changes).toBeNull();
		});

		it('複数フィールドの変更を検出する', () => {
			const before = { name: '山田太郎', age: 30, status: 'active' };
			const after = { name: '山田花子', age: 31, status: 'inactive' };

			const changes = calculateChanges(before, after, ['name', 'age', 'status']);

			expect(changes).toEqual({
				name: { before: '山田太郎', after: '山田花子' },
				age: { before: 30, after: 31 },
				status: { before: 'active', after: 'inactive' }
			});
		});

		it('追跡対象外のフィールドは無視する', () => {
			const before = { name: '山田太郎', age: 30, secret: 'password' };
			const after = { name: '山田太郎', age: 30, secret: 'newpassword' };

			const changes = calculateChanges(before, after, ['name', 'age']);

			expect(changes).toBeNull();
		});

		it('オブジェクトの変更を検出する', () => {
			const before = { data: { items: [1, 2, 3] } };
			const after = { data: { items: [1, 2, 3, 4] } };

			const changes = calculateChanges(before, after, ['data']);

			expect(changes).toEqual({
				data: {
					before: { items: [1, 2, 3] },
					after: { items: [1, 2, 3, 4] }
				}
			});
		});

		it('null から値への変更を検出する', () => {
			const before: { name: string | null } = { name: null };
			const after: { name: string | null } = { name: '山田太郎' };

			const changes = calculateChanges(before, after, ['name']);

			expect(changes).toEqual({
				name: { before: null, after: '山田太郎' }
			});
		});

		it('値から null への変更を検出する', () => {
			const before: { name: string | null } = { name: '山田太郎' };
			const after: { name: string | null } = { name: null };

			const changes = calculateChanges(before, after, ['name']);

			expect(changes).toEqual({
				name: { before: '山田太郎', after: null }
			});
		});
	});
});
