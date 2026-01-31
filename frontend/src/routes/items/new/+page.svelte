<script lang="ts">
  import { onMount } from 'svelte';
  import api from '$lib/api';
  import { token } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  let type = 'lost';
  let title = '';
  let description = '';
  let category = 'other';
  let location = '';
  let dateLost = '';
  let dateFound = '';
  let error = '';
  let loading = false;

  let currentToken: string | null = null;
  token.subscribe((t) => (currentToken = t));

  onMount(() => {
    if (!currentToken) {
      goto('/login');
    }
  });

  const submit = async (e: Event) => {
    e.preventDefault();
    error = '';
    loading = true;
    try {
      const payload: any = { type, title, description, category };
      if (location) payload.location = { address: location };
      if (type === 'lost' && dateLost) payload.dateLost = dateLost;
      if (type === 'found' && dateFound) payload.dateFound = dateFound;

      await api.post('/items', payload);
      goto('/items');
    } catch (err: any) {
      console.error(err);
      error = err.response?.data?.error || 'Failed to post item';
    } finally {
      loading = false;
    }
  };
</script>

<section class="container mx-auto max-w-lg mt-8">
  <h2 class="text-2xl font-bold mb-4">Post an Item</h2>
  {#if error}
    <div class="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>
  {/if}
  <form on:submit|preventDefault={submit} class="space-y-4">
    <div>
      <label class="block text-sm" for="type">Type</label>
      <select id="type" bind:value={type} class="w-full border rounded p-2">
        <option value="lost">Lost</option>
        <option value="found">Found</option>
      </select>
    </div>

    <div>
      <label class="block text-sm" for="title">Title</label>
      <input id="title" class="w-full border rounded p-2" bind:value={title} required />
    </div>

    <div>
      <label class="block text-sm" for="description">Description</label>
      <textarea id="description" class="w-full border rounded p-2" bind:value={description} required></textarea>
    </div>

    <div>
      <label class="block text-sm" for="category">Category</label>
      <select id="category" bind:value={category} class="w-full border rounded p-2">
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
        <option value="accessories">Accessories</option>
        <option value="documents">Documents</option>
        <option value="keys">Keys</option>
        <option value="bags">Bags</option>
        <option value="pets">Pets</option>
        <option value="other">Other</option>
      </select>
    </div>

    <div>
      <label class="block text-sm" for="location">Location (city, address)</label>
      <input id="location" class="w-full border rounded p-2" bind:value={location} />
    </div>

    {#if type === 'lost'}
      <div>
        <label class="block text-sm" for="dateLost">Date Lost</label>
        <input id="dateLost" class="w-full border rounded p-2" type="date" bind:value={dateLost} />
      </div>
    {:else}
      <div>
        <label class="block text-sm" for="dateFound">Date Found</label>
        <input id="dateFound" class="w-full border rounded p-2" type="date" bind:value={dateFound} />
      </div>
    {/if}

    <div>
      <button class="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>Post</button>
    </div>
  </form>
</section>
