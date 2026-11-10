<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { compressImage, formatFileSize } from '$lib/imageCompression';

	interface FanSubmission {
		id: string;
		status: 'PENDING' | 'APPROVED' | 'DENIED';
		displayName: string;
		username: string;
		country: string;
		contact: string;
		photo: string;
		avatar: string;
		message: string;
		submittedAt: string;
		updatedAt: string;
	}

	interface StaffSessionUser {
		username: string;
		role: string;
	}

	let isOpen = $state(false);
	let activeTab = $state<'fan' | 'staff'>('fan');

	// Fan state
	let fanChecking = $state(false);
	let fanAuthenticated = $state(false);
	let fanSubmission = $state<FanSubmission | null>(null);
	let fanUsername = $state('');
	let fanPassword = $state('');
	let fanShowPassword = $state(false);
	let fanLoading = $state(false);
	let fanError = $state('');
	let fanFeedback = $state('');

	// Fan edit state
	let isEditing = $state(false);
	let editDisplayName = $state('');
	let editCountry = $state('');
	let editMessage = $state('');
	let editPhotoFile = $state<File | null>(null);
	let editPhotoPreview = $state<string | null>(null);
	let editFileSizeText = $state('');
	let isSaving = $state(false);

	// Fan delete confirmation
	let showWithdrawConfirm = $state(false);
	let isWithdrawing = $state(false);

	// Staff state
	let staffChecking = $state(false);
	let staffAuthenticated = $state(false);
	let staffUser = $state<StaffSessionUser | null>(null);
	let staffUsername = $state('admin');
	let staffPassword = $state('');
	let staffShowPassword = $state(false);
	let staffLoading = $state(false);
	let staffError = $state('');

	onMount(() => {
		checkSessions();
	});

	async function checkSessions() {
		// 1. Check Fan session
		fanChecking = true;
		try {
			const res = await fetch('/api/submissions/manage');
			const data = await res.json();
			if (data.authenticated && data.submission) {
				fanAuthenticated = true;
				fanSubmission = data.submission;
			} else {
				fanAuthenticated = false;
				fanSubmission = null;
			}
		} catch {
			fanAuthenticated = false;
		} finally {
			fanChecking = false;
		}

		// 2. Check Staff session
		staffChecking = true;
		try {
			const res = await fetch('/api/moderator/auth');
			const data = await res.json();
			if (data.authenticated && data.user) {
				staffAuthenticated = true;
				staffUser = data.user;
			} else {
				staffAuthenticated = false;
				staffUser = null;
			}
		} catch {
			staffAuthenticated = false;
		} finally {
			staffChecking = false;
		}
	}

	async function loginFan(event: SubmitEvent) {
		event.preventDefault();
		if (!fanUsername.trim() || !fanPassword.trim()) return;

		fanLoading = true;
		fanError = '';
		fanFeedback = '';

		try {
			const res = await fetch('/api/submissions/manage', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: fanUsername.trim(),
					password: fanPassword
				})
			});
			const data = await res.json();

			if (data.success && data.submission) {
				fanAuthenticated = true;
				fanSubmission = data.submission;
				fanPassword = '';
				isEditing = false;
			} else {
				fanError = data.error || 'Invalid submission credentials';
			}
		} catch {
			fanError = 'Connection failed. Please try again.';
		} finally {
			fanLoading = false;
		}
	}

	async function logoutFan() {
		try {
			await fetch('/api/submissions/manage?action=logout', { method: 'DELETE' });
		} catch {
			// ignore
		} finally {
			fanAuthenticated = false;
			fanSubmission = null;
			isEditing = false;
			showWithdrawConfirm = false;
		}
	}

	function startEditing() {
		if (!fanSubmission) return;
		editDisplayName = fanSubmission.displayName;
		editCountry = fanSubmission.country;
		editMessage = fanSubmission.message;
		editPhotoFile = null;
		editPhotoPreview = null;
		editFileSizeText = '';
		isEditing = true;
	}

	function handleEditPhotoChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			editPhotoFile = file;
			editPhotoPreview = URL.createObjectURL(file);
			editFileSizeText = `${formatFileSize(file.size)} (will be auto-optimized)`;
		} else {
			editPhotoFile = null;
			editPhotoPreview = null;
			editFileSizeText = '';
		}
	}

	async function saveFanEdits(event: SubmitEvent) {
		event.preventDefault();
		if (!fanSubmission) return;

		isSaving = true;
		fanError = '';
		fanFeedback = 'Saving updates...';

		try {
			const formData = new FormData();
			formData.append('displayName', editDisplayName.trim());
			formData.append('country', editCountry.trim());
			formData.append('message', editMessage.trim());

			if (editPhotoFile) {
				fanFeedback = 'Optimizing new photo...';
				const optimized = await compressImage(editPhotoFile, {
					maxWidth: 1600,
					maxHeight: 1600,
					quality: 0.82
				});
				formData.append('foodImage', optimized);
			}

			fanFeedback = 'Updating entry...';
			const res = await fetch('/api/submissions/manage', {
				method: 'PATCH',
				body: formData
			});
			const data = await res.json();

			if (data.success && data.submission) {
				fanSubmission = data.submission;
				isEditing = false;
				fanFeedback = 'Entry successfully updated.';
				setTimeout(() => {
					fanFeedback = '';
				}, 4000);
			} else {
				fanError = data.error || 'Failed to update entry';
			}
		} catch {
			fanError = 'Connection failed while updating.';
		} finally {
			isSaving = false;
		}
	}

	async function confirmWithdraw() {
		if (!fanSubmission) return;

		isWithdrawing = true;
		fanError = '';

		try {
			const res = await fetch('/api/submissions/manage', { method: 'DELETE' });
			const data = await res.json();

			if (data.success) {
				fanAuthenticated = false;
				fanSubmission = null;
				showWithdrawConfirm = false;
				isEditing = false;
				fanFeedback = 'Your entry has been withdrawn from the archive.';
				setTimeout(() => {
					fanFeedback = '';
				}, 5000);
			} else {
				fanError = data.error || 'Failed to withdraw entry';
			}
		} catch {
			fanError = 'Error withdrawing entry.';
		} finally {
			isWithdrawing = false;
		}
	}

	async function loginStaff(event: SubmitEvent) {
		event.preventDefault();
		if (!staffPassword.trim()) return;

		staffLoading = true;
		staffError = '';

		try {
			const res = await fetch('/api/moderator/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: staffUsername.trim() || 'admin',
					password: staffPassword
				})
			});
			const data = await res.json();

			if (data.success && data.user) {
				staffAuthenticated = true;
				staffUser = data.user;
				staffPassword = '';
				window.location.href = resolve('/moderator');
			} else {
				staffError = data.error || 'Invalid staff credentials';
			}
		} catch {
			staffError = 'Connection failed. Please try again.';
		} finally {
			staffLoading = false;
		}
	}

	async function logoutStaff() {
		try {
			await fetch('/api/moderator/auth', { method: 'DELETE' });
		} catch {
			// ignore
		} finally {
			staffAuthenticated = false;
			staffUser = null;
		}
	}
</script>

<!-- SEMI-TRANSPARENT FLOATING GEAR IN BOTTOM-LEFT -->
<div class="floating-gear-container">
	<button
		type="button"
		class="floating-gear-btn"
		onclick={() => (isOpen = true)}
		aria-label="Account & Settings Portal"
		title="Account & Settings"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width="22"
			height="22"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="gear-icon"
		>
			<circle cx="12" cy="12" r="3"></circle>
			<path
				d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
			></path>
		</svg>
		{#if fanAuthenticated || staffAuthenticated}
			<span class="active-dot" title="Active session logged in"></span>
		{/if}
	</button>
</div>

<!-- ACCOUNT MODAL POPUP -->
{#if isOpen}
	<div
		class="portal-backdrop"
		onclick={() => (isOpen = false)}
		onkeydown={(e) => e.key === 'Escape' && (isOpen = false)}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="portal-card"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="document"
			tabindex="0"
		>
			<div class="portal-header">
				<div class="portal-title-group">
					<div>
						<h2>Account & Settings</h2>
						<p class="portal-sub">Manage your dish submission or sign in as staff</p>
					</div>
				</div>
				<button class="portal-close-btn" onclick={() => (isOpen = false)} aria-label="Close"
					>&times;</button
				>
			</div>

			<!-- TABS -->
			<div class="portal-tabs">
				<button
					type="button"
					class="tab-btn"
					class:active={activeTab === 'fan'}
					onclick={() => (activeTab = 'fan')}
				>
					My Submission
					{#if fanAuthenticated}
						<span class="mini-tag">Active</span>
					{/if}
				</button>
				<button
					type="button"
					class="tab-btn"
					class:active={activeTab === 'staff'}
					onclick={() => (activeTab = 'staff')}
				>
					Staff Portal
					{#if staffAuthenticated}
						<span class="mini-tag">Staff</span>
					{/if}
				</button>
			</div>

			<!-- TAB 1: FAN SUBMISSION -->
			{#if activeTab === 'fan'}
				<div class="tab-content">
					{#if fanChecking}
						<div class="tab-loading">
							<div class="spinner"></div>
							<p>Checking submission account...</p>
						</div>
					{:else if !fanAuthenticated}
						<!-- FAN LOGIN FORM -->
						<div class="login-intro">
							<p>
								Already submitted a dish? Enter your submission username & password to view its
								status, edit your message, or update your food photo.
							</p>
						</div>

						<form class="portal-form" onsubmit={loginFan}>
							<div class="form-group">
								<label for="fan-user">Submission Username</label>
								<input
									type="text"
									id="fan-user"
									placeholder="e.g. miofa1"
									bind:value={fanUsername}
									required
								/>
							</div>

							<div class="form-group">
								<label for="fan-pass">Password</label>
								<div class="input-with-eye">
									<input
										type={fanShowPassword ? 'text' : 'password'}
										id="fan-pass"
										placeholder="Your submission password"
										bind:value={fanPassword}
										required
									/>
									<button
										type="button"
										class="eye-btn"
										onclick={() => (fanShowPassword = !fanShowPassword)}
									>
										{fanShowPassword ? 'Hide' : 'Show'}
									</button>
								</div>
							</div>

							{#if fanError}
								<div class="error-box">{fanError}</div>
							{/if}
							{#if fanFeedback}
								<div class="success-box">{fanFeedback}</div>
							{/if}

							<button type="submit" class="portal-submit-btn" disabled={fanLoading}>
								{fanLoading ? 'Signing In...' : 'Access My Submission →'}
							</button>

							<p class="tab-hint">
								Haven't submitted yet?
								<a href={resolve('/submit')} onclick={() => (isOpen = false)}>Submit a dish here</a>
							</p>
						</form>
					{:else if fanSubmission}
						<!-- AUTHENTICATED FAN DASHBOARD -->
						{#if isEditing}
							<!-- EDIT MODE -->
							<form class="portal-form edit-form" onsubmit={saveFanEdits}>
								<div class="edit-header">
									<h3>Edit Your Dish Submission</h3>
									<p class="edit-sub">Updates will be saved to the 8th anniversary book archive.</p>
								</div>

								<div class="form-group">
									<label for="edit-name">Display Name</label>
									<input
										type="text"
										id="edit-name"
										placeholder="e.g. Miofa1"
										bind:value={editDisplayName}
									/>
								</div>

								<div class="form-group">
									<label for="edit-country">Country / Region</label>
									<input
										type="text"
										id="edit-country"
										placeholder="e.g. Japan"
										bind:value={editCountry}
										required
									/>
								</div>

								<div class="form-group">
									<label for="edit-msg">Anniversary Message</label>
									<textarea
										id="edit-msg"
										rows="3"
										placeholder="Your message to Mio..."
										bind:value={editMessage}></textarea>
								</div>

								<div class="form-group">
									<label for="edit-photo">
										Replace Dish Photo <span class="optional">(Optional)</span>
									</label>
									<input
										type="file"
										id="edit-photo"
										accept="image/*"
										onchange={handleEditPhotoChange}
									/>
									{#if editPhotoPreview}
										<div class="edit-preview-box">
											<img src={editPhotoPreview} alt="New food preview" />
											{#if editFileSizeText}
												<span class="file-size-tag">{editFileSizeText}</span>
											{/if}
										</div>
									{/if}
								</div>

								{#if fanError}
									<div class="error-box">{fanError}</div>
								{/if}

								<div class="edit-actions-row">
									<button
										type="button"
										class="btn-secondary"
										onclick={() => (isEditing = false)}
										disabled={isSaving}
									>
										Cancel
									</button>
									<button type="submit" class="portal-submit-btn" disabled={isSaving}>
										{isSaving ? 'Saving Updates...' : 'Save Changes'}
									</button>
								</div>
							</form>
						{:else}
							<!-- VIEW MODE -->
							<div class="submission-view">
								<div class="status-banner banner-{fanSubmission.status.toLowerCase()}">
									{#if fanSubmission.status === 'APPROVED'}
										<strong>Approved:</strong> Featured in the 8th Anniversary book!
									{:else if fanSubmission.status === 'PENDING'}
										<strong>Pending:</strong> Awaiting moderator verification.
									{:else}
										<strong>Declined:</strong> Check message guidelines or edit entry.
									{/if}
								</div>

								<div class="entry-preview-card">
									<img src={fanSubmission.photo} alt="Submitted dish" class="entry-dish-thumb" />
									<div class="entry-details">
										<div class="entry-author-row">
											<img src={fanSubmission.avatar} alt="Avatar" class="entry-avatar-thumb" />
											<div>
												<h4 class="entry-author-name">
													{fanSubmission.displayName || 'Anonymous Miofa'}
												</h4>
												<span class="entry-country">{fanSubmission.country}</span>
											</div>
										</div>
										<p class="entry-message">"{fanSubmission.message}"</p>
										<span class="entry-account-tag">Account: @{fanSubmission.username}</span>
									</div>
								</div>

								{#if fanFeedback}
									<div class="success-box">{fanFeedback}</div>
								{/if}

								{#if showWithdrawConfirm}
									<div class="withdraw-confirm-box">
										<p>
											<strong>Are you sure you want to withdraw this entry?</strong>
											This will permanently delete your food picture and remove it from the collection.
										</p>
										<div class="withdraw-actions">
											<button
												type="button"
												class="btn-secondary"
												onclick={() => (showWithdrawConfirm = false)}
												disabled={isWithdrawing}
											>
												Cancel
											</button>
											<button
												type="button"
												class="btn-danger-confirm"
												onclick={confirmWithdraw}
												disabled={isWithdrawing}
											>
												{isWithdrawing ? 'Withdrawing...' : 'Yes, Withdraw Entry'}
											</button>
										</div>
									</div>
								{:else}
									<div class="entry-actions-row">
										<button type="button" class="btn-edit" onclick={startEditing}>
											Edit Details / Photo
										</button>
										<button
											type="button"
											class="btn-withdraw"
											onclick={() => (showWithdrawConfirm = true)}
										>
											Withdraw Entry
										</button>
										<button type="button" class="btn-signout" onclick={logoutFan}>
											Sign Out
										</button>
									</div>
								{/if}
							</div>
						{/if}
					{/if}
				</div>
			{/if}

			<!-- TAB 2: STAFF PORTAL -->
			{#if activeTab === 'staff'}
				<div class="tab-content">
					{#if staffChecking}
						<div class="tab-loading">
							<div class="spinner"></div>
							<p>Checking staff access...</p>
						</div>
					{:else if staffAuthenticated && staffUser}
						<div class="staff-logged-in-view">
							<div class="staff-card">
								<span class="wolf-badge">STAFF SESSION ACTIVE</span>
								<h3>Signed in as @{staffUser.username}</h3>
								<p>
									You have full access to review submissions, approve entries, and manage photo
									records.
								</p>

								<div class="staff-actions-row">
									<a
										href={resolve('/moderator')}
										class="portal-submit-btn"
										onclick={() => (isOpen = false)}
									>
										Open Staff Control Panel &rarr;
									</a>
									<button type="button" class="btn-secondary" onclick={logoutStaff}>
										Sign Out of Staff Account
									</button>
								</div>
							</div>
						</div>
					{:else}
						<!-- STAFF LOGIN FORM -->
						<div class="login-intro">
							<p>Sign in with a staff account to review and moderate anniversary book entries.</p>
						</div>

						<form class="portal-form" onsubmit={loginStaff}>
							<div class="form-group">
								<label for="staff-user">Staff Username</label>
								<input
									type="text"
									id="staff-user"
									placeholder="admin"
									bind:value={staffUsername}
									required
								/>
							</div>

							<div class="form-group">
								<label for="staff-pass">Staff Password</label>
								<div class="input-with-eye">
									<input
										type={staffShowPassword ? 'text' : 'password'}
										id="staff-pass"
										placeholder="Enter staff password"
										bind:value={staffPassword}
										required
									/>
									<button
										type="button"
										class="eye-btn"
										onclick={() => (staffShowPassword = !staffShowPassword)}
									>
										{staffShowPassword ? 'Hide' : 'Show'}
									</button>
								</div>
							</div>

							{#if staffError}
								<div class="error-box">{staffError}</div>
							{/if}

							<button type="submit" class="portal-submit-btn" disabled={staffLoading}>
								{staffLoading ? 'Signing In...' : 'Sign In & Open Panel →'}
							</button>
						</form>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* FLOATING GEAR BUTTON */
	.floating-gear-container {
		position: fixed;
		bottom: 22px;
		left: 22px;
		z-index: 9999;
	}

	.floating-gear-btn {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: rgba(18, 18, 30, 0.7);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.16);
		color: #94a3b8;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		position: relative;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
		transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.floating-gear-btn:hover {
		background: rgba(30, 30, 48, 0.95);
		color: #ffd700;
		border-color: rgba(255, 215, 0, 0.45);
		transform: scale(1.1) rotate(45deg);
		box-shadow: 0 6px 20px rgba(255, 215, 0, 0.2);
	}

	.active-dot {
		position: absolute;
		top: 3px;
		right: 3px;
		width: 9px;
		height: 9px;
		background: #10b981;
		border: 2px solid #0f0f18;
		border-radius: 50%;
	}

	/* MODAL BACKDROP */
	.portal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(6px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		padding: 16px;
		box-sizing: border-box;
	}

	.portal-card {
		background: #161624;
		border: 1px solid rgba(255, 255, 255, 0.14);
		border-radius: 12px;
		width: 100%;
		max-width: 480px;
		max-height: 90vh;
		overflow-y: auto;
		color: #e2e8f0;
		padding: 24px;
		box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6);
		box-sizing: border-box;
	}

	.portal-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 20px;
	}

	.portal-title-group {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.portal-icon {
		font-size: 1.8rem;
	}

	.portal-header h2 {
		margin: 0;
		font-size: 1.3rem;
		color: #ffd700;
		font-weight: 700;
	}

	.portal-sub {
		margin: 3px 0 0;
		font-size: 0.8rem;
		color: #94a3b8;
	}

	.portal-close-btn {
		background: none;
		border: none;
		color: #94a3b8;
		font-size: 1.6rem;
		cursor: pointer;
		line-height: 1;
		padding: 4px;
		transition: color 0.2s;
	}

	.portal-close-btn:hover {
		color: #ffd700;
	}

	/* TABS */
	.portal-tabs {
		display: flex;
		gap: 8px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		margin-bottom: 20px;
	}

	.tab-btn {
		background: none;
		border: none;
		color: #94a3b8;
		font-size: 0.9rem;
		font-weight: 600;
		padding: 10px 14px;
		cursor: pointer;
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		transition: all 0.2s;
		border-bottom: 2px solid transparent;
	}

	.tab-btn:hover {
		color: #e2e8f0;
	}

	.tab-btn.active {
		color: #ffd700;
		border-bottom-color: #ffd700;
	}

	.mini-tag {
		background: rgba(16, 185, 129, 0.2);
		color: #6ee7b7;
		font-size: 0.65rem;
		padding: 2px 6px;
		border-radius: 4px;
		font-weight: 700;
	}

	/* TAB CONTENT */
	.login-intro {
		font-size: 0.85rem;
		color: #94a3b8;
		line-height: 1.5;
		margin-bottom: 18px;
	}

	.portal-form .form-group {
		margin-bottom: 14px;
	}

	.portal-form label {
		display: block;
		font-size: 0.82rem;
		font-weight: 600;
		color: #cbd5e1;
		margin-bottom: 6px;
	}

	.portal-form input[type='text'],
	.portal-form input[type='password'],
	.portal-form textarea {
		width: 100%;
		padding: 10px 12px;
		background: #0f0f18;
		border: 1px solid rgba(255, 255, 255, 0.14);
		border-radius: 6px;
		color: #fff;
		font-size: 0.9rem;
		box-sizing: border-box;
	}

	.portal-form input:focus,
	.portal-form textarea:focus {
		outline: none;
		border-color: #ffd700;
	}

	.input-with-eye {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-with-eye input {
		padding-right: 40px;
	}

	.eye-btn {
		position: absolute;
		right: 8px;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		padding: 4px;
	}

	.portal-submit-btn {
		width: 100%;
		padding: 11px;
		background: #c92a42;
		color: #fff;
		font-weight: 700;
		font-size: 0.92rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.2s;
		text-align: center;
		text-decoration: none;
		display: inline-block;
		box-sizing: border-box;
		margin-top: 10px;
	}

	.portal-submit-btn:hover:not(:disabled) {
		background: #a82035;
	}

	.portal-submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.tab-hint {
		font-size: 0.8rem;
		color: #94a3b8;
		text-align: center;
		margin-top: 14px;
	}

	.tab-hint a {
		color: #ffd700;
		text-decoration: none;
		font-weight: 600;
	}

	.tab-hint a:hover {
		text-decoration: underline;
	}

	.error-box {
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.4);
		color: #fca5a5;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 0.82rem;
		margin-bottom: 12px;
	}

	.success-box {
		background: rgba(16, 185, 129, 0.15);
		border: 1px solid rgba(16, 185, 129, 0.4);
		color: #6ee7b7;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 0.82rem;
		margin-bottom: 12px;
	}

	.tab-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 30px 0;
		color: #94a3b8;
		gap: 12px;
	}

	.spinner {
		width: 28px;
		height: 28px;
		border: 3px solid rgba(255, 255, 255, 0.1);
		border-top-color: #ffd700;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* SUBMISSION VIEW */
	.status-banner {
		padding: 10px 14px;
		border-radius: 6px;
		font-size: 0.85rem;
		margin-bottom: 16px;
	}

	.banner-approved {
		background: rgba(16, 185, 129, 0.15);
		border: 1px solid rgba(16, 185, 129, 0.35);
		color: #6ee7b7;
	}

	.banner-pending {
		background: rgba(245, 158, 11, 0.15);
		border: 1px solid rgba(245, 158, 11, 0.35);
		color: #fcd34d;
	}

	.banner-denied {
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.35);
		color: #fca5a5;
	}

	.entry-preview-card {
		background: #0f0f18;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		overflow: hidden;
		margin-bottom: 16px;
	}

	.entry-dish-thumb {
		width: 100%;
		height: 180px;
		object-fit: cover;
		display: block;
	}

	.entry-details {
		padding: 14px;
	}

	.entry-author-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;
	}

	.entry-avatar-thumb {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid #ffd700;
	}

	.entry-author-name {
		margin: 0;
		font-size: 0.95rem;
		color: #ffd700;
	}

	.entry-country {
		font-size: 0.78rem;
		color: #94a3b8;
	}

	.entry-message {
		font-size: 0.88rem;
		color: #e2e8f0;
		margin: 0 0 10px;
		line-height: 1.4;
		font-style: italic;
	}

	.entry-account-tag {
		font-size: 0.75rem;
		color: #64748b;
	}

	.entry-actions-row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.btn-edit {
		flex: 1;
		padding: 9px 12px;
		background: rgba(255, 215, 0, 0.15);
		border: 1px solid rgba(255, 215, 0, 0.35);
		color: #ffd700;
		border-radius: 6px;
		font-size: 0.82rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-edit:hover {
		background: #ffd700;
		color: #0f0f18;
	}

	.btn-withdraw {
		padding: 9px 12px;
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.35);
		color: #fca5a5;
		border-radius: 6px;
		font-size: 0.82rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-withdraw:hover {
		background: #ef4444;
		color: #fff;
	}

	.btn-signout {
		padding: 9px 12px;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #cbd5e1;
		border-radius: 6px;
		font-size: 0.82rem;
		cursor: pointer;
	}

	.btn-signout:hover {
		background: rgba(255, 255, 255, 0.15);
		color: #fff;
	}

	.withdraw-confirm-box {
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid #ef4444;
		border-radius: 8px;
		padding: 14px;
		margin-bottom: 14px;
	}

	.withdraw-confirm-box p {
		margin: 0 0 12px;
		font-size: 0.84rem;
		color: #fca5a5;
		line-height: 1.4;
	}

	.withdraw-actions {
		display: flex;
		gap: 10px;
	}

	.btn-danger-confirm {
		padding: 8px 14px;
		background: #ef4444;
		color: #fff;
		border: none;
		border-radius: 6px;
		font-size: 0.82rem;
		font-weight: 700;
		cursor: pointer;
	}

	.btn-secondary {
		padding: 8px 14px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #cbd5e1;
		border-radius: 6px;
		font-size: 0.82rem;
		cursor: pointer;
	}

	.edit-header h3 {
		margin: 0 0 4px;
		font-size: 1.05rem;
		color: #ffd700;
	}

	.edit-sub {
		margin: 0 0 14px;
		font-size: 0.78rem;
		color: #94a3b8;
	}

	.edit-preview-box {
		margin-top: 8px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.edit-preview-box img {
		max-width: 140px;
		border-radius: 6px;
	}

	.file-size-tag {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.edit-actions-row {
		display: flex;
		gap: 10px;
		margin-top: 16px;
	}

	.optional {
		font-size: 0.75rem;
		color: #94a3b8;
		font-weight: normal;
	}

	/* STAFF LOGGED IN VIEW */
	.staff-card {
		background: #0f0f18;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 8px;
		padding: 20px;
		text-align: center;
	}

	.wolf-badge {
		display: inline-block;
		background: #c92a42;
		color: #fff;
		font-size: 0.72rem;
		font-weight: 800;
		padding: 3px 8px;
		border-radius: 4px;
		margin-bottom: 10px;
	}

	.staff-card h3 {
		margin: 0 0 8px;
		font-size: 1.2rem;
		color: #ffd700;
	}

	.staff-card p {
		margin: 0 0 18px;
		font-size: 0.85rem;
		color: #94a3b8;
		line-height: 1.4;
	}

	.staff-actions-row {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
