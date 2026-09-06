<script lang="ts">
	import { page } from "$app/stores";
	const error = $derived($page.error);
	const status = $derived($page.status);
</script>

<main class="error-page">
	<h1>{status ?? "Error"}</h1>
	<p>{error?.message ?? "Something went wrong."}</p>
	<a href="/">Go to Home</a>
</main>

<style lang="scss">

	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		text-align: center;
		gap: 1em;
	}

	h1 {
		font-size: 3em;
		margin: 0;
		color: #fff;
	}

	p {
		color: var(--secondary-font-color);
		font-size: 1.1em;
	}

	a {
		color: #8ab4f8;
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}
</style>
