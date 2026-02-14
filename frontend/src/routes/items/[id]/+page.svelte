<script lang="ts">
  import { onMount } from 'svelte';
  import api from '$lib/api';
  import LocationPicker from '$lib/components/LocationPicker.svelte';
  import ItemCard from '$lib/components/ItemCard.svelte';
  import { page } from '$app/stores';

  let data: any = null;
  let id: string | null = null;
  let address: string = '';
  let lat: number | null = null;
  let lng: number | null = null;

  $: id = $page.params.id ?? null;

  onMount(async () => {
    if (id) {
      try {
        const res = await api.get(`/items/${id}`);
        data = res.data.item;
        address = data.location?.address || '';
        if (data.location?.coordinates) {
          // store as local vars (GeoJSON order: [lng, lat])
          lng = data.location.coordinates[0];
          lat = data.location.coordinates[1];
        }
      } catch (err) {
        console.error('Failed to load item', err);
      }
    }
  });
</script>

<section class="container mx-auto mt-8">
  {#if !data}
    <div>Loading...</div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="md:col-span-2">
        <h2 class="text-2xl font-bold">{data.title}</h2>
        <div class="text-sm text-gray-600">{data.category} • {data.type}</div>
        <p class="mt-4">{data.description}</p>

        {#if data.images && data.images.length > 0}
          <div class="grid grid-cols-2 gap-2 mt-4">
            {#each data.images as img}
              <img src={img} alt="item" class="w-full object-cover rounded" />
            {/each}
          </div>
        {/if}
      </div>
      <div>
        <div class="bg-white p-4 rounded shadow">
          <div class="mb-2">Contact</div>
          <div>Name: {data.userId?.name}</div>
          <div>Email: {data.userId?.email}</div>
          <div class="mt-4">Location</div>
          {#if data.location && data.location.coordinates}
            <LocationPicker readonly {address} {lat} {lng} />
          {:else}
            <div>No location provided</div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</section>