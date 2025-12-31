<script lang="ts">
	import { page } from '$app/stores';

	let { children, data } = $props();

	const currentPath = $derived($page.url.pathname);
	const basePath = $derived(`/${data.hospital?.slug}`);
</script>

<div class="hospital-layout">
	<nav class="hospital-nav">
		<div class="nav-header">
			<span class="hospital-name">{data.hospital?.name}</span>
			{#if data.isHospitalAdmin}
				<span class="admin-badge">管理者</span>
			{/if}
		</div>

		<div class="nav-user">
			<span class="user-name">{data.user?.name}</span>
			<span class="user-email">{data.user?.email}</span>
		</div>

		<div class="nav-links">
			<a href={basePath} class:active={currentPath === basePath}>ダッシュボード</a>
			<a
				href="{basePath}/patients"
				class:active={currentPath.startsWith(`${basePath}/patients`)}
			>
				患者管理
			</a>
			<a
				href="{basePath}/care-plans"
				class:active={currentPath.startsWith(`${basePath}/care-plans`)}
			>
				療養計画書
			</a>
			{#if data.isHospitalAdmin}
				<a
					href="{basePath}/members"
					class:active={currentPath.startsWith(`${basePath}/members`)}
				>
					メンバー管理
				</a>
				<a
					href="{basePath}/settings"
					class:active={currentPath.startsWith(`${basePath}/settings`)}
				>
					設定
				</a>
			{/if}
		</div>

		<form method="POST" action="/auth/logout" class="logout-form">
			<button type="submit" class="logout-btn">ログアウト</button>
		</form>
	</nav>
	<main class="hospital-main">
		{@render children()}
	</main>
</div>

<style>
	.hospital-layout {
		display: flex;
		min-height: 100vh;
	}

	.hospital-nav {
		width: 260px;
		background: #1e3a5f;
		color: white;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
	}

	.nav-header {
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.hospital-name {
		display: block;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.admin-badge {
		display: inline-block;
		margin-top: 0.5rem;
		padding: 0.25rem 0.5rem;
		background: #16a34a;
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
		color: rgba(255, 255, 255, 0.6);
	}

	.nav-links {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.nav-links a {
		color: rgba(255, 255, 255, 0.8);
		text-decoration: none;
		padding: 0.75rem 1rem;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.nav-links a:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.nav-links a.active {
		background: rgba(255, 255, 255, 0.15);
		color: white;
	}

	.logout-form {
		margin-top: auto;
	}

	.logout-btn {
		width: 100%;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		padding: 0.75rem;
		cursor: pointer;
		border-radius: 4px;
	}

	.logout-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.hospital-main {
		flex: 1;
		padding: 2rem;
		background: #f8fafc;
		overflow-y: auto;
	}
</style>
