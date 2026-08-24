<script lang="ts">
  import { onMount } from 'svelte';

  const slides = [
    { src: '/images/hero-1.webp', alt: 'Hero 1' },
    { src: '/images/hero-2.webp', alt: 'Hero 2' },
    { src: '/images/hero-3.webp', alt: 'Hero 3' }
  ];

  let currentSlide = 0;
  let timer: any;

  function setSlide(index: number) {
    currentSlide = index;
    clearInterval(timer);
    timer = setInterval(nextSlide, 5000);
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
  }

  onMount(() => {
    timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  });
</script>

<!-- HERO SLIDER -->
<header class="hero">
  <div class="slider">
    {#each slides as slide, i}
      <img
        src={slide.src}
        alt={slide.alt}
        class="slide"
        class:active={currentSlide === i}
      />
    {/each}
  </div>

  <div class="hero-text">
    <p class="subtitle">CELEBRATING OUR OKAMI</p>
    <h1>HAPPY 8TH ANNIVERSARY</h1>
  </div>

  <div class="slider-dots">
    {#each slides as _, i}
      <button
        class="dot"
        class:active={currentSlide === i}
        on:click={() => setSlide(i)}
        aria-label="Slide {i + 1}"
      ></button>
    {/each}
  </div>
</header>

<!-- THUMBNAIL STRIP -->
<section class="thumb-strip">
  <a href="#spotlight-project"><img src="/images/hero-1.webp" alt="Spotlight" /></a>
  <a href="/archive"><img src="/images/hero-2.webp" alt="Archive" /></a>
  <a href="/submit"><img src="/images/hero-3.webp" alt="Submit" /></a>
</section>

<!-- MAIN CONTENT -->
<main class="page-container" id="spotlight-project">
  <section class="info-section">
    <span class="date">CURRENT LIVE PROJECT &bull; ACTIVE</span>
    <h2>8th Anniversary Project: "Off the Gourd"</h2>
    <p>
      A collaborative tribute celebrating 8 years of laughter, fortune-telling,
      and memories in the forest. Explore past volumes or contribute to the collection.
    </p>

    <div class="action-banner">
      <div>
        <h3>Submissions are Open!</h3>
        <p>Have an illustration, message, or memory for Mio? Join fellow Miofa worldwide.</p>
      </div>
      <a href="/submit" class="primary-btn">Submit a Message &rarr;</a>
    </div>
  </section>

  <!-- MEDIA HIGHLIGHT -->
  <section class="info-section alt">
    <span class="date">FEATURED STREAM &bull; DISCOGRAPHY</span>
    <h2>Original Song & Stream Highlights</h2>
    <p>Commemorating original releases and milestone streams.</p>

    <div class="media-frame-container">
      <iframe
        src="https://www.youtube-nocookie.com/embed/videoseries?list=OLAK5uy_mu8NL7GuV0bWH-T1GDw7KLU3IHu4HGrgg"
        title="Featured Playlist"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>
  </section>
</main>