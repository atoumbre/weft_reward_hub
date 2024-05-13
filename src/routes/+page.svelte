<script lang="ts">
	import { getAprs } from '$lib/incentives_apr';
	import { JsonView } from '@zerodevx/svelte-json-view';
</script>

{#await getAprs()}
	<p>loading...</p>
{:then json}
	<JsonView {json} />
{:catch}
	<p>error 🫤</p>
{/await}
