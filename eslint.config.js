import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		}
	},
	{
		rules: {
			// 未使用変数の警告（_で始まる変数は許可）
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_'
				}
			],
			// any型の使用を警告（エラーではなく警告）
			'@typescript-eslint/no-explicit-any': 'warn',
			// 空の関数を許可
			'@typescript-eslint/no-empty-function': 'off',
			// console.logの使用を許可（開発中）
			'no-console': 'off',
			// Svelteの$props等でのdestructuringを許可
			'svelte/valid-compile': 'warn',
			// Svelte 5のナビゲーションルールを警告に（resolve()必須を緩和）
			'svelte/no-navigation-without-resolve': 'off',
			// each blockのkeyを警告に（必須から緩和）
			'svelte/require-each-key': 'warn',
			// SvelteURLSearchParamsの強制を無効化
			'svelte/prefer-svelte-reactivity': 'off'
		}
	},
	{
		ignores: [
			'.svelte-kit/**',
			'build/**',
			'dist/**',
			'node_modules/**',
			'.pnpm-store/**',
			'*.config.js',
			'*.config.ts',
			'drizzle/**',
			'test-results/**',
			'playwright-report/**',
			'tests/e2e/**'
		]
	}
);
