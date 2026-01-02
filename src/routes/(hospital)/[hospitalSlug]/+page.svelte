<script lang="ts">
	let { data } = $props();
</script>

<div class="dashboard">
	<header class="page-header">
		<div class="header-content">
			<h1>ようこそ、<span class="user-highlight">{data.user?.name}</span>さん</h1>
			<p class="subtitle">{data.hospital?.name}のダッシュボード</p>
		</div>
		<div class="header-decoration">
			<svg width="120" height="120" viewBox="0 0 120 120" fill="none">
				<circle cx="60" cy="60" r="50" stroke="currentColor" stroke-width="2" opacity="0.1" />
				<circle cx="60" cy="60" r="35" stroke="currentColor" stroke-width="2" opacity="0.15" />
				<circle cx="60" cy="60" r="20" fill="currentColor" opacity="0.1" />
			</svg>
		</div>
	</header>

	<div class="quick-actions">
		<a href="/{data.hospital?.slug}/patients" class="action-card patients">
			<div class="action-icon">
				<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
					<circle cx="9" cy="7" r="4" />
					<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
					<path d="M16 3.13a4 4 0 0 1 0 7.75" />
				</svg>
			</div>
			<div class="action-content">
				<h3>患者管理</h3>
				<p>患者情報の登録・編集</p>
			</div>
			<div class="action-arrow">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M5 12h14" />
					<path d="M12 5l7 7-7 7" />
				</svg>
			</div>
		</a>

		<a href="/{data.hospital?.slug}/care-plans" class="action-card care-plans">
			<div class="action-icon">
				<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
					<polyline points="14 2 14 8 20 8" />
					<line x1="16" y1="13" x2="8" y2="13" />
					<line x1="16" y1="17" x2="8" y2="17" />
				</svg>
			</div>
			<div class="action-content">
				<h3>療養計画書</h3>
				<p>計画書の一覧・作成</p>
			</div>
			<div class="action-arrow">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M5 12h14" />
					<path d="M12 5l7 7-7 7" />
				</svg>
			</div>
		</a>

		{#if data.isHospitalAdmin}
			<a href="/{data.hospital?.slug}/members" class="action-card members">
				<div class="action-icon">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 4.354a4 4 0 1 1 0 7.292" />
						<path d="M15 21H3v-1a6 6 0 0 1 12 0v1z" />
						<path d="M16 3.13a4 4 0 0 1 0 7.75" />
						<path d="M21 21v-1a4 4 0 0 0-3-3.85" />
					</svg>
				</div>
				<div class="action-content">
					<h3>メンバー管理</h3>
					<p>スタッフの招待・管理</p>
				</div>
				<div class="action-arrow">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M5 12h14" />
						<path d="M12 5l7 7-7 7" />
					</svg>
				</div>
			</a>

			<a href="/{data.hospital?.slug}/audit-logs" class="action-card audit">
				<div class="action-icon">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 8v4l3 3" />
						<circle cx="12" cy="12" r="10" />
					</svg>
				</div>
				<div class="action-content">
					<h3>操作履歴</h3>
					<p>アクティビティログの確認</p>
				</div>
				<div class="action-arrow">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M5 12h14" />
						<path d="M12 5l7 7-7 7" />
					</svg>
				</div>
			</a>
		{/if}
	</div>

	<div class="info-section">
		<div class="info-card">
			<div class="info-icon">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="16" x2="12" y2="12" />
					<line x1="12" y1="8" x2="12.01" y2="8" />
				</svg>
			</div>
			<div class="info-content">
				<h4>ヘルプが必要ですか？</h4>
				<p>システムの使い方についてご不明な点がございましたら、管理者にお問い合わせください。</p>
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard {
		max-width: 1000px;
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
		position: relative;
		background: linear-gradient(135deg, #ffffff 0%, #f8fafe 100%);
		padding: 2.5rem;
		border-radius: 20px;
		margin-bottom: 2rem;
		box-shadow: 0 4px 24px rgba(15, 76, 92, 0.08);
		overflow: hidden;
	}

	.header-content {
		position: relative;
		z-index: 1;
	}

	.page-header h1 {
		margin: 0 0 0.5rem;
		font-size: 1.75rem;
		font-weight: 700;
		color: #1a2b3c;
		letter-spacing: -0.02em;
	}

	.user-highlight {
		color: #0f4c5c;
	}

	.subtitle {
		margin: 0;
		color: #5a6b7c;
		font-size: 1rem;
	}

	.header-decoration {
		position: absolute;
		right: 2rem;
		top: 50%;
		transform: translateY(-50%);
		color: #0f4c5c;
		opacity: 0.5;
	}

	.quick-actions {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.25rem;
		margin-bottom: 2rem;
	}

	@media (max-width: 768px) {
		.quick-actions {
			grid-template-columns: 1fr;
		}
	}

	.action-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: white;
		border-radius: 16px;
		text-decoration: none;
		color: inherit;
		box-shadow: 0 2px 12px rgba(15, 76, 92, 0.06);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}

	.action-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, var(--accent-start), var(--accent-end));
		transform: scaleX(0);
		transition: transform 0.3s ease;
	}

	.action-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 32px rgba(15, 76, 92, 0.12);
	}

	.action-card:hover::before {
		transform: scaleX(1);
	}

	.action-card.patients {
		--accent-start: #0f4c5c;
		--accent-end: #1a6b7c;
	}

	.action-card.care-plans {
		--accent-start: #5dd9c1;
		--accent-end: #3ecfb2;
	}

	.action-card.members {
		--accent-start: #9b59b6;
		--accent-end: #8e44ad;
	}

	.action-card.audit {
		--accent-start: #e67e22;
		--accent-end: #d35400;
	}

	.action-icon {
		width: 56px;
		height: 56px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.action-card.patients .action-icon {
		background: linear-gradient(135deg, #e8f4f5 0%, #d0e8eb 100%);
		color: #0f4c5c;
	}

	.action-card.care-plans .action-icon {
		background: linear-gradient(135deg, #e8f8f5 0%, #d0f0ea 100%);
		color: #2a9d8f;
	}

	.action-card.members .action-icon {
		background: linear-gradient(135deg, #f3e8f8 0%, #e8d5f0 100%);
		color: #9b59b6;
	}

	.action-card.audit .action-icon {
		background: linear-gradient(135deg, #fef5e8 0%, #fde8d0 100%);
		color: #e67e22;
	}

	.action-content {
		flex: 1;
	}

	.action-content h3 {
		margin: 0 0 0.25rem;
		font-size: 1.0625rem;
		font-weight: 600;
		color: #1a2b3c;
	}

	.action-content p {
		margin: 0;
		font-size: 0.875rem;
		color: #6b7c8c;
	}

	.action-arrow {
		color: #c0c8d0;
		transition: all 0.3s ease;
	}

	.action-card:hover .action-arrow {
		color: #0f4c5c;
		transform: translateX(4px);
	}

	.info-section {
		margin-top: 1rem;
	}

	.info-card {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		background: linear-gradient(135deg, #f0f7f9 0%, #e8f0f2 100%);
		border-radius: 12px;
		border-left: 4px solid #5dd9c1;
	}

	.info-icon {
		color: #5dd9c1;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.info-content h4 {
		margin: 0 0 0.375rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: #1a2b3c;
	}

	.info-content p {
		margin: 0;
		font-size: 0.875rem;
		color: #5a6b7c;
		line-height: 1.5;
	}
</style>
