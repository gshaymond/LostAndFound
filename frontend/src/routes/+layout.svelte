<script>
	import "../app.css";
	import { browser } from "$app/environment";
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen flex flex-col">
	{#if browser}
		<Header />
	{/if}
	<main class="flex-grow container mx-auto p-4">
		<slot />
	</main>
	<Footer />
</div>
