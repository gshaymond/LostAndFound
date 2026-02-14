<script lang="ts">
  import api from '$lib/api';
  export let lat: number | null = null;
  export let lng: number | null = null;
  export let address: string = '';
  export let readonly: boolean = false;

  const lookupAddress = async () => {
    if (!address) return;
    try {
      const res = await api.post('/geocode', { address });
      lat = res.data.lat;
      lng = res.data.lng;
      address = res.data.address;
    } catch (err) {
      console.error('Geocode lookup failed', err);
      alert('Address lookup failed');
    }
  };
</script>

<div class="space-y-2">
  <div class="flex space-x-2 items-center">
    <input class="border rounded p-2 flex-1" placeholder="Address" bind:value={address} {readonly} />
    {#if !readonly}
      <button class="px-3 py-2 border rounded" on:click={lookupAddress}>Lookup</button>
    {/if}
  </div>
  {#if readonly}
    <div class="text-sm text-gray-600">{address}{#if lat && lng} • {lat.toFixed(4)},{lng.toFixed(4)}{/if}</div>
  {/if}
</div>
