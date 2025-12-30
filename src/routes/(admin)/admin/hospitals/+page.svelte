<script lang="ts">
	let { data } = $props();
</script>

<div class="hospitals-page">
	<div class="header">
		<h1>病院管理</h1>
		<a href="/admin/hospitals/new" class="btn-primary">+ 新規作成</a>
	</div>

	{#if data.hospitals.length === 0}
		<div class="empty-state">
			<p>病院アカウントがまだありません</p>
			<a href="/admin/hospitals/new" class="btn-primary">最初の病院を作成</a>
		</div>
	{:else}
		<div class="hospitals-table">
			<table>
				<thead>
					<tr>
						<th>病院名</th>
						<th>スラッグ</th>
						<th>メンバー数</th>
						<th>作成日</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.hospitals as hospital}
						<tr>
							<td>{hospital.name}</td>
							<td><code>{hospital.slug}</code></td>
							<td>{hospital.memberCount}</td>
							<td>{new Date(hospital.createdAt).toLocaleDateString('ja-JP')}</td>
							<td>
								<a href="/admin/hospitals/{hospital.id}" class="btn-link">詳細</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.hospitals-page {
		max-width: 1200px;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	h1 {
		margin: 0;
	}

	.btn-primary {
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

	.btn-link {
		color: #2563eb;
		text-decoration: none;
	}

	.btn-link:hover {
		text-decoration: underline;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 8px;
	}

	.empty-state p {
		color: #64748b;
		margin-bottom: 1.5rem;
	}

	.hospitals-table {
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

	code {
		background: #f1f5f9;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	tbody tr:hover {
		background: #f8fafc;
	}
</style>
