<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<div class="new-hospital-page">
	<h1>病院アカウント作成</h1>
	<p>新しい病院アカウントを作成し、病院管理者を招待します</p>

	{#if form?.error}
		<div class="error-message">{form.error}</div>
	{/if}

	<form method="POST" use:enhance class="form">
		<div class="form-section">
			<h2>病院情報</h2>

			<div class="form-group">
				<label for="name">病院名 *</label>
				<input type="text" id="name" name="name" required value={form?.values?.name ?? ''} />
			</div>

			<div class="form-group">
				<label for="slug">スラッグ（URL用）*</label>
				<input
					type="text"
					id="slug"
					name="slug"
					required
					pattern="[a-z0-9-]+"
					value={form?.values?.slug ?? ''}
				/>
				<p class="hint">半角英数字とハイフンのみ。例: tokyo-hospital</p>
			</div>
		</div>

		<div class="form-section">
			<h2>病院管理者の招待</h2>
			<p class="section-desc">この病院の管理者となる方のメールアドレスを入力してください</p>

			<div class="form-group">
				<label for="adminEmail">管理者メールアドレス *</label>
				<input
					type="email"
					id="adminEmail"
					name="adminEmail"
					required
					value={form?.values?.adminEmail ?? ''}
				/>
			</div>
		</div>

		<div class="form-actions">
			<a href="/admin/hospitals" class="btn-secondary">キャンセル</a>
			<button type="submit" class="btn-primary">作成して招待を送信</button>
		</div>
	</form>
</div>

<style>
	.new-hospital-page {
		max-width: 600px;
	}

	h1 {
		margin-bottom: 0.5rem;
	}

	h1 + p {
		color: #64748b;
		margin-bottom: 2rem;
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

	.form-section {
		margin-bottom: 2rem;
	}

	.form-section h2 {
		font-size: 1.125rem;
		margin-bottom: 0.5rem;
	}

	.section-desc {
		color: #64748b;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		font-size: 1rem;
	}

	input:focus {
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
