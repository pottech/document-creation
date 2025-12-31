<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let showCreateModal = $state(false);
	let createError = $state('');
	let searchQuery = $state(data.search || '');

	const genderLabels: Record<string, string> = {
		male: '男性',
		female: '女性'
	};

	const statusLabels: Record<string, string> = {
		draft: '下書き',
		completed: '作成完了',
		signed: '署名済み'
	};

	function calculateAge(birthDate: string): number {
		const birth = new Date(birthDate);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		return age;
	}

	function handleSearch() {
		const params = new URLSearchParams();
		if (searchQuery) {
			params.set('search', searchQuery);
		}
		goto(`?${params.toString()}`);
	}
</script>

<div class="patients-page">
	<div class="header">
		<h1>患者管理</h1>
		<button class="btn-primary" onclick={() => (showCreateModal = true)}>+ 患者を登録</button>
	</div>

	<div class="search-bar">
		<form onsubmit={(e) => { e.preventDefault(); handleSearch(); }}>
			<input
				type="text"
				placeholder="患者番号または氏名で検索..."
				bind:value={searchQuery}
			/>
			<button type="submit" class="btn-search">検索</button>
		</form>
	</div>

	<section class="section">
		<h2>患者一覧 ({data.total}件)</h2>

		{#if data.patients.length === 0}
			<p class="empty">
				{data.search ? '検索条件に一致する患者がいません' : '登録されている患者がいません'}
			</p>
		{:else}
			<div class="patient-table">
				<table>
					<thead>
						<tr>
							<th>患者番号</th>
							<th>氏名</th>
							<th>生年月日</th>
							<th>年齢</th>
							<th>性別</th>
							<th>計画書</th>
							<th>最終作成日</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.patients as patient}
							<tr>
								<td class="patient-number">{patient.patientNumber}</td>
								<td>
									<a href="/{data.hospital?.slug}/patients/{patient.id}" class="patient-link">
										{patient.name}
									</a>
									{#if patient.nameKana}
										<span class="name-kana">{patient.nameKana}</span>
									{/if}
								</td>
								<td>{new Date(patient.birthDate).toLocaleDateString('ja-JP')}</td>
								<td>{calculateAge(patient.birthDate)}歳</td>
								<td>{genderLabels[patient.gender]}</td>
								<td>
									{#if patient.carePlanCount > 0}
										<span class="plan-count">{patient.carePlanCount}件</span>
									{:else}
										<span class="no-plan">未作成</span>
									{/if}
								</td>
								<td>
									{#if patient.latestCarePlan}
										<span class="status-badge {patient.latestCarePlan.status}">
											{statusLabels[patient.latestCarePlan.status]}
										</span>
										<span class="date">
											{new Date(patient.latestCarePlan.consultationDate).toLocaleDateString('ja-JP')}
										</span>
									{:else}
										-
									{/if}
								</td>
								<td>
									<a href="/{data.hospital?.slug}/patients/{patient.id}/care-plans/new" class="btn-action">
										計画書作成
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if data.totalPages > 1}
				<div class="pagination">
					{#if data.page > 1}
						<a href="?page={data.page - 1}{data.search ? `&search=${data.search}` : ''}" class="page-btn">
							前へ
						</a>
					{/if}
					<span class="page-info">{data.page} / {data.totalPages}</span>
					{#if data.page < data.totalPages}
						<a href="?page={data.page + 1}{data.search ? `&search=${data.search}` : ''}" class="page-btn">
							次へ
						</a>
					{/if}
				</div>
			{/if}
		{/if}
	</section>
</div>

<!-- 患者登録モーダル -->
{#if showCreateModal}
	<div class="modal-overlay" onclick={() => (showCreateModal = false)}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>患者を登録</h3>
				<button class="close-btn" onclick={() => (showCreateModal = false)}>&times;</button>
			</div>
			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							showCreateModal = false;
							createError = '';
							await update();
						} else if (result.type === 'failure') {
							createError = (result.data?.error as string) || '登録に失敗しました';
						}
					};
				}}
			>
				{#if createError}
					<div class="error-message">{createError}</div>
				{/if}

				<div class="form-group">
					<label for="patientNumber">患者番号 *</label>
					<input type="text" id="patientNumber" name="patientNumber" required />
				</div>

				<div class="form-group">
					<label for="name">氏名 *</label>
					<input type="text" id="name" name="name" required />
				</div>

				<div class="form-group">
					<label for="nameKana">氏名（カナ）</label>
					<input type="text" id="nameKana" name="nameKana" />
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="birthDate">生年月日 *</label>
						<input type="date" id="birthDate" name="birthDate" required />
					</div>

					<div class="form-group">
						<label for="gender">性別 *</label>
						<select id="gender" name="gender" required>
							<option value="">選択してください</option>
							<option value="male">男性</option>
							<option value="female">女性</option>
						</select>
					</div>
				</div>

				<div class="modal-actions">
					<button type="button" class="btn-cancel" onclick={() => (showCreateModal = false)}>
						キャンセル
					</button>
					<button type="submit" class="btn-primary">登録</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.patients-page {
		max-width: 1100px;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
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
		border: none;
		cursor: pointer;
	}

	.btn-primary:hover {
		background: #1d4ed8;
	}

	.search-bar {
		margin-bottom: 1.5rem;
	}

	.search-bar form {
		display: flex;
		gap: 0.5rem;
	}

	.search-bar input {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.btn-search {
		padding: 0.75rem 1.5rem;
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		cursor: pointer;
	}

	.btn-search:hover {
		background: #e2e8f0;
	}

	.section {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.section h2 {
		font-size: 1rem;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.empty {
		color: #64748b;
		font-size: 0.875rem;
		text-align: center;
		padding: 2rem;
	}

	.patient-table {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #f1f5f9;
	}

	th {
		font-weight: 500;
		color: #64748b;
		font-size: 0.875rem;
		white-space: nowrap;
	}

	.patient-number {
		font-family: monospace;
		font-size: 0.875rem;
	}

	.patient-link {
		color: #2563eb;
		text-decoration: none;
		font-weight: 500;
	}

	.patient-link:hover {
		text-decoration: underline;
	}

	.name-kana {
		display: block;
		font-size: 0.75rem;
		color: #64748b;
	}

	.plan-count {
		font-size: 0.875rem;
		color: #16a34a;
	}

	.no-plan {
		font-size: 0.875rem;
		color: #94a3b8;
	}

	.status-badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		margin-right: 0.5rem;
	}

	.status-badge.draft {
		background: #fef3c7;
		color: #d97706;
	}

	.status-badge.completed {
		background: #dbeafe;
		color: #2563eb;
	}

	.status-badge.signed {
		background: #dcfce7;
		color: #16a34a;
	}

	.date {
		font-size: 0.75rem;
		color: #64748b;
	}

	.btn-action {
		font-size: 0.75rem;
		padding: 0.375rem 0.75rem;
		background: #f1f5f9;
		color: #334155;
		border-radius: 4px;
		text-decoration: none;
	}

	.btn-action:hover {
		background: #e2e8f0;
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #f1f5f9;
	}

	.page-btn {
		padding: 0.5rem 1rem;
		background: #f1f5f9;
		border-radius: 4px;
		text-decoration: none;
		color: #334155;
	}

	.page-btn:hover {
		background: #e2e8f0;
	}

	.page-info {
		color: #64748b;
		font-size: 0.875rem;
	}

	/* モーダル */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 100;
	}

	.modal {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.modal-header h3 {
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #64748b;
	}

	.error-message {
		background: #fef2f2;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-cancel {
		padding: 0.75rem 1.5rem;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		cursor: pointer;
	}

	.btn-cancel:hover {
		background: #f8fafc;
	}
</style>
