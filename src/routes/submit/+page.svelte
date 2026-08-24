<script lang="ts">
  let author = '';
  let isAnonymous = false;
  let category = 'fanletter';
  let message = '';
  let fileInput: HTMLInputElement;
  let imagePreviewUrl: string | null = null;
  let feedbackMessage = '';
  let isSubmitting = false;

  function toggleAnonymous() {
    if (isAnonymous) {
      author = 'miofa-' + Math.random().toString(36).substring(2, 8);
    } else {
      author = '';
    }
  }

  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      imagePreviewUrl = URL.createObjectURL(target.files[0]);
    } else {
      imagePreviewUrl = null;
    }
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    isSubmitting = true;
    feedbackMessage = 'Submitting your entry...';

    const cleanAuthor = author.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const formData = new FormData();
    formData.append('author', cleanAuthor);
    formData.append('isAnonymous', isAnonymous ? 'true' : 'false');
    formData.append('type', category);
    formData.append('event', '8th_anniversary');
    formData.append('year', '2026');
    formData.append('message', message);

    if (fileInput?.files?.[0]) {
      formData.append('image', fileInput.files[0]);
    }

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();

      if (result.success) {
        feedbackMessage = `✓ Submission received for [${cleanAuthor}]. Thank you for contributing!`;
        author = '';
        message = '';
        imagePreviewUrl = null;
        if (fileInput) fileInput.value = '';
      } else {
        feedbackMessage = '❌ Submission failed. Please try again.';
      }
    } catch {
      feedbackMessage = '❌ Server connection error.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<main class="page-container">
  <section class="info-section">
    <span class="date">CALL FOR SUBMISSIONS &bull; 8TH ANNIVERSARY</span>
    <h2>Send Your Artwork & Messages</h2>
    <p>
      Contribute your fan letters, illustrations, or memories for Mio's 8th Anniversary project.
    </p>

    <form class="submission-form" on:submit={handleSubmit}>
      
      <div class="form-group">
        <label for="author-input">Miofa Name / Twitter Handle</label>
        <input
          type="text"
          id="author-input"
          placeholder="e.g. Miofa1"
          bind:value={author}
          disabled={isAnonymous}
          required
        />
      </div>

      <div class="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            bind:checked={isAnonymous}
            on:change={toggleAnonymous}
          />
          Submit Anonymously (Auto-assigns UUID)
        </label>
      </div>

      <div class="form-group">
        <label for="category-select">Category</label>
        <select id="category-select" bind:value={category} required>
          <option value="fanletter"> Fan Letter</option>
          <option value="fanart"> Fan Illustration</option>
          <option value="moment"> Mio Moment Highlight</option>
        </select>
      </div>

      <div class="form-group">
        <label for="message-input">Your Message</label>
        <textarea
          id="message-input"
          rows="5"
          placeholder="Write your note or describe your submission..."
          bind:value={message}
          required
        ></textarea>
      </div>

      <div class="form-group">
        <label for="file-input">Attach Artwork (Optional)</label>
        <input
          type="file"
          id="file-input"
          accept="image/*"
          bind:this={fileInput}
          on:change={handleFileChange}
        />
        {#if imagePreviewUrl}
          <div class="preview-box">
            <img src={imagePreviewUrl} alt="Preview" />
          </div>
        {/if}
      </div>

      <button type="submit" class="primary-btn" disabled={isSubmitting}>
        {isSubmitting ? 'Uploading...' : 'Submit to Archive →'}
      </button>

      {#if feedbackMessage}
        <p class="feedback-msg">{feedbackMessage}</p>
      {/if}
    </form>
  </section>
</main>