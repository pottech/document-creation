<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let copied = $state(false);

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<div class="page">
	<a href="/{data.hospital.slug}/settings/api-clients" class="back-link"
		>&larr; APIクライアント一覧に戻る</a
	>

	<h1>APIクライアント新規作成</h1>

	{#if form?.success}
		<div class="success-card">
			<h2>APIクライアントを作成しました</h2>
			<p class="warning">
				Client Secretは一度だけ表示されます。必ずコピーして安全な場所に保存してください。
			</p>

			<div class="credentials">
				<div class="credential-item">
					<label for="clientId">Client ID</label>
					<div class="credential-value">
						<code id="clientId">{form.clientId}</code>
						<button type="button" onclick={() => copyToClipboard(form.clientId)}>コピー</button>
					</div>
				</div>

				<div class="credential-item">
					<label for="clientSecret">Client Secret</label>
					<div class="credential-value">
						<code id="clientSecret" class="secret">{form.clientSecret}</code>
						<button type="button" onclick={() => copyToClipboard(form.clientSecret)}>コピー</button>
					</div>
				</div>
			</div>

			{#if copied}
				<div class="copied-message">クリップボードにコピーしました</div>
			{/if}

			<div class="actions">
				<a href="/{data.hospital.slug}/settings/api-clients/{form.apiClientId}" class="btn-primary"
					>詳細を表示</a
				>
				<a href="/{data.hospital.slug}/settings/api-clients" class="btn-secondary">一覧に戻る</a>
			</div>
		</div>
	{:else}
		{#if form?.error}
			<div class="error-message">{form.error}</div>
		{/if}

		<form method="POST" use:enhance class="form-card">
			<div class="form-group">
				<label for="name">クライアント名 <span class="required">*</span></label>
				<input
					type="text"
					id="name"
					name="name"
					required
					placeholder="例: 電子カルテ連携"
				/>
			</div>

			<div class="form-group">
				<label for="description">説明</label>
				<textarea
					id="description"
					name="description"
					rows="3"
					placeholder="このAPIクライアントの用途を説明してください"></textarea
				>
			</div>

			<div class="form-actions">
				<a href="/{data.hospital.slug}/settings/api-clients" class="btn-secondary">キャンセル</a>
				<button type="submit" class="btn-primary">作成</button>
			</div>
		</form>
	{/if}
</div>

<style>
	.page {
		max-width: 600px;
	}

	.back-link {
		display: inline-block;
		color: #64748b;
		text-decoration: none;
		margin-bottom: 1rem;
	}

	.back-link:hover {
		color: #1e293b;
	}

	h1 {
		margin-bottom: 2rem;
	}

	.error-message {
		background: #fef2f2;
		color: #dc2626;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1.5rem;
	}

	.success-card {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.success-card h2 {
		color: #059669;
		margin-bottom: 1rem;
	}

	.warning {
		background: #fef3c7;
		color: #92400e;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1.5rem;
	}

	.credentials {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.credential-item label {
		display: block;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.credential-value {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.credential-value code {
		flex: 1;
		background: #f1f5f9;
		padding: 0.75rem;
		border-radius: 4px;
		font-size: 0.875rem;
		word-break: break-all;
	}

	.credential-value code.secret {
		background: #fef2f2;
	}

	.credential-value button {
		background: #e2e8f0;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		white-space: nowrap;
	}

	.credential-value button:hover {
		background: #cbd5e1;
	}

	.copied-message {
		color: #059669;
		text-align: center;
		margin: 1rem 0;
	}

	.actions {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.form-card {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group:last-of-type {
		margin-bottom: 0;
	}

	.form-group label {
		display: block;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.required {
		color: #dc2626;
	}

	input[type='text'],
	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		font-size: 1rem;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-primary {
		display: inline-block;
		background: #2563eb;
		color: white;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		text-decoration: none;
		font-weight: 500;
		cursor: pointer;
	}

	.btn-primary:hover {
		background: #1d4ed8;
	}

	.btn-secondary {
		display: inline-block;
		background: white;
		color: #64748b;
		padding: 0.75rem 1.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		text-decoration: none;
		cursor: pointer;
	}

	.btn-secondary:hover {
		background: #f8fafc;
	}
</style>
