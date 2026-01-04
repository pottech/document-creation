<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	const roleLabels: Record<string, string> = {
		hospital_admin: '病院管理者',
		hospital_user: '病院ユーザー'
	};
</script>

<div class="hospital-detail">
	<div class="header">
		<div>
			<a href="/admin/hospitals" class="back-link">← 病院一覧</a>
			<h1>{data.hospital.name}</h1>
			<p class="slug">/{data.hospital.slug}</p>
		</div>
	</div>

	<div class="content-grid">
		<section class="section">
			<h2>メンバー ({data.members.length})</h2>

			{#if data.members.length === 0}
				<p class="empty">メンバーがいません</p>
			{:else}
				<ul class="member-list">
					{#each data.members as member (member.user.id)}
						<li class="member-item">
							<div class="member-info">
								<span class="member-name">{member.user.name}</span>
								<span class="member-email">{member.user.email}</span>
							</div>
							<span class="member-role">{roleLabels[member.role]}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="section">
			<h2>招待中 ({data.invitations.length})</h2>

			{#if data.invitations.length === 0}
				<p class="empty">保留中の招待はありません</p>
			{:else}
				<ul class="invitation-list">
					{#each data.invitations as invitation (invitation.id)}
						<li class="invitation-item">
							<div class="invitation-info">
								<span class="invitation-email">{invitation.email}</span>
								<span class="invitation-role">{roleLabels[invitation.role]}</span>
							</div>
							<div class="invitation-meta">
								<span
									>期限: {new Date(invitation.expiresAt).toLocaleDateString('ja-JP')}</span
								>
							</div>
						</li>
					{/each}
				</ul>
			{/if}

			<form method="POST" action="?/invite" use:enhance class="invite-form">
				<h3>新しい管理者を招待</h3>
				<div class="form-row">
					<input type="email" name="email" placeholder="メールアドレス" required />
					<button type="submit" class="btn-primary">招待</button>
				</div>
			</form>
		</section>
	</div>
</div>

<style>
	.hospital-detail {
		max-width: 1000px;
	}

	.header {
		margin-bottom: 2rem;
	}

	.back-link {
		color: #64748b;
		text-decoration: none;
		font-size: 0.875rem;
	}

	.back-link:hover {
		color: #2563eb;
	}

	h1 {
		margin: 0.5rem 0 0.25rem;
	}

	.slug {
		color: #64748b;
		font-family: monospace;
	}

	.content-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	.section {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.section h2 {
		font-size: 1rem;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.empty {
		color: #64748b;
		font-size: 0.875rem;
	}

	.member-list,
	.invitation-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.member-item,
	.invitation-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f1f5f9;
	}

	.member-item:last-child,
	.invitation-item:last-child {
		border-bottom: none;
	}

	.member-name,
	.invitation-email {
		font-weight: 500;
		display: block;
	}

	.member-email {
		font-size: 0.75rem;
		color: #64748b;
	}

	.member-role,
	.invitation-role {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		background: #f1f5f9;
		border-radius: 4px;
	}

	.invitation-meta {
		font-size: 0.75rem;
		color: #64748b;
	}

	.invite-form {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.invite-form h3 {
		font-size: 0.875rem;
		margin-bottom: 0.75rem;
	}

	.form-row {
		display: flex;
		gap: 0.5rem;
	}

	.form-row input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
	}

	.btn-primary {
		background: #2563eb;
		color: white;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.btn-primary:hover {
		background: #1d4ed8;
	}

	@media (max-width: 768px) {
		.content-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
