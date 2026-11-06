<script lang="ts">
	import { resolve } from '$app/paths';

	let displayName = $state('');
	let avatarInput = $state<HTMLInputElement | null>(null);
	let avatarPreviewUrl = $state<string | null>(null);

	let country = $state('');
	let foodInput = $state<HTMLInputElement | null>(null);
	let foodPreviewUrl = $state<string | null>(null);

	let username = $state('');
	let password = $state('');
	let contact = $state('');
	let message = $state('');

	let feedbackMessage = $state('');
	let isSuccess = $state(false);
	let isSubmitting = $state(false);

	const defaultAvatars = ['/user/m1.jpg', '/user/m1.jpg'];

	function handleAvatarChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			avatarPreviewUrl = URL.createObjectURL(target.files[0]);
		} else {
			avatarPreviewUrl = null;
		}
	}

	function handleFoodChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			foodPreviewUrl = URL.createObjectURL(target.files[0]);
		} else {
			foodPreviewUrl = null;
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		isSubmitting = true;
		feedbackMessage = 'Submitting your entry...';
		isSuccess = false;

		// Fallbacks
		const finalDisplayName = displayName.trim() || 'Anonymous Miofa';
		const finalMessage = message.trim() || 'Happy 8th Anniversary, Mio mama! 🌲✨';

		const formData = new FormData();
		formData.append('displayName', finalDisplayName);
		formData.append('country', country.trim());
		formData.append('username', username.trim().toLowerCase());
		formData.append('password', password);
		formData.append('contact', contact.trim());
		formData.append('message', finalMessage);

		if (avatarInput?.files?.[0]) {
			formData.append('avatar', avatarInput.files[0]);
		} else {
			// Pick random default avatar
			const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
			formData.append('defaultAvatarUrl', randomAvatar);
		}

		if (foodInput?.files?.[0]) {
			formData.append('foodImage', foodInput.files[0]);
		}

		try {
			const res = await fetch('/api/submissions', {
				method: 'POST',
				body: formData
			});
			const result = await res.json();

			if (result.success) {
				isSuccess = true;
				feedbackMessage = `✓ Entry received for [${finalDisplayName}] from ${country}! Thank you for contributing to the album!`;
				displayName = '';
				country = '';
				username = '';
				password = '';
				contact = '';
				message = '';
				avatarPreviewUrl = null;
				foodPreviewUrl = null;
				if (avatarInput) avatarInput.value = '';
				if (foodInput) foodInput.value = '';
			} else {
				isSuccess = false;
				feedbackMessage = `❌ Submission failed: ${result.error || 'Please verify the form inputs.'}`;
			}
		} catch {
			isSuccess = false;
			feedbackMessage = '❌ Server connection error. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<main class="page-container">
	<section class="info-section">
		<div class="breadcrumb-nav">
			<a href={resolve('/')} class="back-link">&larr; Back to Anniversary Album</a>
		</div>
		<span class="date">8TH ANNIVERSARY &bull; COMMEMORATIVE ALBUM</span>
		<h2>Submit to the Travel & Food Collection</h2>
		<p>
			Share a photo of food or a local dish from your region to be bound into Mio's 8th Anniversary
			commemorative book.
		</p>

		<form class="submission-form" onsubmit={handleSubmit}>
			<!-- 1. NAME (OPTIONAL) -->
			<div class="form-group">
				<label for="display-name">
					Name to Display <span class="optional"
						>(Optional &bull; Leave blank to submit as "Anonymous Miofa")</span
					>
				</label>
				<input type="text" id="display-name" placeholder="e.g. Miofa1" bind:value={displayName} />
			</div>

			<!-- 2. PROFILE PIC (OPTIONAL) -->
			<div class="form-group">
				<label for="avatar-input">
					Profile Picture <span class="optional"
						>(Optional &bull; Defaults to a random Miofa avatar)</span
					>
				</label>
				<input
					type="file"
					id="avatar-input"
					accept="image/*"
					bind:this={avatarInput}
					onchange={handleAvatarChange}
				/>
				{#if avatarPreviewUrl}
					<div class="preview-box avatar-preview">
						<img src={avatarPreviewUrl} alt="Avatar Preview" />
					</div>
				{/if}
			</div>

			<!-- 3. COUNTRY (REQUIRED) -->
			<div class="form-group">
				<label for="country-input">Country / Region <span class="required">*</span></label>
				<input
					type="text"
					id="country-input"
					placeholder="e.g. Japan, Philippines, Germany, USA"
					bind:value={country}
					required
				/>
			</div>

			<!-- 4. PICTURE OF FOOD (REQUIRED) -->
			<div class="form-group">
				<label for="food-input">Picture of Food / Local Dish <span class="required">*</span></label>
				<input
					type="file"
					id="food-input"
					accept="image/*"
					bind:this={foodInput}
					onchange={handleFoodChange}
					required
				/>
				{#if foodPreviewUrl}
					<div class="preview-box">
						<img src={foodPreviewUrl} alt="Food Preview" />
					</div>
				{/if}
			</div>

			<!-- 5. PRIVATE ACCOUNT KEYS (FOR EDITING LATER) -->
			<div class="auth-box">
				<span class="date">PRIVATE ACCOUNT KEYS (NOT SHOWN PUBLICLY)</span>
				<p class="auth-desc">
					Save your username, password, and contact information. You will use these to edit or
					request deletion of your entry later.
				</p>

				<div class="form-group">
					<label for="username-input">Username <span class="required">*</span></label>
					<input
						type="text"
						id="username-input"
						placeholder="Unique username for editing"
						bind:value={username}
						required
					/>
				</div>

				<div class="form-group">
					<label for="password-input">Password <span class="required">*</span></label>
					<input
						type="password"
						id="password-input"
						placeholder="Secret password"
						bind:value={password}
						required
					/>
				</div>

				<div class="form-group">
					<label for="contact-input"
						>Contact for Identity Verification <span class="required">*</span></label
					>
					<input
						type="text"
						id="contact-input"
						placeholder="Discord handle, Twitter/X @handle, or Email"
						bind:value={contact}
						required
					/>
				</div>
			</div>

			<!-- 6. MESSAGE (OPTIONAL) -->
			<div class="form-group" style="margin-top: 25px;">
				<label for="message-input">
					Message / Dish Note <span class="optional"
						>(Optional &bull; Defaults to a generic 8th anniversary greeting)</span
					>
				</label>
				<textarea
					id="message-input"
					rows="4"
					placeholder="Write your note or describe your dish..."
					bind:value={message}></textarea>
			</div>

			<button type="submit" class="primary-btn" disabled={isSubmitting}>
				{isSubmitting ? 'Uploading...' : 'Submit to Travel Album →'}
			</button>

			{#if feedbackMessage}
				<p class="feedback-msg" class:success-msg={isSuccess} class:error-msg={!isSuccess}>
					{feedbackMessage}
				</p>
			{/if}
		</form>
	</section>
</main>

<style>
	.breadcrumb-nav {
		margin-bottom: 20px;
	}
	.back-link {
		color: #e2e8f0;
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 600;
		transition: color 0.2s;
	}
	.back-link:hover {
		color: #ffd700;
	}
	.required {
		color: #c92a42;
	}
	.optional {
		font-size: 0.8rem;
		color: #94a3b8;
		font-weight: normal;
	}

	.auth-box {
		margin-top: 25px;
		padding: 22px;
		background: rgba(0, 0, 0, 0.28);
		border-radius: 8px;
		border-left: 3px solid #c92a42;
	}

	.auth-desc {
		font-size: 0.85rem;
		color: #94a3b8;
		margin-bottom: 15px;
	}

	.avatar-preview {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		overflow: hidden;
		margin-top: 8px;
	}

	.avatar-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.preview-box img {
		max-width: 200px;
		border-radius: 8px;
		margin-top: 8px;
	}

	.feedback-msg {
		margin-top: 18px;
		padding: 12px 16px;
		border-radius: 6px;
		font-weight: 600;
		font-size: 0.95rem;
	}
	.success-msg {
		background: rgba(34, 197, 94, 0.15);
		border: 1px solid rgba(34, 197, 94, 0.4);
		color: #86efac;
	}
	.error-msg {
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.4);
		color: #fca5a5;
	}
</style>
