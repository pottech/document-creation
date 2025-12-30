<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<div class="login-container">
	<h1>ログイン</h1>
	<p>アカウントにサインインしてください</p>

	<form method="POST" use:enhance>
		<button type="submit" class="login-button">Keycloakでサインイン</button>
	</form>
</div>

<style>
	.login-container {
		max-width: 400px;
		margin: 4rem auto;
		padding: 2rem;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		text-align: center;
	}

	h1 {
		margin-bottom: 0.5rem;
	}

	p {
		color: #64748b;
		margin-bottom: 2rem;
	}

	.login-button {
		width: 100%;
		padding: 0.75rem;
		background: #2563eb;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	.login-button:hover {
		background: #1d4ed8;
	}
</style>
