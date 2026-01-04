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

	function generateCalendar(year: number, month: number) {
		const firstDay = new Date(year, month - 1, 1);
		const lastDay = new Date(year, month, 0);
		const daysInMonth = lastDay.getDate();
		const startDayOfWeek = firstDay.getDay();

		const weeks: (number | null)[][] = [];
		let currentWeek: (number | null)[] = [];

		for (let i = 0; i < startDayOfWeek; i++) {
			currentWeek.push(null);
		}

		for (let day = 1; day <= daysInMonth; day++) {
			currentWeek.push(day);
			if (currentWeek.length === 7) {
				weeks.push(currentWeek);
				currentWeek = [];
			}
		}

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
	<header class="page-header">
		<div class="header-left">
			<h1>療養計画書一覧</h1>
			<p class="subtitle">作成した療養計画書の管理</p>
		</div>
	</header>

	<div class="content-grid">
		<div class="calendar-section">
			<div class="calendar-header">
				<button class="nav-btn" onclick={() => changeMonth(-1)} aria-label="前月">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="15 18 9 12 15 6" />
					</svg>
				</button>
				<span class="month-title">{data.year}年{data.month}月</span>
				<button class="nav-btn" onclick={() => changeMonth(1)} aria-label="翌月">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="9 18 15 12 9 6" />
					</svg>
				</button>
			</div>

			<table class="calendar">
				<thead>
					<tr>
						{#each weekDays as day, i (i)}
							<th class:sunday={i === 0} class:saturday={i === 6}>{day}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each calendar as week, weekIdx (weekIdx)}
						<tr>
							{#each week as day, i (i)}
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

			<div class="month-summary">
				<h3>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="20" x2="18" y2="10" />
						<line x1="12" y1="20" x2="12" y2="4" />
						<line x1="6" y1="20" x2="6" y2="14" />
					</svg>
					月間サマリー
				</h3>
				<div class="summary-grid">
					<div class="summary-item total">
						<span class="summary-value">{data.stats.total}</span>
						<span class="summary-label">作成件数</span>
					</div>
					{#each data.stats.byDisease as disease (disease.disease)}
						<div class="summary-item">
							<span class="summary-value">{disease.count}</span>
							<span class="summary-label">
								{disease.disease === 'diabetes' ? '糖尿病' : disease.disease === 'hypertension' ? '高血圧' : '高脂血症'}
							</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="list-section">
			<div class="list-header">
				<h2>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
						<line x1="16" y1="2" x2="16" y2="6" />
						<line x1="8" y1="2" x2="8" y2="6" />
						<line x1="3" y1="10" x2="21" y2="10" />
					</svg>
					{formatDate(data.selectedDate)} の療養計画書
				</h2>
				<span class="count-badge">{data.carePlans.length}件</span>
			</div>

			{#if data.carePlans.length === 0}
				<div class="empty-state">
					<div class="empty-icon">
						<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
							<polyline points="14 2 14 8 20 8" />
							<line x1="12" y1="18" x2="12" y2="12" />
							<line x1="9" y1="15" x2="15" y2="15" />
						</svg>
					</div>
					<p>この日に作成された療養計画書はありません</p>
				</div>
			{:else}
				<div class="care-plan-list">
					{#each data.carePlans as plan, i (plan.id)}
						<a href="/{data.hospital?.slug}/patients/{plan.patient.id}/care-plans/{plan.id}" class="care-plan-card" style="animation-delay: {i * 0.05}s">
							<div class="card-left">
								<div class="patient-avatar">
									{plan.patient.name.charAt(0)}
								</div>
							</div>
							<div class="card-content">
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
											<span class="disease-tag diabetes">糖尿病</span>
										{/if}
										{#if plan.hasHypertension}
											<span class="disease-tag hypertension">高血圧症</span>
										{/if}
										{#if plan.hasHyperlipidemia}
											<span class="disease-tag hyperlipidemia">高脂血症</span>
										{/if}
									</div>
								</div>
							</div>
							<div class="card-arrow">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="9 18 15 12 9 6" />
								</svg>
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

	.content-grid {
		display: grid;
		grid-template-columns: 380px 1fr;
		gap: 1.5rem;
	}

	@media (max-width: 1024px) {
		.content-grid {
			grid-template-columns: 1fr;
		}
	}

	.calendar-section {
		background: white;
		padding: 1.5rem;
		border-radius: 16px;
		box-shadow: 0 2px 12px rgba(15, 76, 92, 0.06);
		height: fit-content;
	}

	.calendar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.25rem;
	}

	.nav-btn {
		background: #f0f4f8;
		border: none;
		width: 36px;
		height: 36px;
		border-radius: 10px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #4a5b6c;
		transition: all 0.2s ease;
	}

	.nav-btn:hover {
		background: #e8eef3;
		color: #0f4c5c;
	}

	.month-title {
		font-weight: 700;
		font-size: 1.125rem;
		color: #1a2b3c;
	}

	.calendar {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1.5rem;
	}

	.calendar th,
	.calendar td {
		text-align: center;
		padding: 0.375rem;
	}

	.calendar th {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7c8c;
		padding-bottom: 0.75rem;
	}

	.calendar th.sunday { color: #e74c3c; }
	.calendar th.saturday { color: #3498db; }

	.day-btn {
		width: 100%;
		aspect-ratio: 1;
		background: none;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		font-size: 0.9375rem;
		position: relative;
		color: #4a5b6c;
		transition: all 0.2s ease;
	}

	.calendar td.sunday .day-btn { color: #e74c3c; }
	.calendar td.saturday .day-btn { color: #3498db; }

	.day-btn:hover {
		background: #f0f4f8;
	}

	.day-btn.today {
		background: #e8f8f5;
		font-weight: 600;
	}

	.day-btn.selected {
		background: linear-gradient(135deg, #0f4c5c 0%, #0a3642 100%);
		color: white !important;
		box-shadow: 0 4px 12px rgba(15, 76, 92, 0.25);
	}

	.day-btn.has-plans .day-number {
		font-weight: 700;
	}

	.day-btn .count-badge {
		font-size: 0.625rem;
		background: linear-gradient(135deg, #5dd9c1 0%, #3ecfb2 100%);
		color: #0a3642;
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
		font-weight: 600;
	}

	.day-btn.selected .count-badge {
		background: rgba(255, 255, 255, 0.3);
		color: white;
	}

	.month-summary h3 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: #1a2b3c;
		margin: 0 0 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #f0f4f8;
	}

	.month-summary h3 svg {
		color: #5dd9c1;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.summary-item {
		text-align: center;
		padding: 1rem;
		background: linear-gradient(135deg, #fafbfc 0%, #f5f7f9 100%);
		border-radius: 12px;
	}

	.summary-item.total {
		grid-column: span 2;
		background: linear-gradient(135deg, #e8f8f5 0%, #d0f0ea 100%);
	}

	.summary-value {
		display: block;
		font-size: 1.5rem;
		font-weight: 700;
		color: #0f4c5c;
	}

	.summary-item:not(.total) .summary-value {
		font-size: 1.25rem;
		color: #4a5b6c;
	}

	.summary-label {
		font-size: 0.75rem;
		color: #6b7c8c;
		font-weight: 500;
	}

	.list-section {
		background: white;
		border-radius: 16px;
		box-shadow: 0 2px 12px rgba(15, 76, 92, 0.06);
		overflow: hidden;
	}

	.list-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid #f0f4f8;
	}

	.list-header h2 {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #1a2b3c;
	}

	.list-header h2 svg {
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
		margin: 0;
	}

	.care-plan-list {
		display: flex;
		flex-direction: column;
		padding: 1rem;
		gap: 0.75rem;
	}

	.care-plan-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem;
		background: linear-gradient(135deg, #fafbfc 0%, #f8fafe 100%);
		border-radius: 14px;
		text-decoration: none;
		color: inherit;
		animation: cardFadeIn 0.4s ease-out both;
		transition: all 0.2s ease;
	}

	@keyframes cardFadeIn {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.care-plan-card:hover {
		background: linear-gradient(135deg, #f5f7f9 0%, #f0f4f8 100%);
		transform: translateX(4px);
	}

	.patient-avatar {
		width: 48px;
		height: 48px;
		background: linear-gradient(135deg, #5dd9c1 0%, #3ecfb2 100%);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.125rem;
		color: #0a3642;
		flex-shrink: 0;
	}

	.card-content {
		flex: 1;
		min-width: 0;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.625rem;
	}

	.patient-info {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.patient-number {
		font-family: 'SF Mono', Monaco, monospace;
		font-size: 0.8125rem;
		color: #6b7c8c;
		background: #f0f4f8;
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
	}

	.patient-name {
		font-weight: 600;
		color: #1a2b3c;
	}

	.patient-detail {
		font-size: 0.875rem;
		color: #6b7c8c;
	}

	.status-badge {
		padding: 0.375rem 0.75rem;
		border-radius: 8px;
		font-size: 0.75rem;
		font-weight: 600;
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
		padding: 0.25rem 0.625rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
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
		color: #6b7c8c;
		font-weight: 500;
	}

	.diseases {
		display: flex;
		gap: 0.375rem;
	}

	.disease-tag {
		font-size: 0.6875rem;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		font-weight: 600;
	}

	.disease-tag.diabetes {
		background: #fef3c7;
		color: #d97706;
	}

	.disease-tag.hypertension {
		background: #fee2e2;
		color: #dc2626;
	}

	.disease-tag.hyperlipidemia {
		background: #f3e8ff;
		color: #9333ea;
	}

	.card-arrow {
		color: #c0c8d0;
		transition: all 0.2s ease;
	}

	.care-plan-card:hover .card-arrow {
		color: #5dd9c1;
		transform: translateX(4px);
	}
</style>
