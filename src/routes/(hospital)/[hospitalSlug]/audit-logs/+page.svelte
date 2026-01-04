<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let { data } = $props();

	const basePath = $derived(`/${data.hospital?.slug}/audit-logs`);
	let showDetailModal = $state(false);
	let selectedLog = $state<typeof data.logs[0] | null>(null);

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

		goto(`${basePath}?${params.toString()}`);
	}

	function clearFilters() {
		goto(basePath);
	}

	function changePage(newPage: number) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', newPage.toString());
		goto(`${basePath}?${params.toString()}`);
	}

	function showDetails(log: typeof data.logs[0]) {
		selectedLog = log;
		showDetailModal = true;
	}
</script>

<div class="audit-logs-page">
	<header class="page-header">
		<div class="header-left">
			<h1>操作履歴</h1>
			<p class="subtitle">この病院での操作履歴を確認できます</p>
		</div>
	</header>

	<div class="filters-card">
		<form onsubmit={applyFilters}>
			<div class="filter-grid">
				<div class="filter-group">
					<label for="userId">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
							<circle cx="12" cy="7" r="4" />
						</svg>
						ユーザー
					</label>
					<select name="userId" id="userId" value={data.filters.userId || ''}>
						<option value="">すべて</option>
						{#each data.userList as user (user.id)}
							<option value={user.id}>{user.name || user.email}</option>
						{/each}
					</select>
				</div>

				<div class="filter-group">
					<label for="action">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="9 11 12 14 22 4" />
							<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
						</svg>
						操作種別
					</label>
					<select name="action" id="action" value={data.filters.action || ''}>
						<option value="">すべて</option>
						{#each Object.entries(data.actionLabels) as [value, label] (value)}
							<option {value}>{label}</option>
						{/each}
					</select>
				</div>

				<div class="filter-group">
					<label for="targetType">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
							<circle cx="8.5" cy="8.5" r="1.5" />
							<polyline points="21 15 16 10 5 21" />
						</svg>
						対象種別
					</label>
					<select name="targetType" id="targetType" value={data.filters.targetType || ''}>
						<option value="">すべて</option>
						{#each Object.entries(data.targetTypeLabels) as [value, label] (value)}
							<option {value}>{label}</option>
						{/each}
					</select>
				</div>

				<div class="filter-group">
					<label for="dateFrom">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
							<line x1="16" y1="2" x2="16" y2="6" />
							<line x1="8" y1="2" x2="8" y2="6" />
							<line x1="3" y1="10" x2="21" y2="10" />
						</svg>
						開始日
					</label>
					<input type="date" name="dateFrom" id="dateFrom" value={data.filters.dateFrom || ''} />
				</div>

				<div class="filter-group">
					<label for="dateTo">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
							<line x1="16" y1="2" x2="16" y2="6" />
							<line x1="8" y1="2" x2="8" y2="6" />
							<line x1="3" y1="10" x2="21" y2="10" />
						</svg>
						終了日
					</label>
					<input type="date" name="dateTo" id="dateTo" value={data.filters.dateTo || ''} />
				</div>

				<div class="filter-actions">
					<button type="submit" class="btn-search">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="11" cy="11" r="8" />
							<line x1="21" y1="21" x2="16.65" y2="16.65" />
						</svg>
						検索
					</button>
					<button type="button" class="btn-clear" onclick={clearFilters}>クリア</button>
				</div>
			</div>
		</form>
	</div>

	<div class="content-card">
		<div class="card-header">
			<h2>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 8v4l3 3" />
					<circle cx="12" cy="12" r="10" />
				</svg>
				操作履歴
			</h2>
			<div class="results-info">
				{#if data.total > 0}
					<span class="count">{(data.page - 1) * 50 + 1} - {Math.min(data.page * 50, data.total)}</span>
					<span class="separator">/</span>
					<span class="total">{data.total}件</span>
				{:else}
					<span class="total">0件</span>
				{/if}
			</div>
		</div>

		{#if data.logs.length === 0}
			<div class="empty-state">
				<div class="empty-icon">
					<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M12 8v4l3 3" />
						<circle cx="12" cy="12" r="10" />
					</svg>
				</div>
				<p>操作履歴がありません</p>
			</div>
		{:else}
			<div class="log-list">
				{#each data.logs as log, i (log.id)}
					<div class="log-card" class:error={!log.success} style="animation-delay: {i * 0.02}s">
						<div class="log-icon" class:success={log.success} class:failure={!log.success}>
							{#if log.success}
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="20 6 9 17 4 12" />
								</svg>
							{:else}
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="10" />
									<line x1="15" y1="9" x2="9" y2="15" />
									<line x1="9" y1="9" x2="15" y2="15" />
								</svg>
							{/if}
						</div>
						<div class="log-content">
							<div class="log-header">
								<span class="action-badge">{data.actionLabels[log.action] || log.action}</span>
								<span class="timestamp">{formatDate(log.createdAt)}</span>
							</div>
							<div class="log-details">
								<span class="target-type">{data.targetTypeLabels[log.targetType] || log.targetType}</span>
								{#if log.targetName}
									<span class="target-name">{log.targetName}</span>
								{/if}
							</div>
							<div class="log-user">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
									<circle cx="12" cy="7" r="4" />
								</svg>
								{log.userName}
							</div>
						</div>
						<button class="btn-detail" onclick={() => showDetails(log)} aria-label="詳細を表示">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10" />
								<line x1="12" y1="16" x2="12" y2="12" />
								<line x1="12" y1="8" x2="12.01" y2="8" />
							</svg>
						</button>
					</div>
				{/each}
			</div>

			{#if data.totalPages > 1}
				<div class="pagination">
					<button
						class="page-btn"
						disabled={data.page <= 1}
						onclick={() => changePage(data.page - 1)}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="15 18 9 12 15 6" />
						</svg>
						前へ
					</button>

					<div class="page-numbers">
						{#each Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
							const start = Math.max(1, data.page - 2);
							return start + i;
						}).filter((p) => p <= data.totalPages) as pageNum (pageNum)}
							<button
								class="page-num"
								class:active={pageNum === data.page}
								onclick={() => changePage(pageNum)}
							>
								{pageNum}
							</button>
						{/each}
					</div>

					<button
						class="page-btn"
						disabled={data.page >= data.totalPages}
						onclick={() => changePage(data.page + 1)}
					>
						次へ
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="9 18 15 12 9 6" />
						</svg>
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>

{#if showDetailModal && selectedLog}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={() => (showDetailModal = false)}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>
					<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="16" x2="12" y2="12" />
						<line x1="12" y1="8" x2="12.01" y2="8" />
					</svg>
					操作詳細
				</h3>
				<button class="close-btn" onclick={() => (showDetailModal = false)} aria-label="閉じる">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>
			<div class="modal-body">
				<div class="detail-row">
					<span class="detail-label">日時</span>
					<span class="detail-value">{formatDate(selectedLog.createdAt)}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">操作種別</span>
					<span class="detail-value">
						<span class="action-badge">{data.actionLabels[selectedLog.action] || selectedLog.action}</span>
					</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">対象</span>
					<span class="detail-value">
						{data.targetTypeLabels[selectedLog.targetType] || selectedLog.targetType}
						{#if selectedLog.targetName}
							- {selectedLog.targetName}
						{/if}
					</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">ユーザー</span>
					<span class="detail-value">{selectedLog.userName}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">結果</span>
					<span class="detail-value">
						{#if selectedLog.success}
							<span class="status-success">成功</span>
						{:else}
							<span class="status-error">失敗</span>
						{/if}
					</span>
				</div>
				{#if selectedLog.ipAddress}
					<div class="detail-row">
						<span class="detail-label">IPアドレス</span>
						<span class="detail-value mono">{selectedLog.ipAddress}</span>
					</div>
				{/if}
				{#if selectedLog.errorMessage}
					<div class="detail-row error-row">
						<span class="detail-label">エラー</span>
						<span class="detail-value error">{selectedLog.errorMessage}</span>
					</div>
				{/if}
				{#if selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0}
					<div class="detail-section">
						<span class="section-label">メタデータ</span>
						<pre class="json-view">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
					</div>
				{/if}
				{#if selectedLog.changes && Object.keys(selectedLog.changes).length > 0}
					<div class="detail-section">
						<span class="section-label">変更内容</span>
						<pre class="json-view">{JSON.stringify(selectedLog.changes, null, 2)}</pre>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.audit-logs-page {
		max-width: 1200px;
		animation: fadeIn 0.4s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.header-left h1 {
		margin: 0 0 0.25rem;
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a2b3c;
		letter-spacing: -0.02em;
	}

	.subtitle {
		margin: 0;
		color: #6b7c8c;
		font-size: 0.9375rem;
	}

	.filters-card {
		background: white;
		padding: 1.5rem;
		border-radius: 16px;
		box-shadow: 0 2px 12px rgba(15, 76, 92, 0.06);
		margin-bottom: 1.5rem;
	}

	.filter-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 1rem;
		align-items: end;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-group label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #4a5b6c;
	}

	.filter-group label svg {
		color: #9ba8b5;
	}

	.filter-group select,
	.filter-group input {
		padding: 0.75rem 1rem;
		border: 2px solid #e8eef3;
		border-radius: 10px;
		font-size: 0.9375rem;
		color: #1a2b3c;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
		font-family: inherit;
		background: white;
	}

	.filter-group select:focus,
	.filter-group input:focus {
		outline: none;
		border-color: #5dd9c1;
		box-shadow: 0 0 0 3px rgba(93, 217, 193, 0.15);
	}

	.filter-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-search {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.75rem 1.25rem;
		background: linear-gradient(135deg, #0f4c5c 0%, #0a3642 100%);
		color: white;
		border: none;
		border-radius: 10px;
		font-weight: 600;
		font-size: 0.9375rem;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(15, 76, 92, 0.25);
		transition: all 0.2s ease;
		font-family: inherit;
	}

	.btn-search:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(15, 76, 92, 0.35);
	}

	.btn-clear {
		padding: 0.75rem 1.25rem;
		background: #f0f4f8;
		border: none;
		border-radius: 10px;
		font-weight: 600;
		font-size: 0.9375rem;
		color: #4a5b6c;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
	}

	.btn-clear:hover {
		background: #e8eef3;
	}

	.content-card {
		background: white;
		border-radius: 16px;
		box-shadow: 0 2px 12px rgba(15, 76, 92, 0.06);
		overflow: hidden;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid #f0f4f8;
	}

	.card-header h2 {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #1a2b3c;
	}

	.card-header h2 svg {
		color: #5dd9c1;
	}

	.results-info {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.875rem;
	}

	.results-info .count {
		font-weight: 600;
		color: #0f4c5c;
	}

	.results-info .separator {
		color: #c0c8d0;
	}

	.results-info .total {
		color: #6b7c8c;
	}

	.empty-state {
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-icon {
		color: #c0c8d0;
		margin-bottom: 1rem;
	}

	.empty-state p {
		color: #6b7c8c;
		margin: 0;
	}

	.log-list {
		display: flex;
		flex-direction: column;
	}

	.log-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #f0f4f8;
		animation: rowFadeIn 0.3s ease-out both;
		transition: background 0.2s ease;
	}

	@keyframes rowFadeIn {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.log-card:hover {
		background: #fafbfc;
	}

	.log-card.error {
		background: #fef8f8;
	}

	.log-card.error:hover {
		background: #fef2f2;
	}

	.log-icon {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.log-icon.success {
		background: linear-gradient(135deg, #e8f8f5 0%, #d0f0ea 100%);
		color: #16a34a;
	}

	.log-icon.failure {
		background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
		color: #dc2626;
	}

	.log-content {
		flex: 1;
		min-width: 0;
	}

	.log-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.375rem;
	}

	.action-badge {
		display: inline-block;
		padding: 0.25rem 0.625rem;
		background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
		color: #0369a1;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.timestamp {
		font-size: 0.8125rem;
		color: #9ba8b5;
	}

	.log-details {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.375rem;
	}

	.target-type {
		font-size: 0.75rem;
		color: #6b7c8c;
		background: #f0f4f8;
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
	}

	.target-name {
		font-weight: 500;
		color: #1a2b3c;
	}

	.log-user {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: #6b7c8c;
	}

	.btn-detail {
		width: 36px;
		height: 36px;
		background: #f0f4f8;
		border: none;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #6b7c8c;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-detail:hover {
		background: #e8eef3;
		color: #0f4c5c;
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem;
		border-top: 1px solid #f0f4f8;
	}

	.page-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.625rem 1rem;
		background: #f0f4f8;
		border: none;
		border-radius: 8px;
		color: #4a5b6c;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
	}

	.page-btn:hover:not(:disabled) {
		background: #e8eef3;
	}

	.page-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.page-numbers {
		display: flex;
		gap: 0.375rem;
	}

	.page-num {
		width: 36px;
		height: 36px;
		background: none;
		border: 2px solid #e8eef3;
		border-radius: 8px;
		color: #4a5b6c;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
	}

	.page-num:hover {
		border-color: #5dd9c1;
	}

	.page-num.active {
		background: linear-gradient(135deg, #0f4c5c 0%, #0a3642 100%);
		border-color: transparent;
		color: white;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(10, 30, 40, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 100;
		animation: overlayFadeIn 0.2s ease-out;
	}

	@keyframes overlayFadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.modal {
		background: white;
		border-radius: 20px;
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		animation: modalSlideIn 0.3s ease-out;
	}

	@keyframes modalSlideIn {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(20px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #f0f4f8;
	}

	.modal-header h3 {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		margin: 0;
		font-size: 1.125rem;
		font-weight: 700;
		color: #1a2b3c;
	}

	.modal-header h3 svg {
		color: #5dd9c1;
	}

	.close-btn {
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		color: #9ba8b5;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		background: #f0f4f8;
		color: #4a5b6c;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f0f4f8;
	}

	.detail-row:last-of-type {
		border-bottom: none;
	}

	.detail-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #6b7c8c;
		min-width: 100px;
	}

	.detail-value {
		font-size: 0.9375rem;
		color: #1a2b3c;
		text-align: right;
	}

	.detail-value.mono {
		font-family: 'SF Mono', Monaco, monospace;
		font-size: 0.875rem;
	}

	.detail-value.error {
		color: #dc2626;
	}

	.status-success {
		color: #16a34a;
		font-weight: 600;
	}

	.status-error {
		color: #dc2626;
		font-weight: 600;
	}

	.error-row {
		background: #fef2f2;
		margin: 0 -1.5rem;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
	}

	.detail-section {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #f0f4f8;
	}

	.section-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 600;
		color: #6b7c8c;
		margin-bottom: 0.75rem;
	}

	.json-view {
		background: #fafbfc;
		padding: 1rem;
		border-radius: 10px;
		font-family: 'SF Mono', Monaco, monospace;
		font-size: 0.8125rem;
		color: #4a5b6c;
		overflow-x: auto;
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
	}
</style>
