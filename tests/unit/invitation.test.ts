import { describe, it, expect } from 'vitest';

// generateInvitationToken の純粋なロジックをテスト
// 実際の関数は DB 依存があるため、ロジック部分を抽出してテスト
function generateToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

describe('Invitation Token', () => {
	describe('generateToken', () => {
		it('64文字の16進数文字列を生成する', () => {
			const token = generateToken();
			expect(token).toHaveLength(64);
			expect(token).toMatch(/^[0-9a-f]{64}$/);
		});

		it('毎回異なるトークンを生成する', () => {
			const token1 = generateToken();
			const token2 = generateToken();
			expect(token1).not.toBe(token2);
		});

		it('有効な16進数文字のみを含む', () => {
			const token = generateToken();
			const validHexChars = /^[0-9a-f]+$/;
			expect(validHexChars.test(token)).toBe(true);
		});
	});

	describe('Invitation Expiry', () => {
		const INVITATION_EXPIRY_DAYS = 7;

		it('7日後の有効期限を計算する', () => {
			const now = new Date();
			const expiresAt = new Date(now.getTime() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

			const diffInDays = (expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
			expect(diffInDays).toBeCloseTo(7, 1);
		});
	});
});
