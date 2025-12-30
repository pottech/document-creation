<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	const roleLabel = $derived(data.invitation.role === 'hospital_admin' ? '病院管理者' : '病院ユーザー');
</script>

<div class="invite-container">
	<h1>招待を受け入れる</h1>

	<div class="invitation-info">
		<p>
			<strong>{data.invitation.invitedBy}</strong> さんから
			<strong>{data.invitation.hospitalName}</strong> への招待が届いています
		</p>
		<p class="role">ロール: {roleLabel}</p>
		<p class="email">招待先: {data.invitation.email}</p>
	</div>

	<form method="POST" action="?/accept" use:enhance>
		<button type="submit" class="accept-button">
			{#if data.isLoggedIn}
				招待を受け入れる
			{:else}
				サインインして招待を受け入れる
			{/if}
		</button>
	</form>
</div>

<style>
	.invite-container {
		max-width: 500px;
		margin: 4rem auto;
		padding: 2rem;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		text-align: center;
	}

	h1 {
		margin-bottom: 1.5rem;
	}

	.invitation-info {
		background: #f8fafc;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.invitation-info p {
		margin: 0.5rem 0;
	}

	.role {
		color: #2563eb;
		font-weight: 500;
	}

	.email {
		color: #64748b;
		font-size: 0.875rem;
	}

	.accept-button {
		width: 100%;
		padding: 0.75rem;
		background: #16a34a;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	.accept-button:hover {
		background: #15803d;
	}
</style>
