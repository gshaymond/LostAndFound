<script lang="ts">
  import { onMount } from 'svelte';
  import api from '$lib/api';
  import ItemCard from '$lib/components/ItemCard.svelte';
  import { user } from '$lib/stores/auth';

  let items: any[] = [];
  let page = 1;
  let totalPages = 1;
  let limit = 10;
  let search = '';
  let loading = false;

  const fetchItems = async () => {
    loading = true;
    try {
      const res = await api.get('/items', { params: { page, limit, search } });
      items = res.data.items;
      totalPages = res.data.pagination.pages || 1;
    } catch (err) {
      console.error('Failed to fetch items', err);
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    fetchItems();
  });

  const next = () => {
    if (page < totalPages) {
      page += 1;
      fetchItems();
    }
  };

  const prev = () => {
    if (page > 1) {
      page -= 1;
      fetchItems();
    }
  };
</script>

<section class="container mx-auto mt-8">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-bold">Items</h2>
    <div>
      <input placeholder="Search" class="border rounded p-2" bind:value={search} on:keydown={(e) => e.key === 'Enter' && fetchItems()} />
      <a href="/items/new" class="ml-4 bg-green-600 text-white px-3 py-2 rounded">Post Item</a>
    </div>
  </div>

  {#if loading}
    <div class="text-center py-8">Loading...</div>
  {:else if items.length === 0}
    <div class="text-center py-8">No items found</div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each items as it}
        <ItemCard item={it} />
      {/each}
    </div>

    <div class="flex items-center justify-center space-x-4 mt-6">
      <button class="px-3 py-1 border rounded" on:click={prev} disabled={page === 1}>Prev</button>
      <div>Page {page} of {totalPages}</div>
      <button class="px-3 py-1 border rounded" on:click={next} disabled={page === totalPages}>Next</button>
    </div>
  {/if}
</section>
