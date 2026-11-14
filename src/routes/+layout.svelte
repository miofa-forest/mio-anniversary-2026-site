<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import AccountGearModal from '$lib/components/AccountGearModal.svelte';
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';

	let { children } = $props();

	let siteOrigin = $derived(
		env.PUBLIC_CANONICAL_URL?.replace(/\/$/, '') || page.url.origin || 'https://miofa-forest.com'
	);
	let currentCanonicalUrl = $derived(
		env.PUBLIC_CANONICAL_URL
			? `${env.PUBLIC_CANONICAL_URL.replace(/\/$/, '')}${page.url.pathname}`
			: page.url.href
	);
	let ogImageUrl = $derived(`${siteOrigin}/album%20assets/cover.png`);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="canonical" href={currentCanonicalUrl} />
	<title>Off the Gourd: My Mio Travel Book | Ookami Mio 8th Anniversary</title>
	<meta
		name="description"
		content="Celebrate 8 years with our oshi, Ookami Mio! Browse travel photos, local spots, regional food, and heartfelt messages from fans worldwide."
	/>

	<!-- OpenGraph / Facebook / Discord -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="My Mio Travel Book Archive" />
	<meta property="og:url" content={currentCanonicalUrl} />
	<meta
		property="og:title"
		content="Off the Gourd: My Mio Travel Book | Ookami Mio 8th Anniversary"
	/>
	<meta
		property="og:description"
		content="Celebrate 8 years with our oshi, Ookami Mio! Browse travel photos, local spots, regional food, and heartfelt messages from fans worldwide."
	/>
	<meta property="og:image" content={ogImageUrl} />
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
	<meta name="twitter:image" content={ogImageUrl} />
</svelte:head>
{@render children()}
<AccountGearModal />
