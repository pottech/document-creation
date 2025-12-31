<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let showDeleteConfirm = $state(false);
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

	<div class="page-header">
		<div>
			<h1>{data.client.name}</h1>
			{#if data.client.description}
				<p class="description">{data.client.description}</p>
			{/if}
		</div>
		<div class="status">
			{#if data.client.isEnabled}
				<span class="status-badge enabled">有効</span>
			{:else}
				<span class="status-badge disabled">無効</span>
			{/if}
		</div>
	</div>

	{#if form?.error}
		<div class="error-message">{form.error}</div>
	{/if}

	{#if form?.action === 'regenerate' && form?.newSecret}
		<div class="secret-card">
			<h3>新しいClient Secret</h3>
			<p class="warning">
				このSecretは一度だけ表示されます。必ずコピーして安全な場所に保存してください。
			</p>
			<div class="secret-value">
				<code>{form.newSecret}</code>
				<button type="button" onclick={() => copyToClipboard(form.newSecret)}>コピー</button>
			</div>
			{#if copied}
				<div class="copied-message">クリップボードにコピーしました</div>
			{/if}
		</div>
	{/if}

	<div class="info-card">
		<h2>クライアント情報</h2>

		<dl class="info-list">
			<div class="info-item">
				<dt>Client ID</dt>
				<dd>
					<code>{data.client.keycloakClientId}</code>
					<button
						type="button"
						class="copy-btn"
						onclick={() => copyToClipboard(data.client.keycloakClientId)}
					>
						コピー
					</button>
				</dd>
			</div>

			<div class="info-item">
				<dt>作成者</dt>
				<dd>{data.client.createdByUser.name} ({data.client.createdByUser.email})</dd>
			</div>

			<div class="info-item">
				<dt>作成日時</dt>
				<dd>{new Date(data.client.createdAt).toLocaleString('ja-JP')}</dd>
			</div>

			<div class="info-item">
				<dt>更新日時</dt>
				<dd>{new Date(data.client.updatedAt).toLocaleString('ja-JP')}</dd>
			</div>
		</dl>
	</div>

	<div class="actions-card">
		<h2>操作</h2>

		<div class="action-group">
			<div class="action-item">
				<div class="action-info">
					<h3>状態の切り替え</h3>
					<p>APIクライアントを{data.client.isEnabled ? '無効' : '有効'}にします。</p>
				</div>
				<form method="POST" action="?/toggleEnabled" use:enhance>
					<button type="submit" class="btn-secondary">
						{data.client.isEnabled ? '無効にする' : '有効にする'}
					</button>
				</form>
			</div>

			<div class="action-item">
				<div class="action-info">
					<h3>Client Secretの再生成</h3>
					<p>新しいSecretを生成します。古いSecretは使用できなくなります。</p>
				</div>
				<form method="POST" action="?/regenerateSecret" use:enhance>
					<button type="submit" class="btn-warning">再生成</button>
				</form>
			</div>

			<div class="action-item danger">
				<div class="action-info">
					<h3>APIクライアントの削除</h3>
					<p>このAPIクライアントを完全に削除します。この操作は取り消せません。</p>
				</div>
				{#if showDeleteConfirm}
					<div class="delete-confirm">
						<p>本当に削除しますか？</p>
						<div class="delete-buttons">
							<form method="POST" action="?/delete" use:enhance>
								<button type="submit" class="btn-danger">削除する</button>
							</form>
							<button type="button" class="btn-secondary" onclick={() => (showDeleteConfirm = false)}>
								キャンセル
							</button>
						</div>
					</div>
				{:else}
					<button type="button" class="btn-danger" onclick={() => (showDeleteConfirm = true)}>
						削除
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.page {
		max-width: 800px;
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

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
	}

	h1 {
		margin: 0 0 0.5rem 0;
	}

	.description {
		color: #64748b;
		margin: 0;
	}

	.error-message {
		background: #fef2f2;
		color: #dc2626;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1.5rem;
	}

	.secret-card {
		background: #fef3c7;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.secret-card h3 {
		margin: 0 0 0.5rem 0;
		color: #92400e;
	}

	.warning {
		color: #92400e;
		margin: 0 0 1rem 0;
	}

	.secret-value {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.secret-value code {
		flex: 1;
		background: white;
		padding: 0.75rem;
		border-radius: 4px;
		font-size: 0.875rem;
		word-break: break-all;
	}

	.secret-value button {
		background: #92400e;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.copied-message {
		color: #059669;
		margin-top: 0.5rem;
	}

	.info-card,
	.actions-card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 1.5rem;
	}

	.info-card h2,
	.actions-card h2 {
		font-size: 1rem;
		color: #64748b;
		margin: 0 0 1rem 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.info-list {
		margin: 0;
	}

	.info-item {
		display: flex;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f1f5f9;
	}

	.info-item:last-child {
		border-bottom: none;
	}

	.info-item dt {
		width: 140px;
		flex-shrink: 0;
		color: #64748b;
		font-weight: 500;
	}

	.info-item dd {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	code {
		background: #f1f5f9;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.copy-btn {
		background: #e2e8f0;
		border: none;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.copy-btn:hover {
		background: #cbd5e1;
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.status-badge.enabled {
		background: #d1fae5;
		color: #065f46;
	}

	.status-badge.disabled {
		background: #fee2e2;
		color: #991b1b;
	}

	.action-group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.action-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 4px;
	}

	.action-item.danger {
		background: #fef2f2;
	}

	.action-info h3 {
		margin: 0 0 0.25rem 0;
		font-size: 0.875rem;
	}

	.action-info p {
		margin: 0;
		font-size: 0.875rem;
		color: #64748b;
	}

	.delete-confirm {
		text-align: right;
	}

	.delete-confirm p {
		margin: 0 0 0.5rem 0;
		color: #dc2626;
		font-weight: 500;
	}

	.delete-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.btn-secondary {
		background: white;
		color: #64748b;
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		cursor: pointer;
	}

	.btn-secondary:hover {
		background: #f8fafc;
	}

	.btn-warning {
		background: #f59e0b;
		color: white;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.btn-warning:hover {
		background: #d97706;
	}

	.btn-danger {
		background: #dc2626;
		color: white;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.btn-danger:hover {
		background: #b91c1c;
	}
</style>
