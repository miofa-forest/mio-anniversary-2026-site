<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { resolve } from '$app/paths';

	interface AlbumEntry {
		id: string | number;
		img: string;
		caption: string;
		author: string;
		country: string;
		avatar: string;
		message: string;
	}

	let currentSpread = $state(0);
	let mode = $state<'single' | 'double'>('single');
	let albumElement: HTMLElement | null = null;
	let totalPages = $state(6); // Will be dynamically updated based on leaves count

	// Selected photo for the polaroid / message popup
	let selectedEntry = $state<AlbumEntry | null>(null);

	// Default entries to guarantee instant rendering even before API responds
	let albumPages = $state<AlbumEntry[]>([
		{
			id: 'demo-1',
			img: '/album assets/photo1.png',
			caption: '#1',
			author: 'Miofa1',
			country: 'Japan',
			avatar: '/user/m1.jpg',
			message: 'Happy 8th Anniversary Mio mama! Hope you enjoy this hot bowl of ramen!'
		},
		{
			id: 'demo-2',
			img: '/album assets/photo1.png',
			caption: '#2',
			author: 'Anonymous Miofa',
			country: 'Philippines',
			avatar: '/user/m1.jpg',
			message: 'Warm forest stew from our province! Thank you for 8 wonderful years of smiles.'
		},
		{
			id: 'demo-3',
			img: '/album assets/photo1.png',
			caption: '#3',
			author: 'KuroTae',
			country: 'USA',
			avatar: '/user/m1.jpg',
			message: 'Fresh homemade pancakes! Best paired with your morning streams.'
		},
		{
			id: 'demo-4',
			img: '/album assets/photo1.png',
			caption: '#4',
			author: 'Miofa_Global',
			country: 'Indonesia',
			avatar: '/user/m1.jpg',
			message: 'Spicy satay skewers! Sending warm wishes from overseas!'
		},
		{
			id: 'demo-5',
			img: '/album assets/photo1.png',
			caption: '#5',
			author: 'TaigaFan',
			country: 'Canada',
			avatar: '/user/m1.jpg',
			message: 'Traditional maple pastries to celebrate your milestone.'
		},
		{
			id: 'demo-6',
			img: '/album assets/photo1.png',
			caption: '#6',
			author: 'Sparky',
			country: 'Germany',
			avatar: '/user/m1.jpg',
			message: 'Fresh bakery bread and sausages! Always cheering for you, Mio!'
		},
		{
			id: 'demo-7',
			img: '/album assets/photo1.png',
			caption: '#7',
			author: 'NightWolf',
			country: 'Taiwan',
			avatar: '/user/m1.jpg',
			message: 'Sweet bubble tea and street snacks for your anniversary concert!'
		},
		{
			id: 'demo-8',
			img: '/album assets/photo1.png',
			caption: '#8',
			author: 'OuroMio',
			country: 'United Kingdom',
			avatar: '/user/m1.jpg',
			message: 'Afternoon forest tea blend. Here is to many more anniversaries ahead!'
		}
	]);

	// Region filter & mobile swipe state
	let selectedRegion = $state('All');
	let touchStartX = 0;
	let touchStartY = 0;

	let availableRegions = $derived.by(() => {
		const regions = new SvelteSet<string>();
		albumPages.forEach((p) => {
			if (p.country) regions.add(p.country);
		});
		return ['All', ...Array.from(regions).sort()];
	});

	let displayedPages = $derived.by(() => {
		if (selectedRegion === 'All') return albumPages;
		return albumPages.filter((p) => p.country === selectedRegion);
	});

	// Dynamically group displayed entries into 2-sided book leaves
	let leaves = $derived.by(() => {
		const pairs: { leafIndex: number; front: AlbumEntry; back: AlbumEntry | null }[] = [];
		for (let i = 0; i < displayedPages.length; i += 2) {
			pairs.push({
				leafIndex: Math.floor(i / 2) + 1,
				front: displayedPages[i],
				back: i + 1 < displayedPages.length ? displayedPages[i + 1] : null
			});
		}
		return pairs;
	});

	function selectRegion(region: string) {
		selectedRegion = region;
		currentSpread = 0;
		tick().then(() => updatePageZIndexes());
	}

	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length === 1) {
			touchStartX = e.touches[0].clientX;
			touchStartY = e.touches[0].clientY;
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (e.changedTouches.length === 1) {
			const deltaX = e.changedTouches[0].clientX - touchStartX;
			const deltaY = e.changedTouches[0].clientY - touchStartY;
			if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
				if (deltaX < 0) {
					flipNext();
				} else {
					flipPrev();
				}
			}
		}
	}

	function updatePageZIndexes() {
		if (!albumElement) return;
		const pages = Array.from(albumElement.querySelectorAll('.page')) as HTMLElement[];
		totalPages = pages.length;

		pages.forEach((page, index) => {
			if (index < currentSpread) {
				page.classList.add('flipped');
				page.style.zIndex = `${index + 1}`;
			} else {
				page.classList.remove('flipped');
				page.style.zIndex = `${totalPages - index}`;
			}
		});
	}

	function flipNext() {
		if (currentSpread < totalPages - 1) {
			currentSpread++;
			updatePageZIndexes();
		}
	}

	function flipPrev() {
		if (currentSpread > 0) {
			currentSpread--;
			updatePageZIndexes();
		}
	}

	function setMode(newMode: 'single' | 'double') {
		mode = newMode;
	}

	function openDetailModal(entry: AlbumEntry, event?: Event) {
		if (event) {
			event.stopPropagation();
		}
		selectedEntry = entry;
	}

	function closeDetailModal() {
		selectedEntry = null;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (selectedEntry && e.key === 'Escape') {
			closeDetailModal();
			return;
		}
		if (!selectedEntry) {
			if (e.key === 'ArrowRight' || e.key === 'PageDown') flipNext();
			if (e.key === 'ArrowLeft' || e.key === 'PageUp') flipPrev();
		}
	}

	onMount(() => {
		// Initial z-index alignment
		tick().then(() => {
			updatePageZIndexes();
		});

		// Fetch live approved submissions from backend API
		fetch('/api/submissions')
			.then((res) => res.json())
			.then((data) => {
				if (data.success && Array.isArray(data.submissions) && data.submissions.length > 0) {
					albumPages = data.submissions;
					tick().then(() => {
						updatePageZIndexes();
					});
				}
			})
			.catch((err) => {
				console.warn('Could not load live submissions, staying on initial entries:', err);
			});

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});
</script>

<!-- 1. TOP HERO GREETING BANNER -->
<header class="hero-anniversary-banner">
	<div class="banner-content">
		<span class="subtitle">DECEMBER 2018 &bull; 8 YEARS WITH OUR OKAMI</span>
		<h1 class="anniversary-heading">HAPPY 8TH ANNIVERSARY</h1>
		<p class="anniversary-tagline">Ookami Mio &times; Miofa Community Commemorative Archive</p>
		<a href="#book-section" class="scroll-down-btn">
			<span>Explore the Travel Book</span>
			<span class="arrow">&darr;</span>
		</a>
	</div>
</header>

<!-- 2. SCROLLABLE 3D BOOK SECTION -->
<main class="page-container album-page-layout" id="book-section">
	<section class="info-section" style="text-align: center; margin-bottom: 5px;">
		<span class="date">GLOBAL FAN COMMEMORATION</span>
		<h2>Off the gourd; My Mio Travel Book</h2>
		<p style="margin: 0 auto; max-width: 680px;">
			A collection of dishes and memories sent by fans worldwide. Click any photograph to read the
			note on the back.
		</p>
	</section>

	<!-- CONTROLS BAR -->
	<div class="album-controls-bar">
		<div class="mode-toggle">
			<button type="button" class:active={mode === 'single'} onclick={() => setMode('single')}>
				1 Page Mode
			</button>
			<button type="button" class:active={mode === 'double'} onclick={() => setMode('double')}>
				2 Pages Mode
			</button>
		</div>
		<div class="nav-buttons">
			<button type="button" onclick={flipPrev} disabled={currentSpread === 0}>
				&larr; Previous
			</button>
			<span class="page-indicator">
				{#if currentSpread === 0}
					Cover
				{:else if currentSpread >= totalPages - 1}
					Back Cover
				{:else}
					Page {currentSpread} of {Math.max(1, totalPages - 2)}
				{/if}
			</span>
			<button type="button" onclick={flipNext} disabled={currentSpread >= totalPages - 1}>
				Next &rarr;
			</button>
		</div>
	</div>

	<!-- REGION FILTER BAR -->
	{#if availableRegions.length > 2}
		<div class="region-filter-bar">
			<span class="region-filter-label">Browse by Region:</span>
			<div class="region-pills">
				{#each availableRegions as region (region)}
					<button
						type="button"
						class="region-pill-btn"
						class:active={selectedRegion === region}
						onclick={() => selectRegion(region)}
					>
						{region}
						<span class="pill-count">
							{#if region === 'All'}
								{albumPages.length}
							{:else}
								{albumPages.filter((p) => p.country === region).length}
							{/if}
						</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- 3D BOOK STAGE -->
	<div class="album-stage" ontouchstart={handleTouchStart} ontouchend={handleTouchEnd}>
		<div
			bind:this={albumElement}
			class="album mode-{mode}"
			class:closed={currentSpread === 0 || currentSpread >= totalPages - 1}
			class:open={currentSpread > 0 && currentSpread < totalPages - 1}
			onclick={flipNext}
			role="region"
			aria-label="3D Interactive Album"
		>
			<!-- COVER (Page 0) -->
			<div class="page cover">
				<div class="page-face front cover-face">
					<img class="page-bg" src="/album assets/cover.png" alt="Cover BG" />
					<div class="page-content cover-content">
						<span class="badge">Volume 1</span>
						<h1 class="book-cover-title">Off the gourd;<br />My Mio Travel Book</h1>
						<p class="book-cover-prompt">Tap or Click to Open</p>
					</div>
					<div class="spine-shadow"></div>
				</div>
				<div class="page-face back">
					<img class="page-bg" src="/album assets/inside bg.png" alt="Inside Front" />
					<div class="page-content">
						<h3 style="color: #fff;">Inside Front Cover</h3>
						<p class="caption" style="color: #cbd5e1;">Curated by the Miofa Fan Community.</p>
					</div>
					<div class="spine-shadow"></div>
				</div>
			</div>

			<!-- DYNAMIC CONTENT LEAVES -->
			{#each leaves as leaf (leaf.leafIndex)}
				<div class="page">
					<!-- FRONT FACE -->
					<div class="page-face front">
						<img class="page-bg" src="/album assets/inside bg.png" alt="Inside BG" />
						<div class="page-content">
							<div
								class="img-wrapper zoomable-wrapper"
								onclick={(e) => openDetailModal(leaf.front, e)}
								role="button"
								tabindex="0"
								onkeydown={(e) => e.key === 'Enter' && openDetailModal(leaf.front, e)}
								aria-label="Inspect dish and message"
							>
								<img src={leaf.front.img} alt="Dish {leaf.front.caption}" />
								<div class="photo-card-tag">
									<span>{leaf.front.author} &bull; {leaf.front.country}</span>
								</div>
							</div>
							<p class="caption">{leaf.front.caption}</p>
						</div>
						<div class="spine-shadow"></div>
						<div class="curl-shadow"></div>
					</div>

					<!-- BACK FACE -->
					<div class="page-face back">
						<img class="page-bg" src="/album assets/inside bg.png" alt="Inside BG" />
						<div class="page-content">
							{#if leaf.back}
								<div
									class="img-wrapper zoomable-wrapper"
									onclick={(e) => openDetailModal(leaf.back!, e)}
									role="button"
									tabindex="0"
									onkeydown={(e) => e.key === 'Enter' && openDetailModal(leaf.back!, e)}
									aria-label="Inspect dish and message"
								>
									<img src={leaf.back.img} alt="Dish {leaf.back.caption}" />
									<div class="photo-card-tag">
										<span>{leaf.back.author} &bull; {leaf.back.country}</span>
									</div>
								</div>
								<p class="caption">{leaf.back.caption}</p>
							{:else}
								<div class="empty-leaf-content">
									<p class="empty-prompt">Submit your regional dish to fill this page!</p>
									<a
										href={resolve('/submit')}
										class="submit-mini-btn"
										onclick={(e) => e.stopPropagation()}>+ Add Food Photo</a
									>
								</div>
							{/if}
						</div>
						<div class="spine-shadow"></div>
						<div class="curl-shadow"></div>
					</div>
				</div>
			{/each}

			<!-- BACK COVER -->
			<div class="page cover">
				<div class="page-face front">
					<img class="page-bg" src="/album assets/inside bg.png" alt="Inside BG" />
					<div class="page-content">
						<h3 style="color: #fff;">End of Volume 1</h3>
					</div>
					<div class="spine-shadow"></div>
				</div>
				<div class="page-face back cover-face">
					<img class="page-bg" src="/album assets/cover.png" alt="Back Cover" />
					<div class="page-content">
						<p style="color: #ffd700; font-weight: bold;">Archive Completed</p>
					</div>
					<div class="spine-shadow"></div>
				</div>
			</div>
		</div>
	</div>

	<!-- 3. SUBMISSION CALL TO ACTION LINK -->
	<section class="action-banner" style="margin-top: 50px; width: 100%; max-width: 900px;">
		<div>
			<h3>Want your local dish featured in the book?</h3>
			<p>Submit your food photo, region, and optional anniversary message.</p>
		</div>
		<div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
			<a href={resolve('/submit')} class="primary-btn">Go to Submission Page &rarr;</a>
		</div>
	</section>

	<!-- POLAROID BACK-OF-CARD MODAL -->
	{#if selectedEntry}
		<div class="modal-backdrop" onclick={closeDetailModal} role="dialog" aria-modal="true">
			<div class="postcard-container" onclick={(e) => e.stopPropagation()} role="document">
				<button class="close-btn" onclick={closeDetailModal} aria-label="Close modal"
					>&times;</button
				>

				<!-- LEFT SIDE: PHOTO -->
				<div class="postcard-front">
					<div class="postcard-photo-frame">
						<img src={selectedEntry.img} alt="Dish" />
					</div>
					<div class="postcard-photo-meta">
						<span class="entry-index">{selectedEntry.caption}</span>
						<span class="entry-country">{selectedEntry.country}</span>
					</div>
				</div>

				<!-- DIVIDER -->
				<div class="postcard-divider"></div>

				<!-- RIGHT SIDE: NOTE BACKSIDE -->
				<div class="postcard-back">
					<div class="stamp-box">
						<span>MIOFA<br />POST</span>
					</div>

					<div class="postcard-author-header">
						<span class="to-label">To: Ookami Mio</span>
						<div class="from-row">
							<img src={selectedEntry.avatar} class="mini-avatar" alt="Avatar" />
							<span class="from-label">From: <strong>{selectedEntry.author}</strong></span>
						</div>
						<span class="country-subtag">Origin: {selectedEntry.country}</span>
					</div>

					<div class="postcard-message-body">
						<p>"{selectedEntry.message}"</p>
					</div>

					<div class="postcard-footer">
						<span class="watermark">8th Anniversary Travel Collection &bull; 2026</span>
					</div>
				</div>
			</div>
		</div>
	{/if}
</main>

<style>
	/* HERO ANNIVERSARY BANNER */
	.hero-anniversary-banner {
		position: relative;
		min-height: 50vh;
		display: flex;
		justify-content: center;
		align-items: center;
		text-align: center;
		background: radial-gradient(circle at center, #4a1523 0%, #14141e 100%);
		padding: 60px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.banner-content {
		position: relative;
		z-index: 2;
		max-width: 850px;
	}

	.anniversary-heading {
		font-size: 3.2rem;
		font-weight: 800;
		color: #fff;
		letter-spacing: 2px;
		margin: 12px 0;
		text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
	}

	.anniversary-tagline {
		font-size: 1.1rem;
		color: #cbd5e1;
		margin-bottom: 25px;
	}

	.scroll-down-btn {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		color: #c92a42;
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 600;
		transition: transform 0.2s;
	}

	.scroll-down-btn:hover {
		transform: translateY(3px);
	}

	.arrow {
		font-size: 1.3rem;
	}

	/* 3D BOOK & CONTROLS */
	.album-page-layout {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 40px;
	}

	/* REGION FILTER BAR */
	.region-filter-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		flex-wrap: wrap;
		margin: 15px auto 5px;
		max-width: 900px;
		padding: 0 15px;
	}

	.region-filter-label {
		font-size: 0.8rem;
		font-weight: 700;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.region-pills {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.region-pill-btn {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: #cbd5e1;
		font-size: 0.8rem;
		font-weight: 600;
		padding: 4px 12px;
		border-radius: 16px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		transition: all 0.2s;
	}

	.region-pill-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		color: #fff;
		border-color: rgba(255, 215, 0, 0.4);
	}

	.region-pill-btn.active {
		background: #c92a42;
		color: #fff;
		border-color: #c92a42;
	}

	.pill-count {
		font-size: 0.72rem;
		opacity: 0.75;
		font-weight: normal;
	}

	.album-controls-bar {
		display: flex;
		align-items: center;
		gap: 20px;
		background: rgba(0, 0, 0, 0.7);
		padding: 10px 24px;
		border-radius: 30px;
		backdrop-filter: blur(10px);
		margin: 20px 0;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
		z-index: 100;
	}

	.album-controls-bar button {
		padding: 6px 14px;
		border: none;
		border-radius: 20px;
		background: #2a2a3c;
		color: #fff;
		font-size: 0.82rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.album-controls-bar button.active {
		background: #8b1e2f;
	}

	.album-controls-bar button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.page-indicator {
		font-size: 0.85rem;
		color: #cbd5e1;
		min-width: 90px;
		text-align: center;
		display: inline-block;
	}

	.album-stage {
		width: 100%;
		min-height: 640px;
		display: flex;
		justify-content: center;
		align-items: center;
		perspective: 2000px;
		padding: 30px 0;
		overflow: visible;
	}

	.album {
		position: relative;
		width: 440px;
		height: 600px;
		transform-style: preserve-3d;
		transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
		cursor: pointer;
	}

	.album.mode-double.open {
		transform: translateX(220px);
	}

	.album.mode-single.open,
	.album.closed {
		transform: translateX(0);
	}

	.page {
		position: absolute;
		width: 440px;
		height: 600px;
		top: 0;
		left: 0;
		border-radius: 0 8px 8px 0;
		transform-origin: left center;
		transform-style: preserve-3d;
		transition: transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
		background-color: #1e1e2d;
	}

	/* KEYBOARD & POINTER HIT-TEST PROTECTION */
	.page-face {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		border-radius: 0 8px 8px 0;
		overflow: hidden;
	}

	.page:not(.flipped) .page-face.front {
		pointer-events: auto;
	}
	.page:not(.flipped) .page-face.back {
		pointer-events: none;
	}

	.page.flipped .page-face.front {
		pointer-events: none;
	}
	.page.flipped .page-face.back {
		pointer-events: auto;
	}

	.page-face.back {
		transform: rotateY(180deg);
		border-radius: 8px 0 0 8px;
	}

	.page.flipped {
		transform: rotateY(-180deg);
	}

	.page-bg {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		z-index: 1;
	}

	.page-content {
		position: relative;
		z-index: 2;
		width: 100%;
		height: 100%;
		padding: 30px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.cover-content {
		text-align: center;
	}

	.book-cover-title {
		font-size: 1.85rem;
		font-weight: 700;
		color: #ffd700;
		margin: 15px 0 20px;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
	}

	.book-cover-prompt {
		font-size: 0.9rem;
		font-weight: 600;
		color: #ffd700;
		letter-spacing: 0.05em;
		animation: pulsePrompt 2s infinite ease-in-out;
	}

	@keyframes pulsePrompt {
		0%,
		100% {
			opacity: 0.8;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.04);
		}
	}

	.zoomable-wrapper {
		position: relative;
		cursor: zoom-in;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.zoomable-wrapper:hover {
		transform: scale(1.03);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
	}

	.photo-card-tag {
		position: absolute;
		bottom: 8px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.78);
		color: #fff;
		font-size: 0.72rem;
		padding: 3px 10px;
		border-radius: 12px;
		pointer-events: none;
		white-space: nowrap;
	}

	.img-wrapper {
		max-width: 100%;
		max-height: 80%;
		border-radius: 4px;
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.img-wrapper img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		display: block;
	}

	.caption {
		margin-top: 15px;
		color: #fff;
		font-weight: 700;
		font-size: 1.1rem;
		letter-spacing: 0.08em;
	}

	.empty-leaf-content {
		text-align: center;
		padding: 20px;
	}
	.empty-prompt {
		color: #ffd700;
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 15px;
	}
	.submit-mini-btn {
		display: inline-block;
		padding: 8px 18px;
		background: #c92a42;
		color: #fff;
		text-decoration: none;
		font-weight: 700;
		border-radius: 20px;
		font-size: 0.85rem;
	}

	.spine-shadow {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 25px;
		pointer-events: none;
		z-index: 10;
	}

	.page-face.front .spine-shadow {
		left: 0;
		background: linear-gradient(to right, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 100%);
	}

	.page-face.back .spine-shadow {
		right: 0;
		background: linear-gradient(to left, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 100%);
	}

	.curl-shadow {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 30px;
		pointer-events: none;
		z-index: 10;
	}

	.page-face.front .curl-shadow {
		right: 0;
		background: linear-gradient(to left, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0) 100%);
	}

	.page-face.back .curl-shadow {
		left: 0;
		background: linear-gradient(to right, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0) 100%);
	}

	.badge {
		background: #c92a42;
		color: #fff;
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		padding: 4px 10px;
		border-radius: 4px;
	}

	/* ACTION BANNER */
	.action-banner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 24px 30px;
		border-radius: 12px;
		backdrop-filter: blur(8px);
		gap: 20px;
		flex-wrap: wrap;
	}
	.action-banner h3 {
		margin: 0 0 6px 0;
		color: #fff;
		font-size: 1.25rem;
	}
	.action-banner p {
		margin: 0;
		color: #94a3b8;
		font-size: 0.9rem;
	}

	.primary-btn {
		display: inline-block;
		background: #c92a42;
		color: #fff;
		padding: 12px 24px;
		border-radius: 6px;
		text-decoration: none;
		font-weight: 700;
		transition:
			background 0.2s ease,
			transform 0.1s ease;
		white-space: nowrap;
		border: none;
		cursor: pointer;
	}
	.primary-btn:hover {
		background: #a82035;
		transform: translateY(-1px);
	}

	/* POLAROID MODAL */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(5px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 9999;
		padding: 20px;
	}

	.postcard-container {
		position: relative;
		display: flex;
		width: 100%;
		max-width: 860px;
		background: #fff;
		border-radius: 6px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
		overflow: hidden;
		animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes modalIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.close-btn {
		position: absolute;
		top: 10px;
		right: 15px;
		font-size: 2rem;
		background: none;
		border: none;
		color: #444;
		cursor: pointer;
		line-height: 1;
		z-index: 10;
	}

	.postcard-front {
		flex: 1;
		padding: 25px;
		background: #f7f5f0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.postcard-photo-frame {
		width: 100%;
		height: 380px;
		background: #111;
		border: 8px solid #fff;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.postcard-photo-frame img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 2px;
	}

	.postcard-photo-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 15px;
		font-size: 0.95rem;
		font-weight: 700;
	}

	.entry-index {
		color: #c92a42;
	}
	.entry-country {
		color: #555;
	}

	.postcard-divider {
		width: 1px;
		background: repeating-linear-gradient(
			to bottom,
			#d1ccc0,
			#d1ccc0 8px,
			transparent 8px,
			transparent 16px
		);
	}

	.postcard-back {
		flex: 1.2;
		padding: 35px 30px 25px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		position: relative;
		background: #fffefb;
	}

	.stamp-box {
		position: absolute;
		top: 25px;
		right: 25px;
		width: 65px;
		height: 75px;
		border: 2px dashed #c92a42;
		border-radius: 4px;
		display: flex;
		justify-content: center;
		align-items: center;
		text-align: center;
		color: #c92a42;
		font-size: 0.7rem;
		font-weight: 800;
		line-height: 1.2;
	}

	.postcard-author-header {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-bottom: 15px;
		padding-right: 80px;
	}

	.to-label {
		font-size: 0.8rem;
		color: #888;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.from-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.mini-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		object-fit: cover;
	}

	.from-label {
		font-size: 1.05rem;
		color: #111;
	}

	.from-label strong {
		color: #c92a42;
	}
	.country-subtag {
		font-size: 0.8rem;
		color: #666;
	}

	.postcard-message-body {
		flex: 1;
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1.15rem;
		line-height: 1.7;
		color: #333;
		font-style: italic;
		padding: 10px 0;
		border-top: 1px solid #eee;
		border-bottom: 1px solid #eee;
		overflow-y: auto;
	}

	.postcard-footer {
		margin-top: 15px;
		text-align: right;
	}

	.watermark {
		font-size: 0.72rem;
		color: #aaa;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	@media (max-width: 768px) {
		.anniversary-heading {
			font-size: 2.3rem;
		}
		.postcard-container {
			flex-direction: column;
			max-height: 90vh;
			overflow-y: auto;
		}
		.postcard-divider {
			width: 100%;
			height: 1px;
		}
		.postcard-photo-frame {
			height: 220px;
		}
	}
</style>
