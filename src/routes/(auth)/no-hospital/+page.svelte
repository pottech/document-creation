<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<div class="container">
	<h1>病院アカウントがありません</h1>
	<p>現在、どの病院アカウントにも所属していません。</p>
	<p>病院管理者からの招待をお待ちください。</p>

	<form method="POST" action="/auth/logout" use:enhance>
		<button type="submit" class="logout-button">ログアウト</button>
	</form>
</div>

<style>
	.container {
		max-width: 500px;
		margin: 4rem auto;
		padding: 2rem;
		text-align: center;
	}

	h1 {
		margin-bottom: 1rem;
		color: #1e293b;
	}

	p {
		color: #64748b;
		margin-bottom: 0.5rem;
	}

	.logout-button {
		margin-top: 2rem;
		padding: 0.5rem 1.5rem;
		background: #64748b;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.logout-button:hover {
		background: #475569;
	}
</style>
