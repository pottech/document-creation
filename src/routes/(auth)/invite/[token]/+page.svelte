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

	{#if data.isLoggedIn}
		<form method="POST" action="?/accept" use:enhance>
			<button type="submit" class="accept-button">
				招待を受け入れる
			</button>
		</form>
	{:else}
		<div class="auth-options">
			<p class="auth-description">招待を受け入れるには、アカウントが必要です</p>

			<div class="button-group">
				<form method="POST" action="?/accept" use:enhance>
					<button type="submit" class="login-button">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
							<polyline points="10 17 15 12 10 7" />
							<line x1="15" y1="12" x2="3" y2="12" />
						</svg>
						既存アカウントでログイン
					</button>
				</form>

				<div class="divider">
					<span>または</span>
				</div>

				<form method="POST" action="?/register" use:enhance>
					<button type="submit" class="register-button">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
							<circle cx="8.5" cy="7" r="4" />
							<line x1="20" y1="8" x2="20" y2="14" />
							<line x1="23" y1="11" x2="17" y2="11" />
						</svg>
						新規アカウントを作成
					</button>
				</form>
			</div>
		</div>
	{/if}
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
		color: #1e293b;
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

	.auth-options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.auth-description {
		color: #64748b;
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	.button-group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.button-group form {
		width: 100%;
	}

	.login-button,
	.register-button,
	.accept-button {
		width: 100%;
		padding: 0.875rem 1rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition: all 0.2s ease;
	}

	.accept-button {
		background: #16a34a;
		color: white;
	}

	.accept-button:hover {
		background: #15803d;
	}

	.login-button {
		background: #2563eb;
		color: white;
	}

	.login-button:hover {
		background: #1d4ed8;
	}

	.register-button {
		background: #16a34a;
		color: white;
	}

	.register-button:hover {
		background: #15803d;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 1rem;
		color: #94a3b8;
		font-size: 0.875rem;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: #e2e8f0;
	}
</style>
