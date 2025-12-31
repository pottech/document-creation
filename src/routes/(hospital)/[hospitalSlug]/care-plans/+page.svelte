<script lang="ts">
	import { goto } from '$app/navigation';

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

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('ja-JP');
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

	function changeDate(date: string) {
		goto(`?date=${date}`);
	}

	function changeMonth(delta: number) {
		let newYear = data.year;
		let newMonth = data.month + delta;

		if (newMonth < 1) {
			newMonth = 12;
			newYear--;
		} else if (newMonth > 12) {
			newMonth = 1;
			newYear++;
		}

		const newDate = `${newYear}-${String(newMonth).padStart(2, '0')}-01`;
		goto(`?date=${newDate}`);
	}

	// カレンダー生成
	function generateCalendar(year: number, month: number) {
		const firstDay = new Date(year, month - 1, 1);
		const lastDay = new Date(year, month, 0);
		const daysInMonth = lastDay.getDate();
		const startDayOfWeek = firstDay.getDay();

		const weeks: (number | null)[][] = [];
		let currentWeek: (number | null)[] = [];

		// 月初の空白
		for (let i = 0; i < startDayOfWeek; i++) {
			currentWeek.push(null);
		}

		// 日付
		for (let day = 1; day <= daysInMonth; day++) {
			currentWeek.push(day);
			if (currentWeek.length === 7) {
				weeks.push(currentWeek);
				currentWeek = [];
			}
		}

		// 月末の空白
		if (currentWeek.length > 0) {
			while (currentWeek.length < 7) {
				currentWeek.push(null);
			}
			weeks.push(currentWeek);
		}

		return weeks;
	}

	function getCountForDay(day: number): number {
		const dateStr = `${data.year}-${String(data.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
		const found = data.monthlyData.find((d) => d.date === dateStr);
		return found?.count || 0;
	}

	function isSelectedDay(day: number): boolean {
		const dateStr = `${data.year}-${String(data.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
		return dateStr === data.selectedDate;
	}

	function isToday(day: number): boolean {
		const today = new Date();
		return (
			today.getFullYear() === data.year &&
			today.getMonth() + 1 === data.month &&
			today.getDate() === day
		);
	}

	const calendar = $derived(generateCalendar(data.year, data.month));
	const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
</script>

<div class="care-plans-page">
	<div class="header">
		<h1>療養計画書一覧</h1>
	</div>

	<div class="content-grid">
		<!-- 左: カレンダー -->
		<div class="calendar-section">
			<div class="calendar-header">
				<button class="nav-btn" onclick={() => changeMonth(-1)}>←</button>
				<span class="month-title">{data.year}年{data.month}月</span>
				<button class="nav-btn" onclick={() => changeMonth(1)}>→</button>
			</div>

			<table class="calendar">
				<thead>
					<tr>
						{#each weekDays as day, i}
							<th class:sunday={i === 0} class:saturday={i === 6}>{day}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each calendar as week}
						<tr>
							{#each week as day, i}
								<td class:sunday={i === 0} class:saturday={i === 6}>
									{#if day}
										{@const count = getCountForDay(day)}
										{@const dateStr = `${data.year}-${String(data.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`}
										<button
											class="day-btn"
											class:selected={isSelectedDay(day)}
											class:today={isToday(day)}
											class:has-plans={count > 0}
											onclick={() => changeDate(dateStr)}
										>
											<span class="day-number">{day}</span>
											{#if count > 0}
												<span class="count-badge">{count}</span>
											{/if}
										</button>
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>

			<!-- 月間サマリー -->
			<div class="month-summary">
				<h3>月間サマリー</h3>
				<div class="summary-grid">
					<div class="summary-item">
						<span class="summary-value">{data.stats.total}</span>
						<span class="summary-label">作成件数</span>
					</div>
					{#each data.stats.byDisease as disease}
						<div class="summary-item small">
							<span class="summary-value">{disease.count}</span>
							<span class="summary-label">
								{disease.disease === 'diabetes' ? '糖尿病' : disease.disease === 'hypertension' ? '高血圧' : '高脂血症'}
							</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- 右: 選択日の計画書一覧 -->
		<div class="list-section">
			<div class="list-header">
				<h2>{formatDate(data.selectedDate)} の療養計画書</h2>
				<span class="count">{data.carePlans.length}件</span>
			</div>

			{#if data.carePlans.length === 0}
				<div class="empty-state">
					<p>この日に作成された療養計画書はありません</p>
				</div>
			{:else}
				<div class="care-plan-list">
					{#each data.carePlans as plan}
						<a href="/{data.hospital?.slug}/patients/{plan.patient.id}/care-plans/{plan.id}" class="care-plan-card">
							<div class="card-header">
								<div class="patient-info">
									<span class="patient-number">{plan.patient.patientNumber}</span>
									<span class="patient-name">{plan.patient.name}</span>
									<span class="patient-detail">
										{genderLabels[plan.patient.gender]} / {calculateAge(plan.patient.birthDate)}歳
									</span>
								</div>
								<span class="status-badge {plan.status}">
									{statusLabels[plan.status]}
								</span>
							</div>

							<div class="card-body">
								<div class="plan-type">
									<span class="type-badge {plan.planType}">
										{planTypeLabels[plan.planType]}
									</span>
									{#if plan.planType === 'continuous'}
										<span class="sequence">第{plan.sequenceNumber}回</span>
									{/if}
								</div>

								<div class="diseases">
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
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.care-plans-page {
		max-width: 1200px;
	}

	.header {
		margin-bottom: 1.5rem;
	}

	.header h1 {
		margin: 0;
	}

	.content-grid {
		display: grid;
		grid-template-columns: 350px 1fr;
		gap: 1.5rem;
	}

	@media (max-width: 900px) {
		.content-grid {
			grid-template-columns: 1fr;
		}
	}

	/* カレンダーセクション */
	.calendar-section {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.calendar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.nav-btn {
		background: #f1f5f9;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.nav-btn:hover {
		background: #e2e8f0;
	}

	.month-title {
		font-weight: 600;
		font-size: 1.125rem;
	}

	.calendar {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1.5rem;
	}

	.calendar th,
	.calendar td {
		text-align: center;
		padding: 0.25rem;
	}

	.calendar th {
		font-size: 0.75rem;
		font-weight: 500;
		color: #64748b;
		padding-bottom: 0.5rem;
	}

	.calendar th.sunday,
	.calendar td.sunday .day-btn {
		color: #dc2626;
	}

	.calendar th.saturday,
	.calendar td.saturday .day-btn {
		color: #2563eb;
	}

	.day-btn {
		width: 100%;
		aspect-ratio: 1;
		background: none;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		font-size: 0.875rem;
		position: relative;
	}

	.day-btn:hover {
		background: #f1f5f9;
	}

	.day-btn.today {
		background: #dbeafe;
	}

	.day-btn.selected {
		background: #2563eb;
		color: white;
	}

	.day-btn.selected.sunday,
	.day-btn.selected.saturday {
		color: white;
	}

	.day-btn.has-plans .day-number {
		font-weight: 600;
	}

	.count-badge {
		font-size: 0.625rem;
		background: #16a34a;
		color: white;
		padding: 0 4px;
		border-radius: 2px;
	}

	.day-btn.selected .count-badge {
		background: rgba(255, 255, 255, 0.3);
	}

	/* 月間サマリー */
	.month-summary h3 {
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.summary-item {
		text-align: center;
		padding: 0.75rem;
		background: #f8fafc;
		border-radius: 4px;
	}

	.summary-item.small {
		padding: 0.5rem;
	}

	.summary-value {
		display: block;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1e293b;
	}

	.summary-item.small .summary-value {
		font-size: 1rem;
	}

	.summary-label {
		font-size: 0.75rem;
		color: #64748b;
	}

	/* リストセクション */
	.list-section {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.list-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.list-header h2 {
		font-size: 1rem;
		margin: 0;
	}

	.count {
		font-size: 0.875rem;
		color: #64748b;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #64748b;
	}

	.care-plan-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.care-plan-card {
		display: block;
		padding: 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		transition: border-color 0.2s;
	}

	.care-plan-card:hover {
		border-color: #2563eb;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}

	.patient-info {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.patient-number {
		font-family: monospace;
		font-size: 0.875rem;
		color: #64748b;
	}

	.patient-name {
		font-weight: 600;
	}

	.patient-detail {
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

	.card-body {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.plan-type {
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

	.diseases {
		display: flex;
		gap: 0.25rem;
	}

	.disease-tag {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		background: #f1f5f9;
		border-radius: 4px;
	}
</style>
