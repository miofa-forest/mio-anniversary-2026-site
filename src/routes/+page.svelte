<script lang="ts">
	import { listSubmissions, newSubmission } from './data.remote';
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<ul>
	{#each await listSubmissions() as { id, data } (id)}
		<li>{data.message}</li>
	{/each}
</ul>

<form {...newSubmission}>
	<label>
		<h2>Message</h2>
		<textarea {...newSubmission.fields.message.as('text')}></textarea>
	</label>

	<button>Publish!</button>
</form>
