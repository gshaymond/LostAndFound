<script>
	import "../app.css";
	import { browser } from "$app/environment";
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#if import.meta.env.VITE_GA_ID}
		<script async src={`https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GA_ID}`}></script>
		<script>
			window.dataLayer = window.dataLayer || [];
			function gtag(){dataLayer.push(arguments)}
			gtag('js', new Date());
			gtag('config', import.meta.env.VITE_GA_ID);
		</script>
	{/if}
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
