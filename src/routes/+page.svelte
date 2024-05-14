<script lang="ts">
	import { getAprs } from '$lib';
	import { JsonView } from '@zerodevx/svelte-json-view';
</script>

{#await getAprs()}
	<p>loading...</p>
{:then json}
	<JsonView {json} />
{:catch}
	<p>error 🫤</p>
{/await}
