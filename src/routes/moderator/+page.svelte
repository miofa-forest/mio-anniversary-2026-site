<script lang="ts">
	import { listSubmissions } from './data.remote';
</script>

<ul>
	{#each await listSubmissions() as submission (submission.id)}
		<li>{submission.id} / {submission.data.message} / {submission.status}</li>
	{/each}
</ul>
