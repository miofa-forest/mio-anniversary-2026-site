<script lang="ts">
  import { onMount } from 'svelte';

  let currentSpread = 0;
  let mode: 'single' | 'double' = 'single';
  let albumElement: HTMLElement;
  let totalPages = 6; // Cover (0), 4 content leaves (1-4), Back cover (5)

  // Selected photo for the polaroid / message popup
  let selectedEntry: {
    id: number;
    img: string;
    caption: string;
    author: string;
    country: string;
    avatar: string;
    message: string;
  } | null = null;

  // Placeholder album dataset
  const albumPages = [
    {
      id: 1,
      img: '/album assets/photo1.png',
      caption: '#1',
      author: 'Miofa1',
      country: 'Japan',
      avatar: '/user/m1.jpg',
      message: 'Happy 8th Anniversary Mio mama! Hope you enjoy this hot bowl of ramen!'
    },
    {
      id: 2,
      img: '/album assets/photo1.png',
      caption: '#2',
      author: 'Anonymous Miofa',
      country: 'Philippines',
      avatar: '/user/m1.jpg',
      message: 'Warm forest stew from our province! Thank you for 8 wonderful years of smiles.'
    },
    {
      id: 3,
      img: '/album assets/photo1.png',
      caption: '#3',
      author: 'KuroTae',
      country: 'USA',
      avatar: '/user/m1.jpg',
      message: 'Fresh homemade pancakes! Best paired with your morning streams.'
    },
    {
      id: 4,
      img: '/album assets/photo1.png',
      caption: '#4',
      author: 'Miofa_Global',
      country: 'Indonesia',
      avatar: '/user/m1.jpg',
      message: 'Spicy satay skewers! Sending warm wishes from overseas!'
    },
    {
      id: 5,
      img: '/album assets/photo1.png',
      caption: '#5',
      author: 'TaigaFan',
      country: 'Canada',
      avatar: '/user/m1.jpg',
      message: 'Traditional maple pastries to celebrate your milestone.'
    },
    {
      id: 6,
      img: '/album assets/photo1.png',
      caption: '#6',
      author: 'Sparky',
      country: 'Germany',
      avatar: '/user/m1.jpg',
      message: 'Fresh bakery bread and sausages! Always cheering for you, Mio!'
    },
    {
      id: 7,
      img: '/album assets/photo1.png',
      caption: '#7',
      author: 'NightWolf',
      country: 'Taiwan',
      avatar: '/user/m1.jpg',
      message: 'Sweet bubble tea and street snacks for your anniversary concert!'
    },
    {
      id: 8,
      img: '/album assets/photo1.png',
      caption: '#8',
      author: 'OuroMio',
      country: 'United Kingdom',
      avatar: '/user/m1.jpg',
      message: 'Afternoon forest tea blend. Here is to many more anniversaries ahead!'
    }
  ];

  function flipNext() {
    if (currentSpread < totalPages - 1) {
      currentSpread++;
    }
  }

  function flipPrev() {
    if (currentSpread > 0) {
      currentSpread--;
    }
  }

  function setMode(newMode: 'single' | 'double') {
    mode = newMode;
  }

  function openDetailModal(entry: typeof selectedEntry, event: MouseEvent) {
    event.stopPropagation();
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
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<!-- TOP HERO ANNIVERSARY GREETING -->
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

<!-- SCROLLABLE 3D BOOK SECTION -->
<main class="page-container album-page-layout" id="book-section">
  
  <section class="info-section" style="text-align: center; margin-bottom: 5px;">
    <span class="date">GLOBAL FAN COMMEMORATION</span>
    <h2>Off the gourd; My Mio Travel Book</h2>
    <p style="margin: 0 auto; max-width: 680px;">
      A collection of dishes and memories sent by fans worldwide. Click any photograph to read the note on the back.
    </p>
  </section>

  <!-- CONTROLS BAR -->
  <div class="album-controls-bar">
    <div class="mode-toggle">
      <button 
        type="button" 
        class:active={mode === 'single'} 
        onclick={() => setMode('single')}
      >
        1 Page Mode
      </button>
      <button 
        type="button" 
        class:active={mode === 'double'} 
        onclick={() => setMode('double')}
      >
        2 Pages Mode
      </button>
    </div>
    
    <div class="nav-buttons">
      <button 
        type="button" 
        onclick={flipPrev} 
        disabled={currentSpread === 0}
      >
        &larr; Previous
      </button>

      <span class="page-indicator">
        {#if currentSpread === 0}
          Cover
        {:else if currentSpread >= totalPages - 1}
          Back Cover
        {:else}
          Page {currentSpread} of {totalPages - 2}
        {/if}
      </span>

      <button 
        type="button" 
        onclick={flipNext} 
        disabled={currentSpread >= totalPages - 1}
      >
        Next &rarr;
      </button>
    </div>
  </div>

  <!-- 3D BOOK STAGE -->
  <div class="album-stage">
    <div
      bind:this={albumElement}
      class="album mode-{mode}"
      class:closed={currentSpread === 0 || currentSpread >= totalPages - 1}
      class:open={currentSpread > 0 && currentSpread < totalPages - 1}
      onclick={flipNext}
      role="region"
      aria-label="3D Interactive Album"
    >
      
      <!-- COVER (Page Index 0) -->
      <div 
        class="page cover" 
        class:flipped={currentSpread > 0} 
        style="z-index: {currentSpread > 0 ? 1 : totalPages};"
      >
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

      <!-- ALBUM PAGES (Indices 1 to 4) -->
      {#each Array(4) as _, pIdx}
        {@const pageNum = pIdx + 1}
        <div 
          class="page" 
          class:flipped={currentSpread >= pageNum}
          style="z-index: {currentSpread >= pageNum ? pageNum + 1 : totalPages - pageNum};"
        >
          <!-- Front Face -->
          <div class="page-face front">
            <img class="page-bg" src="/album assets/inside bg.png" alt="Inside BG" />
            <div class="page-content">
              <div 
                class="img-wrapper zoomable-wrapper"
                onclick={(e) => openDetailModal(albumPages[pIdx * 2], e)}
                role="button"
                tabindex="0"
                onkeydown={(e) => e.key === 'Enter' && openDetailModal(albumPages[pIdx * 2], e as any)}
                aria-label="Inspect dish and message"
              >
                <img src={albumPages[pIdx * 2]?.img} alt="Dish {albumPages[pIdx * 2]?.caption}" />
                <div class="photo-card-tag">
                  <span>{albumPages[pIdx * 2]?.author} &bull; {albumPages[pIdx * 2]?.country}</span>
                </div>
              </div>
              <p class="caption">{albumPages[pIdx * 2]?.caption}</p>
            </div>
            <div class="spine-shadow"></div>
            <div class="curl-shadow"></div>
          </div>

          <!-- Back Face -->
          <div class="page-face back">
            <img class="page-bg" src="/album assets/inside bg.png" alt="Inside BG" />
            <div class="page-content">
              <div 
                class="img-wrapper zoomable-wrapper"
                onclick={(e) => openDetailModal(albumPages[pIdx * 2 + 1], e)}
                role="button"
                tabindex="0"
                onkeydown={(e) => e.key === 'Enter' && openDetailModal(albumPages[pIdx * 2 + 1], e as any)}
                aria-label="Inspect dish and message"
              >
                <img src={albumPages[pIdx * 2 + 1]?.img} alt="Dish {albumPages[pIdx * 2 + 1]?.caption}" />
                <div class="photo-card-tag">
                  <span>{albumPages[pIdx * 2 + 1]?.author} &bull; {albumPages[pIdx * 2 + 1]?.country}</span>
                </div>
              </div>
              <p class="caption">{albumPages[pIdx * 2 + 1]?.caption}</p>
            </div>
            <div class="spine-shadow"></div>
            <div class="curl-shadow"></div>
          </div>
        </div>
      {/each}

      <!-- BACK COVER (Page Index 5) -->
      <div 
        class="page cover" 
        class:flipped={currentSpread >= totalPages - 1} 
        style="z-index: {currentSpread >= totalPages - 1 ? totalPages : 1};"
      >
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

  <!-- SUBMISSION CALL TO ACTION -->
  <section class="action-banner" style="margin-top: 50px; width: 100%; max-width: 900px;">
    <div>
      <h3>Want your local dish featured in the book?</h3>
      <p>Submit your food photo, region, and optional anniversary message.</p>
    </div>
    <a href="/submit" class="primary-btn">Go to Submission Page &rarr;</a>
  </section>

  <!-- POLAROID INSPECTION MODAL -->
  {#if selectedEntry}
    <div class="modal-backdrop" onclick={closeDetailModal} role="dialog" aria-modal="true">
      <div class="postcard-container" onclick={(e) => e.stopPropagation()} role="document">
        <button class="close-btn" onclick={closeDetailModal} aria-label="Close modal">&times;</button>

        <!-- LEFT SIDE: PHOTO VIEW -->
        <div class="postcard-front">
          <div class="postcard-photo-frame">
            <img src={selectedEntry.img} alt="Dish" />
          </div>
          <div class="postcard-photo-meta">
            <span class="entry-index">{selectedEntry.caption}</span>
            <span class="entry-country">📍 {selectedEntry.country}</span>
          </div>
        </div>

        <!-- DIVIDER -->
        <div class="postcard-divider"></div>

        <!-- RIGHT SIDE: POSTCARD MESSAGE -->
        <div class="postcard-back">
          <div class="stamp-box">
            <span>🐺 MIOFA<br />POST</span>
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
  /* HERO BANNER */
  .hero-anniversary-banner {
    position: relative;
    min-height: 52vh;
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
    display: flex;
    justify-content: center;
    align-items: center;
    perspective: 2200px;
    padding: 30px 0;
    overflow: hidden;
  }

  .album {
    position: relative;
    width: 440px;
    height: 600px;
    transform-style: preserve-3d;
    transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
    cursor: pointer;
  }

  .album.closed { transform: translateX(0); }
  .album.mode-single.open { transform: translateX(0); }
  .album.mode-double.open { transform: translateX(220px); }

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

  .page-face {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    backface-visibility: hidden;
    border-radius: 0 8px 8px 0;
    overflow: hidden;
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
    0%, 100% { opacity: 0.8; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.04); }
  }

  .zoomable-wrapper {
    position: relative;
    cursor: zoom-in;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
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
    text-align: center;
  }

  .badge {
    background: #f1c40f;
    color: #000;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .spine-shadow {
    position: absolute;
    top: 0;
    left: 0;
    width: 35px;
    height: 100%;
    background: linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.08) 40%, rgba(0,0,0,0) 100%);
    pointer-events: none;
    z-index: 5;
  }

  .back .spine-shadow {
    left: auto;
    right: 0;
    background: linear-gradient(to left, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.08) 40%, rgba(0,0,0,0) 100%);
  }

  .curl-shadow {
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to left, rgba(0,0,0,0.15) 0%, rgba(255,255,255,0.1) 15%, rgba(0,0,0,0) 100%);
    pointer-events: none;
    z-index: 6;
  }

  /* MODAL */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(10, 10, 15, 0.88);
    backdrop-filter: blur(8px);
    z-index: 3000;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
  }

  .postcard-container {
    position: relative;
    background: #fcfbf9;
    color: #2b2b2b;
    width: 100%;
    max-width: 840px;
    min-height: 450px;
    border-radius: 12px;
    display: flex;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
    overflow: hidden;
  }

  .close-btn {
    position: absolute;
    top: 12px;
    right: 18px;
    font-size: 2rem;
    line-height: 1;
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    z-index: 10;
  }

  .close-btn:hover { color: #c92a42; }

  .postcard-front {
    flex: 1.1;
    padding: 30px;
    background: #f3f0e8;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .postcard-photo-frame {
    width: 100%;
    height: 310px;
    background: #fff;
    padding: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    border-radius: 4px;
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

  .entry-index { color: #c92a42; }
  .entry-country { color: #555; }

  .postcard-divider {
    width: 1px;
    background: repeating-linear-gradient(to bottom, #d1ccc0, #d1ccc0 8px, transparent 8px, transparent 16px);
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

  .from-label strong { color: #c92a42; }
  .country-subtag { font-size: 0.8rem; color: #666; }

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
    .anniversary-heading { font-size: 2.3rem; }
    .postcard-container { flex-direction: column; max-height: 90vh; overflow-y: auto; }
    .postcard-divider { width: 100%; height: 1px; }
    .postcard-photo-frame { height: 220px; }
  }
</style>