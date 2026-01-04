<script lang="ts">
	let { data } = $props();

	const roleLabels: Record<string, string> = {
		hospital_admin: '病院管理者',
		hospital_user: '病院ユーザー'
	};
</script>

<div class="members-page">
	<header class="page-header">
		<div class="header-left">
			<h1>メンバー管理</h1>
			<p class="subtitle">スタッフの招待と権限管理</p>
		</div>
		<a href="/{data.hospital?.slug}/members/invite" class="btn-primary">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
				<circle cx="8.5" cy="7" r="4" />
				<line x1="20" y1="8" x2="20" y2="14" />
				<line x1="23" y1="11" x2="17" y2="11" />
			</svg>
			ユーザーを招待
		</a>
	</header>

	<div class="content-card">
		<div class="card-header">
			<h2>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
					<circle cx="9" cy="7" r="4" />
					<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
					<path d="M16 3.13a4 4 0 0 1 0 7.75" />
				</svg>
				メンバー
			</h2>
			<span class="count-badge">{data.members.length}人</span>
		</div>

		{#if data.members.length === 0}
			<div class="empty-state">
				<div class="empty-icon">
					<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
						<circle cx="9" cy="7" r="4" />
						<line x1="19" y1="8" x2="19" y2="14" />
						<line x1="22" y1="11" x2="16" y2="11" />
					</svg>
				</div>
				<p>メンバーがいません</p>
			</div>
		{:else}
			<div class="member-grid">
				{#each data.members as member, i (member.user.id)}
					<div class="member-card" style="animation-delay: {i * 0.05}s">
						<div class="member-avatar">
							{member.user.name?.charAt(0) || 'U'}
						</div>
						<div class="member-info">
							<div class="member-name">{member.user.name}</div>
							<div class="member-email">{member.user.email}</div>
						</div>
						<div class="member-meta">
							<span class="role-badge" class:admin={member.role === 'hospital_admin'}>
								{#if member.role === 'hospital_admin'}
									<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
										<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
									</svg>
								{/if}
								{roleLabels[member.role]}
							</span>
							<span class="join-date">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
									<line x1="16" y1="2" x2="16" y2="6" />
									<line x1="8" y1="2" x2="8" y2="6" />
									<line x1="3" y1="10" x2="21" y2="10" />
								</svg>
								{new Date(member.createdAt).toLocaleDateString('ja-JP')} 参加
							</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="content-card">
		<div class="card-header">
			<h2>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
					<polyline points="22,6 12,13 2,6" />
				</svg>
				招待中
			</h2>
			<span class="count-badge pending">{data.invitations.length}件</span>
		</div>

		{#if data.invitations.length === 0}
			<div class="empty-state small">
				<p>保留中の招待はありません</p>
			</div>
		{:else}
			<div class="invitation-list">
				{#each data.invitations as invitation, i (invitation.id)}
					<div class="invitation-card" style="animation-delay: {i * 0.05}s">
						<div class="invitation-icon">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
								<polyline points="22,6 12,13 2,6" />
							</svg>
						</div>
						<div class="invitation-info">
							<span class="invitation-email">{invitation.email}</span>
							<span class="role-badge">{roleLabels[invitation.role]}</span>
						</div>
						<div class="invitation-expiry">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10" />
								<polyline points="12 6 12 12 16 14" />
							</svg>
							期限: {new Date(invitation.expiresAt).toLocaleDateString('ja-JP')}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.members-page {
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
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
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
		box-shadow: 0 2px 8px rgba(15, 76, 92, 0.25);
		transition: all 0.2s ease;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(15, 76, 92, 0.35);
	}

	.content-card {
		background: white;
		border-radius: 16px;
		box-shadow: 0 2px 12px rgba(15, 76, 92, 0.06);
		overflow: hidden;
		margin-bottom: 1.5rem;
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

	.count-badge.pending {
		background: linear-gradient(135deg, #fef5e8 0%, #fde8d0 100%);
		color: #e67e22;
	}

	.empty-state {
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-state.small {
		padding: 2rem;
	}

	.empty-icon {
		color: #c0c8d0;
		margin-bottom: 1rem;
	}

	.empty-state p {
		color: #6b7c8c;
		margin: 0;
	}

	.member-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
		padding: 1.5rem;
	}

	.member-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem;
		background: linear-gradient(135deg, #fafbfc 0%, #f5f7f9 100%);
		border-radius: 14px;
		animation: cardFadeIn 0.4s ease-out both;
		transition: all 0.2s ease;
	}

	@keyframes cardFadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.member-card:hover {
		background: linear-gradient(135deg, #f5f7f9 0%, #eef2f5 100%);
		transform: translateY(-2px);
	}

	.member-avatar {
		width: 60px;
		height: 60px;
		background: linear-gradient(135deg, #5dd9c1 0%, #3ecfb2 100%);
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.5rem;
		color: #0a3642;
		margin-bottom: 1rem;
		box-shadow: 0 4px 12px rgba(93, 217, 193, 0.3);
	}

	.member-info {
		text-align: center;
		margin-bottom: 1rem;
	}

	.member-name {
		font-weight: 600;
		font-size: 1.0625rem;
		color: #1a2b3c;
		margin-bottom: 0.25rem;
	}

	.member-email {
		font-size: 0.875rem;
		color: #6b7c8c;
	}

	.member-meta {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.role-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: #f0f4f8;
		border-radius: 8px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #4a5b6c;
	}

	.role-badge.admin {
		background: linear-gradient(135deg, #e8f8f5 0%, #d0f0ea 100%);
		color: #0a3642;
	}

	.role-badge.admin svg {
		color: #5dd9c1;
	}

	.join-date {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: #9ba8b5;
	}

	.invitation-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.5rem;
	}

	.invitation-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		background: linear-gradient(135deg, #fffbf5 0%, #fff8f0 100%);
		border: 1px solid #fde8d0;
		border-radius: 12px;
		animation: cardFadeIn 0.4s ease-out both;
	}

	.invitation-icon {
		width: 40px;
		height: 40px;
		background: linear-gradient(135deg, #fef5e8 0%, #fde8d0 100%);
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #e67e22;
	}

	.invitation-info {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.invitation-email {
		font-weight: 600;
		color: #1a2b3c;
	}

	.invitation-expiry {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: #9ba8b5;
	}
</style>
