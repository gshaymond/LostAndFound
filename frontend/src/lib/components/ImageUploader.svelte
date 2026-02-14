<script lang="ts">
  import api from '$lib/api';
  export let images: string[] = [];
  let uploading = false;
  let progressMap: Record<string, number> = {};

  const uploadFile = async (file: File) => {
    try {
      uploading = true;
      const res = await api.post('/uploads/presign', { filename: file.name, contentType: file.type });
      const { url, publicUrl } = res.data;

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            progressMap[file.name] = Math.round((e.loaded / e.total) * 100);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(true);
          else reject(new Error('Upload failed'));
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(file);
      });

      images = [...images, publicUrl];
      delete progressMap[file.name];
    } catch (err) {
      console.error('Upload error', err);
      alert('Upload failed');
    } finally {
      uploading = false;
    }
  };

  const onFiles = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;
    for (let i = 0; i < input.files.length; i++) {
      uploadFile(input.files[i]);
    }
  };

  const removeImage = (url: string) => {
    images = images.filter((u) => u !== url);
  };
</script>

<div class="space-y-2">
  <div>
    <label class="block text-sm">Upload</label>
    <input type="file" multiple on:change={onFiles} />
  </div>
  <div class="grid grid-cols-3 gap-2">
    {#each images as img}
      <div class="relative">
        <img src={img} alt="uploaded" class="w-full h-24 object-cover rounded" />
        <button class="absolute top-1 right-1 bg-white rounded-full p-1" on:click={() => removeImage(img)}>✕</button>
      </div>
    {/each}
  </div>
  <div>
    {#each Object.entries(progressMap) as [name, p]}
      <div>{name}: {p}%</div>
    {/each}
  </div>
</div>
