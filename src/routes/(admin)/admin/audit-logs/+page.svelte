<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let { data } = $props();

	function formatDate(date: Date | string): string {
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleString('ja-JP', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	function applyFilters(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const params = new URLSearchParams();

		for (const [key, value] of formData.entries()) {
			if (value && typeof value === 'string' && value.trim()) {
				params.set(key, value.trim());
			}
		}

		goto(`/admin/audit-logs?${params.toString()}`);
	}

	function clearFilters() {
		goto('/admin/audit-logs');
	}

	function changePage(newPage: number) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', newPage.toString());
		goto(`/admin/audit-logs?${params.toString()}`);
	}
</script>

<svelte:head>
	<title>監査ログ - Document Creation</title>
</svelte:head>

<div class="audit-logs-page">
	<div class="page-header">
		<h1>監査ログ</h1>
		<p class="description">システム内の操作履歴を確認できます</p>
	</div>

	<div class="filters-section">
		<form onsubmit={applyFilters}>
			<div class="filter-row">
				<div class="filter-group">
					<label for="hospitalId">病院</label>
					<select name="hospitalId" id="hospitalId" value={data.filters.hospitalId || ''}>
						<option value="">すべて</option>
						{#each data.hospitalList as hospital (hospital.id)}
							<option value={hospital.id}>{hospital.name}</option>
						{/each}
					</select>
				</div>

				<div class="filter-group">
					<label for="userId">ユーザー</label>
					<select name="userId" id="userId" value={data.filters.userId || ''}>
						<option value="">すべて</option>
						{#each data.userList as user (user.id)}
							<option value={user.id}>{user.name || user.email}</option>
						{/each}
					</select>
				</div>

				<div class="filter-group">
					<label for="action">操作種別</label>
					<select name="action" id="action" value={data.filters.action || ''}>
						<option value="">すべて</option>
						{#each Object.entries(data.actionLabels) as [value, label] (value)}
							<option {value}>{label}</option>
						{/each}
					</select>
				</div>

				<div class="filter-group">
					<label for="targetType">対象種別</label>
					<select name="targetType" id="targetType" value={data.filters.targetType || ''}>
						<option value="">すべて</option>
						{#each Object.entries(data.targetTypeLabels) as [value, label] (value)}
							<option {value}>{label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="filter-row">
				<div class="filter-group">
					<label for="dateFrom">期間（開始）</label>
					<input type="date" name="dateFrom" id="dateFrom" value={data.filters.dateFrom || ''} />
				</div>

				<div class="filter-group">
					<label for="dateTo">期間（終了）</label>
					<input type="date" name="dateTo" id="dateTo" value={data.filters.dateTo || ''} />
				</div>

				<div class="filter-actions">
					<button type="submit" class="btn btn-primary">検索</button>
					<button type="button" class="btn btn-secondary" onclick={clearFilters}>クリア</button>
				</div>
			</div>
		</form>
	</div>

	<div class="results-info">
		全 {data.total} 件中 {(data.page - 1) * 50 + 1} - {Math.min(data.page * 50, data.total)} 件を表示
	</div>

	<div class="table-container">
		<table class="audit-table">
			<thead>
				<tr>
					<th>日時</th>
					<th>操作種別</th>
					<th>対象</th>
					<th>ユーザー</th>
					<th>病院</th>
					<th>結果</th>
					<th>詳細</th>
				</tr>
			</thead>
			<tbody>
				{#each data.logs as log (log.id)}
					<tr class:error={!log.success}>
						<td class="date-cell">{formatDate(log.createdAt)}</td>
						<td>
							<span class="action-badge">{data.actionLabels[log.action] || log.action}</span>
						</td>
						<td>
							<span class="target-type">{data.targetTypeLabels[log.targetType] || log.targetType}</span>
							{#if log.targetName}
								<span class="target-name">{log.targetName}</span>
							{/if}
						</td>
						<td class="user-cell">
							<span class="user-name">{log.userName}</span>
						</td>
						<td>{log.hospitalName || '-'}</td>
						<td>
							{#if log.success}
								<span class="status-success">成功</span>
							{:else}
								<span class="status-error">失敗</span>
							{/if}
						</td>
						<td>
							<button
								class="btn-details"
								onclick={() => {
									alert(JSON.stringify({ metadata: log.metadata, changes: log.changes, errorMessage: log.errorMessage, ipAddress: log.ipAddress, userAgent: log.userAgent }, null, 2));
								}}
							>
								詳細
							</button>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="7" class="empty-row">監査ログがありません</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.totalPages > 1}
		<div class="pagination">
			<button
				class="btn-page"
				disabled={data.page <= 1}
				onclick={() => changePage(data.page - 1)}
			>
				前へ
			</button>

			{#each Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
				const start = Math.max(1, data.page - 2);
				return start + i;
			}).filter((p) => p <= data.totalPages) as pageNum (pageNum)}
				<button
					class="btn-page"
					class:active={pageNum === data.page}
					onclick={() => changePage(pageNum)}
				>
					{pageNum}
				</button>
			{/each}

			<button
				class="btn-page"
				disabled={data.page >= data.totalPages}
				onclick={() => changePage(data.page + 1)}
			>
				次へ
			</button>
		</div>
	{/if}
</div>

<style>
	.audit-logs-page {
		max-width: 1400px;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0 0 0.5rem;
		font-size: 1.5rem;
	}

	.description {
		color: #666;
		margin: 0;
	}

	.filters-section {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.filter-row {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.filter-row:last-child {
		margin-bottom: 0;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 180px;
	}

	.filter-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #333;
	}

	.filter-group select,
	.filter-group input {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.filter-actions {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover {
		background: #2563eb;
	}

	.btn-secondary {
		background: #e5e7eb;
		color: #374151;
	}

	.btn-secondary:hover {
		background: #d1d5db;
	}

	.results-info {
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: #666;
	}

	.table-container {
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.audit-table {
		width: 100%;
		border-collapse: collapse;
	}

	.audit-table th,
	.audit-table td {
		padding: 0.75rem 1rem;
		text-align: left;
		border-bottom: 1px solid #eee;
	}

	.audit-table th {
		background: #f9fafb;
		font-weight: 600;
		font-size: 0.875rem;
		color: #374151;
	}

	.audit-table tbody tr:hover {
		background: #f9fafb;
	}

	.audit-table tbody tr.error {
		background: #fef2f2;
	}

	.date-cell {
		font-size: 0.875rem;
		white-space: nowrap;
	}

	.action-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		background: #e0f2fe;
		color: #0369a1;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.target-type {
		display: block;
		font-size: 0.75rem;
		color: #666;
	}

	.target-name {
		display: block;
		font-weight: 500;
	}

	.user-cell .user-name {
		font-weight: 500;
	}

	.status-success {
		color: #16a34a;
		font-weight: 500;
	}

	.status-error {
		color: #dc2626;
		font-weight: 500;
	}

	.btn-details {
		padding: 0.25rem 0.5rem;
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.75rem;
	}

	.btn-details:hover {
		background: #e5e7eb;
	}

	.empty-row {
		text-align: center;
		color: #666;
		padding: 2rem !important;
	}

	.pagination {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.btn-page {
		padding: 0.5rem 1rem;
		border: 1px solid #ddd;
		background: white;
		border-radius: 4px;
		cursor: pointer;
	}

	.btn-page:hover:not(:disabled) {
		background: #f3f4f6;
	}

	.btn-page.active {
		background: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.btn-page:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
