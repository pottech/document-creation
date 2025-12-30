<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	const roleLabels: Record<string, string> = {
		hospital_admin: '病院管理者',
		hospital_user: '病院ユーザー'
	};
</script>

<div class="members-page">
	<div class="header">
		<h1>メンバー管理</h1>
		<a href="/{data.hospital?.slug}/members/invite" class="btn-primary">+ ユーザーを招待</a>
	</div>

	<section class="section">
		<h2>メンバー ({data.members.length})</h2>

		{#if data.members.length === 0}
			<p class="empty">メンバーがいません</p>
		{:else}
			<div class="member-table">
				<table>
					<thead>
						<tr>
							<th>名前</th>
							<th>メールアドレス</th>
							<th>ロール</th>
							<th>参加日</th>
						</tr>
					</thead>
					<tbody>
						{#each data.members as member}
							<tr>
								<td>{member.user.name}</td>
								<td>{member.user.email}</td>
								<td>
									<span class="role-badge" class:admin={member.role === 'hospital_admin'}>
										{roleLabels[member.role]}
									</span>
								</td>
								<td>{new Date(member.createdAt).toLocaleDateString('ja-JP')}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<section class="section">
		<h2>招待中 ({data.invitations.length})</h2>

		{#if data.invitations.length === 0}
			<p class="empty">保留中の招待はありません</p>
		{:else}
			<div class="invitation-list">
				{#each data.invitations as invitation}
					<div class="invitation-item">
						<div class="invitation-info">
							<span class="invitation-email">{invitation.email}</span>
							<span class="role-badge">{roleLabels[invitation.role]}</span>
						</div>
						<div class="invitation-meta">
							期限: {new Date(invitation.expiresAt).toLocaleDateString('ja-JP')}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.members-page {
		max-width: 900px;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	h1 {
		margin: 0;
	}

	.btn-primary {
		background: #2563eb;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		text-decoration: none;
		font-weight: 500;
	}

	.btn-primary:hover {
		background: #1d4ed8;
	}

	.section {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 1.5rem;
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

	.member-table {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #f1f5f9;
	}

	th {
		font-weight: 500;
		color: #64748b;
		font-size: 0.875rem;
	}

	.role-badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		background: #f1f5f9;
		border-radius: 4px;
	}

	.role-badge.admin {
		background: #dcfce7;
		color: #16a34a;
	}

	.invitation-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.invitation-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: #f8fafc;
		border-radius: 4px;
	}

	.invitation-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.invitation-email {
		font-weight: 500;
	}

	.invitation-meta {
		font-size: 0.75rem;
		color: #64748b;
	}
</style>
