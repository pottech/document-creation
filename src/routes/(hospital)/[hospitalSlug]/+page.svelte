<script lang="ts">
	let { data } = $props();
</script>

<div class="dashboard">
	<h1>{data.hospital?.name}</h1>
	<p>ようこそ、{data.user?.name}さん</p>

	<div class="welcome-card">
		<h2>病院ダッシュボード</h2>
		<p>このページから病院の各機能にアクセスできます。</p>

		{#if data.isHospitalAdmin}
			<div class="admin-actions">
				<a href="/{data.hospital?.slug}/members" class="action-card">
					<h3>メンバー管理</h3>
					<p>ユーザーの招待と管理</p>
				</a>
			</div>
		{/if}
	</div>
</div>

<style>
	.dashboard {
		max-width: 800px;
	}

	h1 {
		margin-bottom: 0.5rem;
	}

	h1 + p {
		color: #64748b;
		margin-bottom: 2rem;
	}

	.welcome-card {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.welcome-card h2 {
		margin-bottom: 0.5rem;
	}

	.welcome-card > p {
		color: #64748b;
		margin-bottom: 1.5rem;
	}

	.admin-actions {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.action-card {
		display: block;
		padding: 1.5rem;
		background: #f8fafc;
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.action-card:hover {
		background: #f1f5f9;
		transform: translateY(-2px);
	}

	.action-card h3 {
		font-size: 1rem;
		margin-bottom: 0.25rem;
		color: #1e293b;
	}

	.action-card p {
		font-size: 0.875rem;
		color: #64748b;
		margin: 0;
	}
</style>
