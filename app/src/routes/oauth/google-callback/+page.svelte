<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { authClient, setAuthToken } from "$lib/auth-client";

	let deepLinkUrl = $state<string | null>(null);

	onMount(async () => {
		let token = "";
		try {
			const res = await authClient.getSession({ query: {} });
			token = res.data?.session?.token || "";
			const user = res.data?.user;
			if (token && user) {
				setAuthToken(token);
			}
		} catch {
			// session may already be set from the cookie jar
		}

		const isNative = page.url.searchParams.get("native") === "1";
		if (isNative) {
			const target = `mezzo://oauth-success?token=${encodeURIComponent(token)}`;
			deepLinkUrl = target;
			// Automatically launch the app
			window.location.href = target;
			return;
		}

		goto("/", { replaceState: true });
	});
</script>

<svelte:head>
	<title>Completing sign in — Mezzo</title>
</svelte:head>

<div class="oauth-callback-copy">
	<p>Completing sign in...</p>
	{#if deepLinkUrl}
		<a href={deepLinkUrl} class="return-btn">
			Return to Mezzo App
		</a>
	{/if}
</div>

<style>
	.oauth-callback-copy {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
		justify-content: center;
		color: #9ca3af;
		font-size: 0.95rem;
		background-color: #0b0b0b;
	}

	.return-btn {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: #1ed760;
		color: #000;
		font-weight: 700;
		border-radius: 9999px;
		text-decoration: none;
		transition: opacity 0.2s;
	}

	.return-btn:hover {
		opacity: 0.9;
	}
</style>