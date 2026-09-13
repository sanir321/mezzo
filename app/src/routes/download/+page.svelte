<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";

	onMount(() => {
		goto("/landing#download", { replaceState: true });
	});
</script>

<svelte:head>
	<title>Downloading Mezzo for Android...</title>
	<meta http-equiv="refresh" content="0;url=/landing#download" />
</svelte:head>

<div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #080808; color: #fff; font-family: sans-serif;">
	<p>Redirecting to Mezzo download page...</p>
</div>
