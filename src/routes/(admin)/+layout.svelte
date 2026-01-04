<script lang="ts">
	import { page } from '$app/stores';

	let { children, data } = $props();

	// ロール表示用のラベル変換
	function getRoleLabel(role: string): string {
		return role === 'hospital_admin' ? '管理者' : 'ユーザー';
	}
</script>

<div class="admin-layout">
	<nav class="admin-nav">
		<div class="nav-header">
			<span class="app-name">Document Creation</span>
			<span class="user-badge">サービス管理者</span>
		</div>

		<div class="nav-user">
			<span class="user-name">{data.user?.name}</span>
			<span class="user-email">{data.user?.email}</span>
		</div>

		<div class="nav-links">
			<a href="/admin" class:active={$page.url.pathname === '/admin'}>ダッシュボード</a>
			<a href="/admin/hospitals" class:active={$page.url.pathname.startsWith('/admin/hospitals')}
				>病院管理</a
			>
			<a
				href="/admin/api-clients"
				class:active={$page.url.pathname.startsWith('/admin/api-clients')}>APIクライアント</a
			>
		</div>

		{#if data.userHospitals && data.userHospitals.length > 0}
			<div class="nav-divider"></div>
			<div class="user-hospitals-section" data-testid="user-hospitals-section">
				<span class="section-title">所属病院</span>
				<div class="hospital-links">
					{#each data.userHospitals as hospital (hospital.hospitalId)}
						<a
							href="/{hospital.hospitalSlug}"
							class="hospital-link"
							data-testid="hospital-link"
						>
							<span class="hospital-name">{hospital.hospitalName}</span>
							<span class="hospital-role">{getRoleLabel(hospital.role)}</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<form method="POST" action="/auth/logout" class="logout-form">
			<button type="submit" class="logout-btn">ログアウト</button>
		</form>
	</nav>
	<main class="admin-main">
		{@render children()}
	</main>
</div>

<style>
	.admin-layout {
		display: flex;
		min-height: 100vh;
	}

	.admin-nav {
		width: 260px;
		background: #1a1a2e;
		color: white;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
	}

	.nav-header {
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #333;
	}

	.app-name {
		display: block;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.user-badge {
		display: inline-block;
		margin-top: 0.5rem;
		padding: 0.25rem 0.5rem;
		background: #dc2626;
		border-radius: 4px;
		font-size: 0.75rem;
	}

	.nav-user {
		margin-bottom: 2rem;
	}

	.user-name {
		display: block;
		font-weight: 500;
	}

	.user-email {
		font-size: 0.75rem;
		color: #888;
	}

	.nav-links {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.nav-links a {
		color: #ccc;
		text-decoration: none;
		padding: 0.75rem 1rem;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.nav-links a:hover {
		background: #2d2d4a;
		color: white;
	}

	.nav-links a.active {
		background: #3b3b5c;
		color: white;
	}

	.logout-form {
		margin-top: auto;
	}

	.logout-btn {
		width: 100%;
		background: transparent;
		border: 1px solid #444;
		color: white;
		padding: 0.75rem;
		cursor: pointer;
		border-radius: 4px;
	}

	.logout-btn:hover {
		background: #333;
	}

	.admin-main {
		flex: 1;
		padding: 2rem;
		background: #f5f5f5;
		overflow-y: auto;
	}

	.nav-divider {
		height: 1px;
		background: #333;
		margin: 1rem 0;
	}

	.user-hospitals-section {
		margin-bottom: 1rem;
	}

	.section-title {
		display: block;
		font-size: 0.75rem;
		color: #888;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
		padding: 0 0.5rem;
	}

	.hospital-links {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.hospital-link {
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: #ccc;
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.hospital-link:hover {
		background: #2d2d4a;
		color: white;
	}

	.hospital-name {
		font-size: 0.875rem;
	}

	.hospital-role {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		background: #3b3b5c;
		border-radius: 3px;
		color: #aaa;
	}
</style>
