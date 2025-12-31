<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	let isEditing = $state(false);
	let updateError = $state('');

	const genderLabels: Record<string, string> = {
		male: '男性',
		female: '女性'
	};

	const statusLabels: Record<string, string> = {
		draft: '下書き',
		completed: '作成完了',
		signed: '署名済み'
	};

	const planTypeLabels: Record<string, string> = {
		initial: '初回',
		continuous: '継続'
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

	function formatDate(dateStr: string | Date): string {
		const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
		return date.toLocaleDateString('ja-JP');
	}
</script>

<div class="patient-detail-page">
	<div class="breadcrumb">
		<a href="/{data.hospital?.slug}/patients">患者管理</a>
		<span>/</span>
		<span>{data.patient.name}</span>
	</div>

	<div class="header">
		<div class="patient-header">
			<h1>{data.patient.name}</h1>
			{#if data.patient.nameKana}
				<span class="name-kana">{data.patient.nameKana}</span>
			{/if}
		</div>
		<div class="header-actions">
			<a href="/{data.hospital?.slug}/patients/{data.patient.id}/care-plans/new" class="btn-primary">
				+ 療養計画書を作成
			</a>
		</div>
	</div>

	<div class="content-grid">
		<!-- 患者基本情報 -->
		<section class="section patient-info">
			<div class="section-header">
				<h2>基本情報</h2>
				{#if !isEditing}
					<button class="btn-edit" onclick={() => (isEditing = true)}>編集</button>
				{/if}
			</div>

			{#if isEditing}
				<form
					method="POST"
					action="?/update"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								isEditing = false;
								updateError = '';
								await update();
							} else if (result.type === 'failure') {
								updateError = (result.data?.error as string) || '更新に失敗しました';
							}
						};
					}}
				>
					{#if updateError}
						<div class="error-message">{updateError}</div>
					{/if}

					<div class="form-group">
						<label for="name">氏名 *</label>
						<input type="text" id="name" name="name" value={data.patient.name} required />
					</div>

					<div class="form-group">
						<label for="nameKana">氏名（カナ）</label>
						<input type="text" id="nameKana" name="nameKana" value={data.patient.nameKana || ''} />
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="birthDate">生年月日 *</label>
							<input type="date" id="birthDate" name="birthDate" value={data.patient.birthDate} required />
						</div>

						<div class="form-group">
							<label for="gender">性別 *</label>
							<select id="gender" name="gender" required>
								<option value="male" selected={data.patient.gender === 'male'}>男性</option>
								<option value="female" selected={data.patient.gender === 'female'}>女性</option>
							</select>
						</div>
					</div>

					<div class="form-actions">
						<button type="button" class="btn-cancel" onclick={() => (isEditing = false)}>
							キャンセル
						</button>
						<button type="submit" class="btn-primary">保存</button>
					</div>
				</form>
			{:else}
				<dl class="info-list">
					<div class="info-item">
						<dt>患者番号</dt>
						<dd class="patient-number">{data.patient.patientNumber}</dd>
					</div>
					<div class="info-item">
						<dt>生年月日</dt>
						<dd>{formatDate(data.patient.birthDate)}（{calculateAge(data.patient.birthDate)}歳）</dd>
					</div>
					<div class="info-item">
						<dt>性別</dt>
						<dd>{genderLabels[data.patient.gender]}</dd>
					</div>
					<div class="info-item">
						<dt>登録日</dt>
						<dd>{formatDate(data.patient.createdAt)}</dd>
					</div>
				</dl>
			{/if}
		</section>

		<!-- 療養計画書サマリー -->
		<section class="section summary">
			<h2>療養計画書サマリー</h2>
			<div class="summary-stats">
				<div class="stat-item">
					<span class="stat-value">{data.carePlans.length}</span>
					<span class="stat-label">作成件数</span>
				</div>
				{#if data.carePlans.length > 0}
					<div class="stat-item">
						<span class="stat-value">{formatDate(data.carePlans[0].consultationDate)}</span>
						<span class="stat-label">最終診療日</span>
					</div>
				{/if}
			</div>
		</section>
	</div>

	<!-- 療養計画書履歴 -->
	<section class="section care-plans">
		<h2>療養計画書履歴</h2>

		{#if data.carePlans.length === 0}
			<div class="empty-state">
				<p>療養計画書がまだ作成されていません</p>
				<a href="/{data.hospital?.slug}/patients/{data.patient.id}/care-plans/new" class="btn-primary">
					計画書を作成する
				</a>
			</div>
		{:else}
			<div class="care-plan-list">
				{#each data.carePlans as plan}
					<div class="care-plan-item">
						<div class="care-plan-header">
							<div class="care-plan-type">
								<span class="type-badge {plan.planType}">
									{planTypeLabels[plan.planType]}
								</span>
								{#if plan.planType === 'continuous'}
									<span class="sequence">第{plan.sequenceNumber}回</span>
								{/if}
							</div>
							<span class="status-badge {plan.status}">
								{statusLabels[plan.status]}
							</span>
						</div>

						<div class="care-plan-body">
							<div class="care-plan-date">
								<span class="label">診療日:</span>
								<span class="value">{formatDate(plan.consultationDate)}</span>
							</div>

							<div class="care-plan-diseases">
								{#if plan.hasDiabetes}
									<span class="disease-tag">糖尿病</span>
								{/if}
								{#if plan.hasHypertension}
									<span class="disease-tag">高血圧症</span>
								{/if}
								{#if plan.hasHyperlipidemia}
									<span class="disease-tag">高脂血症</span>
								{/if}
							</div>

							{#if plan.achievementGoal}
								<div class="care-plan-goal">
									<span class="label">達成目標:</span>
									<span class="value">{plan.achievementGoal}</span>
								</div>
							{/if}
						</div>

						<div class="care-plan-footer">
							<span class="created-at">作成日: {formatDate(plan.createdAt)}</span>
							<a href="/{data.hospital?.slug}/patients/{data.patient.id}/care-plans/{plan.id}" class="btn-view">
								詳細を見る
							</a>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.patient-detail-page {
		max-width: 1000px;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
		color: #64748b;
	}

	.breadcrumb a {
		color: #2563eb;
		text-decoration: none;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
	}

	.patient-header h1 {
		margin: 0;
	}

	.name-kana {
		color: #64748b;
		font-size: 0.875rem;
		margin-left: 0.5rem;
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

	.content-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	@media (max-width: 768px) {
		.content-grid {
			grid-template-columns: 1fr;
		}
	}

	.section {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.section h2 {
		font-size: 1rem;
		margin: 0;
	}

	.btn-edit {
		font-size: 0.75rem;
		padding: 0.375rem 0.75rem;
		background: #f1f5f9;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.btn-edit:hover {
		background: #e2e8f0;
	}

	.info-list {
		margin: 0;
	}

	.info-item {
		display: flex;
		padding: 0.5rem 0;
		border-bottom: 1px solid #f1f5f9;
	}

	.info-item:last-child {
		border-bottom: none;
	}

	.info-item dt {
		width: 100px;
		color: #64748b;
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	.info-item dd {
		margin: 0;
		font-size: 0.875rem;
	}

	.patient-number {
		font-family: monospace;
	}

	.summary-stats {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.stat-item {
		text-align: center;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 4px;
	}

	.stat-value {
		display: block;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1e293b;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #64748b;
	}

	.care-plans {
		margin-top: 1.5rem;
	}

	.care-plans h2 {
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #64748b;
	}

	.empty-state p {
		margin-bottom: 1rem;
	}

	.care-plan-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.care-plan-item {
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 1rem;
	}

	.care-plan-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.care-plan-type {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.type-badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	.type-badge.initial {
		background: #dbeafe;
		color: #2563eb;
	}

	.type-badge.continuous {
		background: #f3e8ff;
		color: #9333ea;
	}

	.sequence {
		font-size: 0.875rem;
		color: #64748b;
	}

	.status-badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
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

	.care-plan-body {
		margin-bottom: 0.75rem;
	}

	.care-plan-date {
		margin-bottom: 0.5rem;
	}

	.care-plan-date .label,
	.care-plan-goal .label {
		font-size: 0.75rem;
		color: #64748b;
		margin-right: 0.5rem;
	}

	.care-plan-date .value {
		font-weight: 500;
	}

	.care-plan-diseases {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.disease-tag {
		font-size: 0.75rem;
		padding: 0.125rem 0.375rem;
		background: #f1f5f9;
		border-radius: 4px;
	}

	.care-plan-goal {
		font-size: 0.875rem;
	}

	.care-plan-goal .value {
		color: #334155;
	}

	.care-plan-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.75rem;
		border-top: 1px solid #f1f5f9;
	}

	.created-at {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.btn-view {
		font-size: 0.75rem;
		padding: 0.375rem 0.75rem;
		background: #f1f5f9;
		color: #334155;
		border-radius: 4px;
		text-decoration: none;
	}

	.btn-view:hover {
		background: #e2e8f0;
	}

	/* フォーム */
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

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1rem;
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

	.error-message {
		background: #fef2f2;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
</style>
