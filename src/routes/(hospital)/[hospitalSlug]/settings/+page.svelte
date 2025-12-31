<script lang="ts">
	let { data } = $props();
</script>

<div class="page">
	<h1>設定</h1>

	<div class="settings-list">
		<a href="/{data.hospital.slug}/settings/api-clients" class="settings-card">
			<div class="card-icon">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
					<path d="M7 11V7a5 5 0 0 1 10 0v4" />
				</svg>
			</div>
			<div class="card-content">
				<h2>APIクライアント管理</h2>
				<p>外部システム連携用のAPIクライアントを管理します</p>
			</div>
			<div class="card-arrow">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M9 18l6-6-6-6" />
				</svg>
			</div>
		</a>
	</div>
</div>

<style>
	.page {
		max-width: 800px;
	}

	h1 {
		margin-bottom: 2rem;
	}

	.settings-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.settings-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.settings-card:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.card-icon {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #dbeafe;
		border-radius: 8px;
		color: #2563eb;
		flex-shrink: 0;
	}

	.card-content {
		flex: 1;
	}

	.card-content h2 {
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
	}

	.card-content p {
		margin: 0;
		font-size: 0.875rem;
		color: #64748b;
	}

	.card-arrow {
		color: #94a3b8;
	}
</style>
