<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import AccountGearModal from '$lib/components/AccountGearModal.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Off the Gourd: My Mio Travel Book | Ookami Mio 8th Anniversary</title>
	<meta
		name="description"
		content="Celebrate 8 years with our oshi, Ookami Mio! Browse travel photos, local spots, regional food, and heartfelt messages from fans worldwide."
	/>

	<!-- OpenGraph / Facebook / Discord -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="My Mio Travel Book Archive" />
	<meta
		property="og:title"
		content="Off the Gourd: My Mio Travel Book | Ookami Mio 8th Anniversary"
	/>
	<meta
		property="og:description"
		content="Celebrate 8 years with our oshi, Ookami Mio! Browse travel photos, local spots, regional food, and heartfelt messages from fans worldwide."
	/>
	<meta property="og:image" content="/album%20assets/cover.png" />
	<meta name="theme-color" content="#c92a42" />

	<!-- Twitter / X Cards -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta
		name="twitter:title"
		content="Off the Gourd: My Mio Travel Book | Ookami Mio 8th Anniversary"
	/>
	<meta
		name="twitter:description"
		content="Celebrate 8 years with our oshi, Ookami Mio! Browse travel photos, local spots, regional food, and heartfelt messages from fans worldwide."
	/>
	<meta name="twitter:image" content="/album%20assets/cover.png" />
</svelte:head>
{@render children()}
<AccountGearModal />
