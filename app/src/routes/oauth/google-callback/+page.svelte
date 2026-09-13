<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { authClient, setAuthToken } from "$lib/auth-client";

	// Native Google sign-in lands back here (same-origin callbackURL). The
	// OAuth loop ran inside the WebView, so the session cookie is already in
	// the WebView's cookie jar when this bundle boots. Exchange it for the
	// bearer token the app authenticates with, then continue into the app.
	onMount(async () => {
		try {
			const res = await authClient.getSession({ query: {} });
			const token = res.data?.session?.token;
			const user = res.data?.user;
			if (token && user) {
				setAuthToken(token);
			}
		} catch {
			// session may already be set from the cookie jar
		}
		goto("/", { replaceState: true });
	});
</script>

<svelte:head>
	<title>Completing sign in — Mezzo</title>
</svelte:head>

<div class="oauth-callback-copy">
	<p>Completing sign in...</p>
</div>

<style>
	.oauth-callback-copy {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #9ca3af;
		font-size: 0.95rem;
	}
</style>