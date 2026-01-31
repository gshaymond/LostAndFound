<script lang="ts">
  import { login } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  const submit = async (e: Event) => {
    e.preventDefault();
    error = '';
    loading = true;
    try {
      await login(email, password);
      goto('/items');
    } catch (err: any) {
      console.error(err);
      error = err.response?.data?.error || 'Login failed';
    } finally {
      loading = false;
    }
  };
</script>

<section class="container mx-auto max-w-md mt-12">
  <h2 class="text-2xl font-bold mb-4">Login</h2>
  {#if error}
    <div class="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>
  {/if}
  <form on:submit|preventDefault={submit} class="space-y-4">
    <div>
      <label class="block text-sm" for="email">Email</label>
      <input id="email" class="w-full border rounded p-2" type="email" bind:value={email} required />
    </div>
    <div>
      <label class="block text-sm" for="password">Password</label>
      <input id="password" class="w-full border rounded p-2" type="password" bind:value={password} required />
    </div>
    <div>
      <button class="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>Login</button>
    </div>
  </form>
</section>
