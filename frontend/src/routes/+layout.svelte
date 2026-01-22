<script>
	import "../app.css";
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="{favicon}" />
</svelte:head>

<div class="min-h-screen flex flex-col">
	<Header />
	<main class="flex-grow container mx-auto p-4">
		{@render children()}
	</main>
	<Footer />
</div>
