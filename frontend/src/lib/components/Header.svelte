<script lang="ts">
  import { user, logout, initAuth } from '$lib/stores/auth';
  import { onMount } from 'svelte';

  onMount(() => {
    initAuth();
  });
</script>

<header class="bg-blue-600 text-white p-4">
  <div class="container mx-auto flex justify-between items-center">
    <h1 class="text-2xl font-bold">Lost & Found Hub</h1>
    <nav>
      <ul class="flex space-x-4 items-center">
        <li><a href="/" class="hover:underline">Home</a></li>
        <li><a href="/items" class="hover:underline">Items</a></li>
        {#if $user}
          <li><a href="/items/new" class="hover:underline">Post Item</a></li>
          <li class="ml-2">Hello, {($user as any)?.name || 'User'}</li>
          <li><button class="ml-2 bg-red-600 px-3 py-1 rounded" on:click={logout}>Logout</button></li>
        {:else}
          <li><a href="/login" class="hover:underline">Login</a></li>
          <li><a href="/register" class="hover:underline">Register</a></li>
        {/if}
      </ul>
    </nav>
  </div>
</header>