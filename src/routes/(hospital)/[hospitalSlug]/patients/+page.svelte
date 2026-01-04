<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let showCreateModal = $state(false);
	let createError = $state('');
	// 初期値としてURL検索パラメータを使用（ユーザー入力用のため$stateで管理）
	// svelte-ignore state_referenced_locally
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
	<header class="page-header">
		<div class="header-left">
			<h1>患者管理</h1>
			<p class="subtitle">患者情報の登録と管理</p>
		</div>
		<button class="btn-primary" onclick={() => (showCreateModal = true)}>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
			患者を登録
		</button>
	</header>

	<div class="search-section">
		<form onsubmit={(e) => { e.preventDefault(); handleSearch(); }} class="search-form">
			<div class="search-input-wrapper">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="11" cy="11" r="8" />
					<line x1="21" y1="21" x2="16.65" y2="16.65" />
				</svg>
				<input
					type="text"
					placeholder="患者番号または氏名で検索..."
					bind:value={searchQuery}
				/>
			</div>
			<button type="submit" class="btn-search">検索</button>
		</form>
	</div>

	<div class="content-card">
		<div class="card-header">
			<h2>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
					<circle cx="9" cy="7" r="4" />
					<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
					<path d="M16 3.13a4 4 0 0 1 0 7.75" />
				</svg>
				患者一覧
			</h2>
			<span class="count-badge">{data.total}件</span>
		</div>

		{#if data.patients.length === 0}
			<div class="empty-state">
				<div class="empty-icon">
					<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
						<circle cx="9" cy="7" r="4" />
						<line x1="19" y1="8" x2="19" y2="14" />
						<line x1="22" y1="11" x2="16" y2="11" />
					</svg>
				</div>
				<p>{data.search ? '検索条件に一致する患者がいません' : '登録されている患者がいません'}</p>
				<button class="btn-secondary" onclick={() => (showCreateModal = true)}>
					最初の患者を登録する
				</button>
			</div>
		{:else}
			<div class="table-wrapper">
				<table class="data-table">
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
						{#each data.patients as patient, i (patient.id)}
							<tr style="animation-delay: {i * 0.03}s">
								<td>
									<span class="patient-number">{patient.patientNumber}</span>
								</td>
								<td>
									<a href="/{data.hospital?.slug}/patients/{patient.id}" class="patient-link">
										<span class="name">{patient.name}</span>
										{#if patient.nameKana}
											<span class="kana">{patient.nameKana}</span>
										{/if}
									</a>
								</td>
								<td>{new Date(patient.birthDate).toLocaleDateString('ja-JP')}</td>
								<td><span class="age">{calculateAge(patient.birthDate)}歳</span></td>
								<td>
									<span class="gender-badge {patient.gender}">
										{genderLabels[patient.gender]}
									</span>
								</td>
								<td>
									{#if patient.carePlanCount > 0}
										<span class="plan-count">{patient.carePlanCount}件</span>
									{:else}
										<span class="no-plan">未作成</span>
									{/if}
								</td>
								<td>
									{#if patient.latestCarePlan}
										<div class="latest-plan">
											<span class="status-badge {patient.latestCarePlan.status}">
												{statusLabels[patient.latestCarePlan.status]}
											</span>
											<span class="date">
												{new Date(patient.latestCarePlan.consultationDate).toLocaleDateString('ja-JP')}
											</span>
										</div>
									{:else}
										<span class="no-data">-</span>
									{/if}
								</td>
								<td>
									<a href="/{data.hospital?.slug}/patients/{patient.id}/care-plans/new" class="btn-create-plan">
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
											<polyline points="14 2 14 8 20 8" />
											<line x1="12" y1="18" x2="12" y2="12" />
											<line x1="9" y1="15" x2="15" y2="15" />
										</svg>
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
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="15 18 9 12 15 6" />
							</svg>
							前へ
						</a>
					{/if}
					<span class="page-info">
						<span class="current">{data.page}</span>
						<span class="separator">/</span>
						<span class="total">{data.totalPages}</span>
					</span>
					{#if data.page < data.totalPages}
						<a href="?page={data.page + 1}{data.search ? `&search=${data.search}` : ''}" class="page-btn">
							次へ
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="9 18 15 12 9 6" />
							</svg>
						</a>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
</div>

{#if showCreateModal}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={() => (showCreateModal = false)}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>
					<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
						<circle cx="8.5" cy="7" r="4" />
						<line x1="20" y1="8" x2="20" y2="14" />
						<line x1="23" y1="11" x2="17" y2="11" />
					</svg>
					患者を登録
				</h3>
				<button class="close-btn" onclick={() => (showCreateModal = false)} aria-label="閉じる">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
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
					<div class="error-message">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="8" x2="12" y2="12" />
							<line x1="12" y1="16" x2="12.01" y2="16" />
						</svg>
						{createError}
					</div>
				{/if}

				<div class="form-group">
					<label for="patientNumber">
						患者番号
						<span class="required">必須</span>
					</label>
					<input type="text" id="patientNumber" name="patientNumber" required placeholder="例: P001" />
				</div>

				<div class="form-group">
					<label for="name">
						氏名
						<span class="required">必須</span>
					</label>
					<input type="text" id="name" name="name" required placeholder="例: 山田 太郎" />
				</div>

				<div class="form-group">
					<label for="nameKana">氏名（カナ）</label>
					<input type="text" id="nameKana" name="nameKana" placeholder="例: ヤマダ タロウ" />
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="birthDate">
							生年月日
							<span class="required">必須</span>
						</label>
						<input type="date" id="birthDate" name="birthDate" required />
					</div>

					<div class="form-group">
						<label for="gender">
							性別
							<span class="required">必須</span>
						</label>
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
					<button type="submit" class="btn-submit">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="20 6 9 17 4 12" />
						</svg>
						登録する
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.patients-page {
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
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
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

	.btn-primary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: linear-gradient(135deg, #0f4c5c 0%, #0a3642 100%);
		color: white;
		padding: 0.75rem 1.25rem;
		border-radius: 10px;
		text-decoration: none;
		font-weight: 600;
		font-size: 0.9375rem;
		border: none;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(15, 76, 92, 0.25);
		transition: all 0.2s ease;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(15, 76, 92, 0.35);
	}

	.search-section {
		margin-bottom: 1.5rem;
	}

	.search-form {
		display: flex;
		gap: 0.75rem;
	}

	.search-input-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0 1rem;
		background: white;
		border: 2px solid #e8eef3;
		border-radius: 12px;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.search-input-wrapper:focus-within {
		border-color: #5dd9c1;
		box-shadow: 0 0 0 3px rgba(93, 217, 193, 0.15);
	}

	.search-input-wrapper svg {
		color: #9ba8b5;
	}

	.search-input-wrapper input {
		flex: 1;
		padding: 0.875rem 0;
		border: none;
		font-size: 0.9375rem;
		background: transparent;
		color: #1a2b3c;
	}

	.search-input-wrapper input::placeholder {
		color: #9ba8b5;
	}

	.search-input-wrapper input:focus {
		outline: none;
	}

	.btn-search {
		padding: 0.875rem 1.5rem;
		background: #f0f4f8;
		border: 2px solid #e8eef3;
		border-radius: 12px;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.9375rem;
		color: #4a5b6c;
		transition: all 0.2s ease;
	}

	.btn-search:hover {
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

	.count-badge {
		padding: 0.375rem 0.875rem;
		background: linear-gradient(135deg, #e8f8f5 0%, #d0f0ea 100%);
		border-radius: 20px;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #0f4c5c;
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
		margin-bottom: 1.5rem;
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #f0f4f8;
		border: 2px solid #e8eef3;
		border-radius: 10px;
		font-weight: 600;
		font-size: 0.9375rem;
		color: #4a5b6c;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-secondary:hover {
		background: #e8eef3;
	}

	.table-wrapper {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
	}

	.data-table th,
	.data-table td {
		padding: 1rem 1.25rem;
		text-align: left;
		border-bottom: 1px solid #f0f4f8;
	}

	.data-table th {
		font-weight: 600;
		color: #6b7c8c;
		font-size: 0.8125rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		background: #fafbfc;
	}

	.data-table tbody tr {
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

	.data-table tbody tr:hover {
		background: #fafbfc;
	}

	.patient-number {
		font-family: 'SF Mono', Monaco, monospace;
		font-size: 0.875rem;
		color: #6b7c8c;
		background: #f0f4f8;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	.patient-link {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: inherit;
	}

	.patient-link .name {
		font-weight: 600;
		color: #0f4c5c;
		transition: color 0.2s ease;
	}

	.patient-link:hover .name {
		color: #5dd9c1;
	}

	.patient-link .kana {
		font-size: 0.75rem;
		color: #9ba8b5;
		margin-top: 0.125rem;
	}

	.age {
		font-weight: 500;
		color: #4a5b6c;
	}

	.gender-badge {
		display: inline-block;
		padding: 0.25rem 0.625rem;
		border-radius: 6px;
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.gender-badge.male {
		background: #e8f4fc;
		color: #2980b9;
	}

	.gender-badge.female {
		background: #fce8f0;
		color: #d63384;
	}

	.plan-count {
		font-weight: 600;
		color: #16a34a;
	}

	.no-plan {
		color: #9ba8b5;
		font-size: 0.875rem;
	}

	.latest-plan {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.625rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		width: fit-content;
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
		font-size: 0.8125rem;
		color: #6b7c8c;
	}

	.no-data {
		color: #c0c8d0;
	}

	.btn-create-plan {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		background: linear-gradient(135deg, #e8f8f5 0%, #d0f0ea 100%);
		border: 1px solid #5dd9c1;
		border-radius: 8px;
		color: #0a3642;
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.btn-create-plan:hover {
		background: linear-gradient(135deg, #5dd9c1 0%, #3ecfb2 100%);
		color: white;
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
		border-radius: 8px;
		text-decoration: none;
		color: #4a5b6c;
		font-weight: 500;
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.page-btn:hover {
		background: #e8eef3;
	}

	.page-info {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.9375rem;
	}

	.page-info .current {
		font-weight: 700;
		color: #0f4c5c;
	}

	.page-info .separator {
		color: #c0c8d0;
	}

	.page-info .total {
		color: #6b7c8c;
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
		padding: 0;
		border-radius: 20px;
		width: 100%;
		max-width: 520px;
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

	.modal form {
		padding: 1.5rem;
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		background: #fef2f2;
		color: #dc2626;
		padding: 0.875rem 1rem;
		border-radius: 10px;
		margin-bottom: 1.25rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	.form-group label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #4a5b6c;
		margin-bottom: 0.5rem;
	}

	.required {
		font-size: 0.6875rem;
		font-weight: 600;
		color: white;
		background: #e74c3c;
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: 0.875rem 1rem;
		border: 2px solid #e8eef3;
		border-radius: 10px;
		font-size: 0.9375rem;
		color: #1a2b3c;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
		font-family: inherit;
	}

	.form-group input::placeholder {
		color: #9ba8b5;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #5dd9c1;
		box-shadow: 0 0 0 3px rgba(93, 217, 193, 0.15);
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
		padding-top: 1.25rem;
		border-top: 1px solid #f0f4f8;
	}

	.btn-cancel {
		padding: 0.875rem 1.5rem;
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

	.btn-cancel:hover {
		background: #e8eef3;
	}

	.btn-submit {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		background: linear-gradient(135deg, #0f4c5c 0%, #0a3642 100%);
		border: none;
		border-radius: 10px;
		font-weight: 600;
		font-size: 0.9375rem;
		color: white;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(15, 76, 92, 0.25);
		transition: all 0.2s ease;
		font-family: inherit;
	}

	.btn-submit:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(15, 76, 92, 0.35);
	}
</style>
