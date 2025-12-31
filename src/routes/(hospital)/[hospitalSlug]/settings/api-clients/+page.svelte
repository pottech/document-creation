<script lang="ts">
	let { data } = $props();
</script>

<div class="page">
	<a href="/{data.hospital.slug}/settings" class="back-link">&larr; 設定に戻る</a>

	<div class="page-header">
		<h1>APIクライアント管理</h1>
		<a href="/{data.hospital.slug}/settings/api-clients/new" class="btn-primary">新規作成</a>
	</div>

	{#if data.clients.length === 0}
		<div class="empty-state">
			<p>APIクライアントがありません。</p>
			<p>「新規作成」ボタンからAPIクライアントを作成してください。</p>
		</div>
	{:else}
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>名前</th>
						<th>Client ID</th>
						<th>状態</th>
						<th>作成日</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.clients as client}
						<tr>
							<td>
								<div class="client-name">{client.name}</div>
								{#if client.description}
									<div class="client-description">{client.description}</div>
								{/if}
							</td>
							<td>
								<code>{client.keycloakClientId}</code>
							</td>
							<td>
								{#if client.isEnabled}
									<span class="status-badge enabled">有効</span>
								{:else}
									<span class="status-badge disabled">無効</span>
								{/if}
							</td>
							<td>
								{new Date(client.createdAt).toLocaleDateString('ja-JP')}
							</td>
							<td>
								<a href="/{data.hospital.slug}/settings/api-clients/{client.id}" class="link"
									>詳細</a
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1000px;
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
		align-items: center;
		margin-bottom: 2rem;
	}

	h1 {
		margin: 0;
	}

	.btn-primary {
		display: inline-block;
		background: #2563eb;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		text-decoration: none;
		font-weight: 500;
	}

	.btn-primary:hover {
		background: #1d4ed8;
	}

	.empty-state {
		background: white;
		padding: 3rem;
		border-radius: 8px;
		text-align: center;
		color: #64748b;
	}

	.empty-state p {
		margin: 0.5rem 0;
	}

	.table-wrapper {
		background: white;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid #e2e8f0;
	}

	th {
		background: #f8fafc;
		font-weight: 500;
		color: #64748b;
		font-size: 0.875rem;
	}

	tbody tr:hover {
		background: #f8fafc;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	.client-name {
		font-weight: 500;
	}

	.client-description {
		font-size: 0.875rem;
		color: #64748b;
		margin-top: 0.25rem;
	}

	code {
		background: #f1f5f9;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
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

	.link {
		color: #2563eb;
		text-decoration: none;
	}

	.link:hover {
		text-decoration: underline;
	}
</style>
