<script lang="ts">
  export let item: any;
</script>

<article class="border rounded p-4 shadow-sm hover:shadow-md transition">
  <div class="flex items-start space-x-4">
    <div class="w-24 h-24 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
      {#if item.images && item.images.length}
        <img src={item.images[0]} alt={item.title} class="object-cover w-full h-full" />
      {:else}
        <span class="text-sm text-gray-500">No Image</span>
      {/if}
    </div>
    <div class="flex-1">
      <h3 class="text-lg font-semibold">{item.title}</h3>
      <div class="text-xs text-gray-500">{item.category} • {item.type}</div>
      <p class="mt-2 text-sm text-gray-700">{item.description.length > 120 ? item.description.slice(0, 120) + '...' : item.description}</p>
      <div class="mt-3 flex items-center justify-between">
        <a href={`/items/${item._id}`} class="text-blue-600 hover:underline text-sm">View</a>
        <div class="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</div>
      </div>
    </div>
  </div>
</article>
