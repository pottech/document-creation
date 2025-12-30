<script lang="ts">
	let { data } = $props();
</script>

<div class="dashboard">
	<h1>管理ダッシュボード</h1>
	<p>ようこそ、{data.user?.name}さん</p>

	<div class="stats">
		<div class="stat-card">
			<h3>病院アカウント</h3>
			<p class="stat-value">{data.hospitalCount}</p>
			<a href="/admin/hospitals">管理する →</a>
		</div>
		<div class="stat-card">
			<h3>総ユーザー数</h3>
			<p class="stat-value">{data.userCount}</p>
		</div>
	</div>
</div>

<style>
	.dashboard {
		max-width: 1200px;
	}

	h1 {
		margin-bottom: 0.5rem;
	}

	p {
		color: #64748b;
		margin-bottom: 2rem;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.stat-card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.stat-card h3 {
		font-size: 0.875rem;
		color: #64748b;
		margin-bottom: 0.5rem;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 0.5rem;
	}

	.stat-card a {
		color: #2563eb;
		text-decoration: none;
		font-size: 0.875rem;
	}

	.stat-card a:hover {
		text-decoration: underline;
	}
</style>
