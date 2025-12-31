<script lang="ts">
	let { data } = $props();

	const statusLabels: Record<string, string> = {
		draft: '下書き',
		completed: '作成完了',
		signed: '署名済み'
	};

	const planTypeLabels: Record<string, string> = {
		initial: '初回',
		continuous: '継続'
	};

	const genderLabels: Record<string, string> = {
		male: '男',
		female: '女'
	};

	function formatDate(dateStr: string | Date): string {
		const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
		return date.toLocaleDateString('ja-JP');
	}

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

	const pdfUrl = $derived(
		`/${data.hospital?.slug}/patients/${data.patient.id}/care-plans/${data.carePlan.id}/pdf`
	);
</script>

<div class="care-plan-detail">
	<div class="breadcrumb">
		<a href="/{data.hospital?.slug}/patients">患者管理</a>
		<span>/</span>
		<a href="/{data.hospital?.slug}/patients/{data.patient.id}">{data.patient.name}</a>
		<span>/</span>
		<span>療養計画書詳細</span>
	</div>

	<div class="header">
		<div class="header-info">
			<h1>
				療養計画書
				<span class="type-badge {data.carePlan.planType}">
					{planTypeLabels[data.carePlan.planType]}
				</span>
				{#if data.carePlan.planType === 'continuous'}
					<span class="sequence">第{data.carePlan.sequenceNumber}回</span>
				{/if}
			</h1>
			<span class="status-badge {data.carePlan.status}">
				{statusLabels[data.carePlan.status]}
			</span>
		</div>
		<div class="header-actions">
			<a href={pdfUrl} class="btn-pdf" target="_blank">
				PDF出力
			</a>
			<a
				href="/{data.hospital?.slug}/patients/{data.patient.id}/care-plans/{data.carePlan.id}/edit"
				class="btn-edit"
			>
				編集
			</a>
		</div>
	</div>

	<!-- 患者情報 -->
	<section class="section">
		<h2>患者情報</h2>
		<div class="info-grid">
			<div class="info-item">
				<dt>患者番号</dt>
				<dd class="mono">{data.patient.patientNumber}</dd>
			</div>
			<div class="info-item">
				<dt>氏名</dt>
				<dd>{data.patient.name}</dd>
			</div>
			<div class="info-item">
				<dt>生年月日</dt>
				<dd>{formatDate(data.patient.birthDate)} ({calculateAge(data.patient.birthDate)}歳)</dd>
			</div>
			<div class="info-item">
				<dt>性別</dt>
				<dd>{genderLabels[data.patient.gender]}</dd>
			</div>
		</div>
	</section>

	<!-- 基本情報 -->
	<section class="section">
		<h2>基本情報</h2>
		<div class="info-grid">
			<div class="info-item">
				<dt>診療日</dt>
				<dd>{formatDate(data.carePlan.consultationDate)}</dd>
			</div>
			<div class="info-item">
				<dt>記入日</dt>
				<dd>{formatDate(data.carePlan.recordDate)}</dd>
			</div>
			<div class="info-item full-width">
				<dt>主病</dt>
				<dd>
					<div class="disease-tags">
						{#if data.carePlan.hasDiabetes}
							<span class="disease-tag">糖尿病</span>
						{/if}
						{#if data.carePlan.hasHypertension}
							<span class="disease-tag">高血圧症</span>
						{/if}
						{#if data.carePlan.hasHyperlipidemia}
							<span class="disease-tag">高脂血症</span>
						{/if}
					</div>
				</dd>
			</div>
		</div>
	</section>

	<!-- 検査項目 -->
	<section class="section">
		<h2>検査項目</h2>
		<div class="info-grid">
			<div class="info-item">
				<dt>身長</dt>
				<dd>{data.carePlan.height ? `${data.carePlan.height} cm` : '-'}</dd>
			</div>
			<div class="info-item">
				<dt>体重（現在）</dt>
				<dd>{data.carePlan.weightCurrent ? `${data.carePlan.weightCurrent} kg` : '-'}</dd>
			</div>
			<div class="info-item">
				<dt>体重（目標）</dt>
				<dd>{data.carePlan.weightTarget ? `${data.carePlan.weightTarget} kg` : '-'}</dd>
			</div>
			<div class="info-item">
				<dt>BMI</dt>
				<dd>{data.carePlan.bmi || '-'}</dd>
			</div>
			<div class="info-item">
				<dt>腹囲（現在）</dt>
				<dd>{data.carePlan.waistCurrent ? `${data.carePlan.waistCurrent} cm` : '-'}</dd>
			</div>
			<div class="info-item">
				<dt>腹囲（目標）</dt>
				<dd>{data.carePlan.waistTarget ? `${data.carePlan.waistTarget} cm` : '-'}</dd>
			</div>
			<div class="info-item">
				<dt>血圧</dt>
				<dd>
					{#if data.carePlan.bloodPressureSystolic && data.carePlan.bloodPressureDiastolic}
						{data.carePlan.bloodPressureSystolic}/{data.carePlan.bloodPressureDiastolic} mmHg
					{:else}
						-
					{/if}
				</dd>
			</div>
		</div>

		<h3>血液検査</h3>
		<div class="info-grid">
			<div class="info-item">
				<dt>採血日</dt>
				<dd>{data.carePlan.bloodTestDate ? formatDate(data.carePlan.bloodTestDate) : '-'}</dd>
			</div>
			<div class="info-item">
				<dt>血糖値</dt>
				<dd>{data.carePlan.bloodGlucose ? `${data.carePlan.bloodGlucose} mg/dl` : '-'}</dd>
			</div>
			<div class="info-item">
				<dt>HbA1c（現在）</dt>
				<dd>{data.carePlan.hba1cCurrent ? `${data.carePlan.hba1cCurrent}%` : '-'}</dd>
			</div>
			<div class="info-item">
				<dt>HbA1c（目標）</dt>
				<dd>{data.carePlan.hba1cTarget ? `${data.carePlan.hba1cTarget}%` : '-'}</dd>
			</div>
			<div class="info-item">
				<dt>総コレステロール</dt>
				<dd>{data.carePlan.totalCholesterol ? `${data.carePlan.totalCholesterol} mg/dl` : '-'}</dd>
			</div>
			<div class="info-item">
				<dt>中性脂肪</dt>
				<dd>{data.carePlan.triglycerides ? `${data.carePlan.triglycerides} mg/dl` : '-'}</dd>
			</div>
			<div class="info-item">
				<dt>HDLコレステロール</dt>
				<dd>{data.carePlan.hdlCholesterol ? `${data.carePlan.hdlCholesterol} mg/dl` : '-'}</dd>
			</div>
			<div class="info-item">
				<dt>LDLコレステロール</dt>
				<dd>{data.carePlan.ldlCholesterol ? `${data.carePlan.ldlCholesterol} mg/dl` : '-'}</dd>
			</div>
		</div>
	</section>

	<!-- 目標 -->
	<section class="section">
		<h2>目標</h2>
		<div class="goal-section">
			<div class="goal-item">
				<h3>①達成目標</h3>
				<p>{data.carePlan.achievementGoal || '（未入力）'}</p>
			</div>
			<div class="goal-item">
				<h3>②行動目標</h3>
				<p>{data.carePlan.behaviorGoal || '（未入力）'}</p>
			</div>
			{#if data.carePlan.planType === 'continuous'}
				<div class="goal-item">
					<h3>③目標の達成状況</h3>
					<p>{data.carePlan.goalAchievementStatus || '（未入力）'}</p>
				</div>
				<div class="goal-item">
					<h3>④次の目標</h3>
					<p>{data.carePlan.nextGoal || '（未入力）'}</p>
				</div>
			{/if}
		</div>
	</section>

	<!-- 署名 -->
	<section class="section">
		<h2>署名・担当</h2>
		<div class="info-grid">
			<div class="info-item">
				<dt>患者署名</dt>
				<dd>{data.carePlan.patientSignature || '（未署名）'}</dd>
			</div>
			<div class="info-item">
				<dt>主治医</dt>
				<dd>{data.primaryDoctor?.name || '（未選択）'}</dd>
			</div>
			<div class="info-item">
				<dt>副主治医</dt>
				<dd>{data.secondaryDoctor?.name || '-'}</dd>
			</div>
		</div>
	</section>

	<!-- フッター -->
	<div class="footer">
		<div class="meta">
			<span>作成日: {formatDate(data.carePlan.createdAt)}</span>
			<span>更新日: {formatDate(data.carePlan.updatedAt)}</span>
		</div>
		<a href="/{data.hospital?.slug}/patients/{data.patient.id}" class="btn-back">
			患者詳細に戻る
		</a>
	</div>
</div>

<style>
	.care-plan-detail {
		max-width: 900px;
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

	.header-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.header h1 {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.type-badge {
		font-size: 0.875rem;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-weight: normal;
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
		font-weight: normal;
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

	.header-actions {
		display: flex;
		gap: 0.75rem;
	}

	.btn-pdf {
		background: #16a34a;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		text-decoration: none;
		font-weight: 500;
	}

	.btn-pdf:hover {
		background: #15803d;
	}

	.btn-edit {
		background: #f1f5f9;
		color: #334155;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		text-decoration: none;
		font-weight: 500;
	}

	.btn-edit:hover {
		background: #e2e8f0;
	}

	.section {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 1rem;
	}

	.section h2 {
		font-size: 1rem;
		margin: 0 0 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.section h3 {
		font-size: 0.875rem;
		color: #64748b;
		margin: 1.5rem 0 0.75rem;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.info-item.full-width {
		grid-column: 1 / -1;
	}

	.info-item dt {
		font-size: 0.75rem;
		color: #64748b;
	}

	.info-item dd {
		margin: 0;
		font-size: 0.875rem;
	}

	.mono {
		font-family: monospace;
	}

	.disease-tags {
		display: flex;
		gap: 0.5rem;
	}

	.disease-tag {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		background: #f1f5f9;
		border-radius: 4px;
	}

	.goal-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.goal-item h3 {
		font-size: 0.875rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
		color: #334155;
	}

	.goal-item p {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.6;
		white-space: pre-wrap;
		color: #334155;
	}

	.footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1.5rem;
		padding-top: 1rem;
	}

	.meta {
		display: flex;
		gap: 1.5rem;
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.btn-back {
		color: #64748b;
		text-decoration: none;
		font-size: 0.875rem;
	}

	.btn-back:hover {
		color: #334155;
		text-decoration: underline;
	}
</style>
