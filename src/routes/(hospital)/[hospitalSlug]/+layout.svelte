<script lang="ts">
	import { page } from '$app/stores';

	let { children, data } = $props();

	const currentPath = $derived($page.url.pathname);
	const basePath = $derived(`/${data.hospital?.slug}`);
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="hospital-layout">
	<nav class="hospital-nav">
		<div class="nav-header">
			<div class="hospital-icon">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M3 21h18" />
					<path d="M5 21V7l8-4v18" />
					<path d="M19 21V11l-6-4" />
					<path d="M9 9v.01" />
					<path d="M9 12v.01" />
					<path d="M9 15v.01" />
					<path d="M9 18v.01" />
				</svg>
			</div>
			<div class="hospital-info">
				<span class="hospital-name">{data.hospital?.name}</span>
				{#if data.isHospitalAdmin}
					<span class="admin-badge">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
						</svg>
						管理者
					</span>
				{/if}
			</div>
		</div>

		<div class="nav-user">
			<div class="user-avatar">
				{data.user?.name?.charAt(0) || 'U'}
			</div>
			<div class="user-details">
				<span class="user-name">{data.user?.name}</span>
				<span class="user-email">{data.user?.email}</span>
			</div>
		</div>

		<div class="nav-section-label">メインメニュー</div>

		<div class="nav-links">
			<a href={basePath} class:active={currentPath === basePath}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="3" y="3" width="7" height="7" rx="1" />
					<rect x="14" y="3" width="7" height="7" rx="1" />
					<rect x="3" y="14" width="7" height="7" rx="1" />
					<rect x="14" y="14" width="7" height="7" rx="1" />
				</svg>
				<span>ダッシュボード</span>
			</a>
			<a
				href="{basePath}/patients"
				class:active={currentPath.startsWith(`${basePath}/patients`)}
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
					<circle cx="9" cy="7" r="4" />
					<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
					<path d="M16 3.13a4 4 0 0 1 0 7.75" />
				</svg>
				<span>患者管理</span>
			</a>
			<a
				href="{basePath}/care-plans"
				class:active={currentPath.startsWith(`${basePath}/care-plans`)}
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
					<polyline points="14 2 14 8 20 8" />
					<line x1="16" y1="13" x2="8" y2="13" />
					<line x1="16" y1="17" x2="8" y2="17" />
					<polyline points="10 9 9 9 8 9" />
				</svg>
				<span>療養計画書</span>
			</a>
		</div>

		{#if data.isHospitalAdmin}
			<div class="nav-section-label">管理</div>
			<div class="nav-links">
				<a
					href="{basePath}/members"
					class:active={currentPath.startsWith(`${basePath}/members`)}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 4.354a4 4 0 1 1 0 7.292" />
						<path d="M15 21H3v-1a6 6 0 0 1 12 0v1z" />
						<path d="M16 3.13a4 4 0 0 1 0 7.75" />
						<path d="M21 21v-1a4 4 0 0 0-3-3.85" />
					</svg>
					<span>メンバー管理</span>
				</a>
				<a
					href="{basePath}/audit-logs"
					class:active={currentPath.startsWith(`${basePath}/audit-logs`)}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 8v4l3 3" />
						<circle cx="12" cy="12" r="10" />
					</svg>
					<span>操作履歴</span>
				</a>
				<a
					href="{basePath}/settings"
					class:active={currentPath.startsWith(`${basePath}/settings`)}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="3" />
						<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
					</svg>
					<span>設定</span>
				</a>
			</div>
		{/if}

		<div class="nav-spacer"></div>

		<form method="POST" action="/auth/logout" class="logout-form">
			<button type="submit" class="logout-btn">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
					<polyline points="16 17 21 12 16 7" />
					<line x1="21" y1="12" x2="9" y2="12" />
				</svg>
				<span>ログアウト</span>
			</button>
		</form>
	</nav>
	<main class="hospital-main">
		<div class="main-content">
			{@render children()}
		</div>
	</main>
</div>

<style>
	:global(body) {
		font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
		margin: 0;
		padding: 0;
	}

	.hospital-layout {
		display: flex;
		min-height: 100vh;
		background: linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%);
	}

	.hospital-nav {
		width: 280px;
		min-width: 280px;
		height: 100vh;
		position: sticky;
		top: 0;
		background: linear-gradient(180deg, #0f4c5c 0%, #0a3642 100%);
		color: white;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		box-shadow: 4px 0 24px rgba(15, 76, 92, 0.15);
		overflow-y: auto;
		overflow-x: hidden;
		z-index: 50;
		box-sizing: border-box;
	}

	.hospital-nav::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -50%;
		width: 100%;
		height: 100%;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%);
		pointer-events: none;
	}

	.nav-header {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		position: relative;
	}

	.hospital-icon {
		width: 44px;
		height: 44px;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #5dd9c1;
	}

	.hospital-info {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.hospital-name {
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.admin-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.625rem;
		background: linear-gradient(135deg, #5dd9c1 0%, #3ecfb2 100%);
		border-radius: 20px;
		font-size: 0.6875rem;
		font-weight: 600;
		color: #0a3642;
		width: fit-content;
	}

	.nav-user {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 2rem;
		padding: 0.875rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		transition: background 0.2s ease;
	}

	.nav-user:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.user-avatar {
		width: 40px;
		height: 40px;
		background: linear-gradient(135deg, #9ae6d8 0%, #5dd9c1 100%);
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1rem;
		color: #0a3642;
	}

	.user-details {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.user-name {
		font-weight: 500;
		font-size: 0.875rem;
	}

	.user-email {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.nav-section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.4);
		margin-bottom: 0.75rem;
		padding-left: 0.75rem;
	}

	.nav-links {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 1.5rem;
	}

	.nav-links a {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: rgba(255, 255, 255, 0.7);
		text-decoration: none;
		padding: 0.75rem;
		border-radius: 10px;
		transition: all 0.2s ease;
		font-size: 0.9375rem;
		font-weight: 500;
	}

	.nav-links a:hover {
		background: rgba(255, 255, 255, 0.08);
		color: white;
		transform: translateX(2px);
	}

	.nav-links a.active {
		background: linear-gradient(135deg, rgba(93, 217, 193, 0.2) 0%, rgba(93, 217, 193, 0.1) 100%);
		color: #5dd9c1;
		box-shadow: inset 0 0 0 1px rgba(93, 217, 193, 0.2);
	}

	.nav-links a svg {
		flex-shrink: 0;
	}

	.nav-spacer {
		flex: 1;
	}

	.logout-form {
		margin-top: auto;
	}

	.logout-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.7);
		padding: 0.875rem;
		cursor: pointer;
		border-radius: 10px;
		font-size: 0.9375rem;
		font-weight: 500;
		transition: all 0.2s ease;
		font-family: inherit;
	}

	.logout-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border-color: rgba(255, 255, 255, 0.2);
	}

	.hospital-main {
		flex: 1;
		min-height: 100vh;
		overflow-y: auto;
		position: relative;
	}

	.main-content {
		padding: 2rem 2.5rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	@media (max-width: 1024px) {
		.hospital-nav {
			width: 240px;
			min-width: 240px;
		}

		.main-content {
			padding: 1.5rem;
		}
	}
</style>
