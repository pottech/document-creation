<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
</script>

<div class="invite-page">
	<a href="/{data.hospital?.slug}/members" class="back-link">← メンバー管理に戻る</a>

	<h1>ユーザーを招待</h1>
	<p>新しいメンバーを {data.hospital?.name} に招待します</p>

	{#if form?.success}
		<div class="success-message">
			招待を送信しました。招待リンクがコンソールに出力されています。
		</div>
	{/if}

	{#if form?.error}
		<div class="error-message">{form.error}</div>
	{/if}

	<form method="POST" use:enhance class="form">
		<div class="form-group">
			<label for="email">メールアドレス *</label>
			<input type="email" id="email" name="email" required value={form?.values?.email ?? ''} />
		</div>

		<div class="form-group">
			<label for="role">ロール *</label>
			<select id="role" name="role" required>
				<option value="hospital_user">病院ユーザー</option>
				<option value="hospital_admin">病院管理者</option>
			</select>
			<p class="hint">病院管理者は他のユーザーを招待できます</p>
		</div>

		<div class="form-actions">
			<a href="/{data.hospital?.slug}/members" class="btn-secondary">キャンセル</a>
			<button type="submit" class="btn-primary">招待を送信</button>
		</div>
	</form>
</div>

<style>
	.invite-page {
		max-width: 500px;
	}

	.back-link {
		color: #64748b;
		text-decoration: none;
		font-size: 0.875rem;
	}

	.back-link:hover {
		color: #2563eb;
	}

	h1 {
		margin: 1rem 0 0.5rem;
	}

	h1 + p {
		color: #64748b;
		margin-bottom: 2rem;
	}

	.success-message {
		background: #dcfce7;
		color: #16a34a;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1.5rem;
	}

	.error-message {
		background: #fef2f2;
		color: #dc2626;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1.5rem;
	}

	.form {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	input,
	select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		font-size: 1rem;
	}

	input:focus,
	select:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.hint {
		font-size: 0.75rem;
		color: #64748b;
		margin-top: 0.25rem;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-primary {
		background: #2563eb;
		color: white;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
	}

	.btn-primary:hover {
		background: #1d4ed8;
	}

	.btn-secondary {
		background: white;
		color: #64748b;
		padding: 0.75rem 1.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		text-decoration: none;
	}

	.btn-secondary:hover {
		background: #f8fafc;
	}
</style>
