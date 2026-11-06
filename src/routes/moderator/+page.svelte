<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	interface SubmissionItem {
		id: string;
		submittedAt: string;
		updatedAt: string;
		status: 'PENDING' | 'APPROVED' | 'DENIED';
		user: {
			name?: string;
			profilePic?: string;
			country?: string;
			username?: string;
			contact?: {
				type: string;
				info: string;
			};
		};
		message: string;
		photo: string;
	}

	interface Counts {
		total: number;
		pending: number;
		approved: number;
		denied: number;
	}

	let submissions = $state<SubmissionItem[]>([]);
	let counts = $state<Counts>({ total: 0, pending: 0, approved: 0, denied: 0 });
	let currentFilter = $state<'ALL' | 'PENDING' | 'APPROVED' | 'DENIED'>('ALL');
	let searchQuery = $state('');
	let isLoading = $state(true);
	let errorMessage = $state('');
	let actionMessage = $state('');

	// Modals
	let deleteModalItem = $state<SubmissionItem | null>(null);
	let previewPhotoItem = $state<SubmissionItem | null>(null);
	let isActionPending = $state(false);

	async function loadSubmissions() {
		isLoading = true;
		errorMessage = '';
		try {
			const params = new SvelteURLSearchParams();
			if (currentFilter !== 'ALL') {
				params.set('status', currentFilter);
			}
			if (searchQuery.trim()) {
				params.set('search', searchQuery.trim());
			}

			const res = await fetch(`/api/moderator/submissions?${params.toString()}`);
			const data = await res.json();

			if (data.success) {
				submissions = data.submissions;
				counts = data.counts;
			} else {
				errorMessage = data.error || 'Failed to load submissions';
			}
		} catch {
			errorMessage = 'Could not connect to submission API server';
		} finally {
			isLoading = false;
		}
	}

	function setFilter(filter: 'ALL' | 'PENDING' | 'APPROVED' | 'DENIED') {
		currentFilter = filter;
		loadSubmissions();
	}

	function handleSearchInput() {
		loadSubmissions();
	}

	async function updateStatus(id: string, newStatus: 'APPROVED' | 'DENIED') {
		isActionPending = true;
		actionMessage = '';
		try {
			const res = await fetch('/api/moderator/submissions', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, status: newStatus })
			});
			const data = await res.json();
			if (data.success) {
				actionMessage = `✓ Submission marked as ${newStatus}`;
				await loadSubmissions();
			} else {
				errorMessage = data.error || 'Failed to update status';
			}
		} catch {
			errorMessage = 'Failed to execute status change';
		} finally {
			isActionPending = false;
		}
	}

	async function confirmDelete() {
		if (!deleteModalItem) return;
		isActionPending = true;
		actionMessage = '';
		try {
			const res = await fetch('/api/moderator/submissions', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: deleteModalItem.id })
			});
			const data = await res.json();
			if (data.success) {
				actionMessage = `✓ Submission deleted`;
				deleteModalItem = null;
				await loadSubmissions();
			} else {
				errorMessage = data.error || 'Failed to delete submission';
			}
		} catch {
			errorMessage = 'Server error deleting submission';
		} finally {
			isActionPending = false;
		}
	}

	function formatDate(isoString: string): string {
		try {
			const d = new Date(isoString);
			return d.toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return isoString;
		}
	}

	onMount(() => {
		loadSubmissions();
	});
</script>

<div class="moderator-dashboard">
	<!-- TOP BAR -->
	<header class="dashboard-header">
		<div class="header-left">
			<span class="badge">STAFF DASHBOARD</span>
			<h1>Photo Album Moderation Panel</h1>
			<p>Review, verify, approve, and manage submissions for Mio's 8th Anniversary Travel Book.</p>
		</div>
		<div class="header-actions">
			<a href={resolve('/')} class="view-site-btn">&larr; Live Book Site</a>
			<a href={resolve('/submit')} class="view-site-btn">+ New Submission</a>
			<button class="refresh-btn" onclick={loadSubmissions} disabled={isLoading}>
				{isLoading ? 'Refreshing...' : '↻ Refresh'}
			</button>
		</div>
	</header>

	<!-- STATS CARDS -->
	<section class="metrics-grid">
		<button
			type="button"
			class="metric-card"
			class:selected={currentFilter === 'ALL'}
			onclick={() => setFilter('ALL')}
		>
			<span class="metric-label">Total Submissions</span>
			<span class="metric-value">{counts.total}</span>
		</button>
		<button
			type="button"
			class="metric-card card-pending"
			class:selected={currentFilter === 'PENDING'}
			onclick={() => setFilter('PENDING')}
		>
			<span class="metric-label">Needs Review (Pending)</span>
			<span class="metric-value">{counts.pending}</span>
			{#if counts.pending > 0}
				<span class="metric-alert">Action required</span>
			{/if}
		</button>
		<button
			type="button"
			class="metric-card card-approved"
			class:selected={currentFilter === 'APPROVED'}
			onclick={() => setFilter('APPROVED')}
		>
			<span class="metric-label">Approved for Album</span>
			<span class="metric-value">{counts.approved}</span>
		</button>
		<button
			type="button"
			class="metric-card card-denied"
			class:selected={currentFilter === 'DENIED'}
			onclick={() => setFilter('DENIED')}
		>
			<span class="metric-label">Declined / Denied</span>
			<span class="metric-value">{counts.denied}</span>
		</button>
	</section>

	<!-- FEEDBACK NOTIFICATIONS -->
	{#if actionMessage}
		<div class="banner banner-success">{actionMessage}</div>
	{/if}
	{#if errorMessage}
		<div class="banner banner-error">{errorMessage}</div>
	{/if}

	<!-- CONTROLS & SEARCH BAR -->
	<div class="filter-controls-row">
		<!-- FILTER TABS -->
		<div class="filter-tabs">
			<button
				type="button"
				class="tab-btn"
				class:active={currentFilter === 'ALL'}
				onclick={() => setFilter('ALL')}
			>
				All ({counts.total})
			</button>
			<button
				type="button"
				class="tab-btn tab-pending"
				class:active={currentFilter === 'PENDING'}
				onclick={() => setFilter('PENDING')}
			>
				Pending ({counts.pending})
			</button>
			<button
				type="button"
				class="tab-btn tab-approved"
				class:active={currentFilter === 'APPROVED'}
				onclick={() => setFilter('APPROVED')}
			>
				Approved ({counts.approved})
			</button>
			<button
				type="button"
				class="tab-btn tab-denied"
				class:active={currentFilter === 'DENIED'}
				onclick={() => setFilter('DENIED')}
			>
				Denied ({counts.denied})
			</button>
		</div>

		<!-- SEARCH INPUT -->
		<div class="search-box">
			<span class="search-icon">🔍</span>
			<input
				type="text"
				placeholder="Search by name, country, username, contact..."
				bind:value={searchQuery}
				oninput={handleSearchInput}
			/>
			{#if searchQuery}
				<button
					class="clear-search-btn"
					onclick={() => {
						searchQuery = '';
						loadSubmissions();
					}}>&times;</button
				>
			{/if}
		</div>
	</div>

	<!-- TABLE CONTAINER -->
	<div class="table-container">
		{#if isLoading}
			<div class="empty-state">
				<p>Loading entries...</p>
			</div>
		{:else if submissions.length === 0}
			<div class="empty-state">
				<p>No submissions found matching the current filter or search criteria.</p>
			</div>
		{:else}
			<table class="submissions-table">
				<thead>
					<tr>
						<th>Food Image</th>
						<th>Submitter & Region</th>
						<th>Private ID / Contact</th>
						<th>Anniversary Message</th>
						<th>Date</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each submissions as sub (sub.id)}
						<tr class="status-row-{sub.status.toLowerCase()}">
							<!-- 1. FOOD IMAGE THUMBNAIL -->
							<td class="photo-cell">
								<button
									type="button"
									class="photo-thumb-btn"
									onclick={() => (previewPhotoItem = sub)}
									title="Click to view full photo"
								>
									<img src={sub.photo} alt="Food dish" />
									<span class="zoom-pill">Zoom</span>
								</button>
							</td>

							<!-- 2. SUBMITTER & REGION -->
							<td class="user-cell">
								<div class="user-row">
									<img
										src={sub.user.profilePic || '/user/m1.jpg'}
										alt="Avatar"
										class="table-avatar"
									/>
									<div>
										<div class="user-name">{sub.user.name || 'Anonymous Miofa'}</div>
										<div class="user-country">📍 {sub.user.country || 'Unknown'}</div>
									</div>
								</div>
							</td>

							<!-- 3. PRIVATE USERNAME & CONTACT FOR VERIFICATION -->
							<td class="contact-cell">
								<div class="username-tag">User: <strong>{sub.user.username || 'n/a'}</strong></div>
								<div class="contact-tag">
									<span class="contact-type">[{sub.user.contact?.type || 'CONTACT'}]</span>
									<span class="contact-info">{sub.user.contact?.info || 'None'}</span>
								</div>
							</td>

							<!-- 4. MESSAGE -->
							<td class="message-cell">
								<div class="message-text">"{sub.message}"</div>
							</td>

							<!-- 5. DATE -->
							<td class="date-cell">
								<span class="date-time">{formatDate(sub.submittedAt)}</span>
							</td>

							<!-- 6. STATUS BADGE -->
							<td class="status-cell">
								<span class="status-badge badge-{sub.status.toLowerCase()}">
									{sub.status}
								</span>
							</td>

							<!-- 7. ACTIONS -->
							<td class="actions-cell">
								<div class="action-buttons">
									{#if sub.status !== 'APPROVED'}
										<button
											type="button"
											class="btn-action btn-approve"
											onclick={() => updateStatus(sub.id, 'APPROVED')}
											disabled={isActionPending}
										>
											Approve
										</button>
									{/if}

									{#if sub.status !== 'DENIED'}
										<button
											type="button"
											class="btn-action btn-deny"
											onclick={() => updateStatus(sub.id, 'DENIED')}
											disabled={isActionPending}
										>
											Deny
										</button>
									{/if}

									<button
										type="button"
										class="btn-action btn-delete"
										onclick={() => (deleteModalItem = sub)}
										disabled={isActionPending}
									>
										Delete
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>

	<!-- DELETE CONFIRMATION MODAL -->
	{#if deleteModalItem}
		<div
			class="modal-backdrop"
			onclick={() => (deleteModalItem = null)}
			role="dialog"
			aria-modal="true"
		>
			<div class="confirm-modal" onclick={(e) => e.stopPropagation()} role="document">
				<h3 style="color: #ef4444; margin-top: 0;">Confirm Permanent Deletion</h3>
				<p>
					Are you sure you want to delete the submission from
					<strong>{deleteModalItem.user.name || 'Anonymous Miofa'}</strong>
					({deleteModalItem.user.country})?
				</p>
				<p class="modal-warning">
					⚠️ This will permanently remove the entry and delete its uploaded food image. This action
					cannot be undone.
				</p>
				<div class="modal-buttons">
					<button
						type="button"
						class="modal-btn btn-cancel"
						onclick={() => (deleteModalItem = null)}
						disabled={isActionPending}
					>
						Cancel
					</button>
					<button
						type="button"
						class="modal-btn btn-confirm-delete"
						onclick={confirmDelete}
						disabled={isActionPending}
					>
						{isActionPending ? 'Deleting...' : 'Yes, Delete Entry'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- IMAGE ZOOM PREVIEW MODAL -->
	{#if previewPhotoItem}
		<div
			class="modal-backdrop"
			onclick={() => (previewPhotoItem = null)}
			role="dialog"
			aria-modal="true"
		>
			<div class="photo-inspect-modal" onclick={(e) => e.stopPropagation()} role="document">
				<button class="modal-close-x" onclick={() => (previewPhotoItem = null)} aria-label="Close"
					>&times;</button
				>
				<img src={previewPhotoItem.photo} alt="Dish zoom" class="inspect-img" />
				<div class="inspect-info">
					<h3>
						{previewPhotoItem.user.name || 'Anonymous Miofa'} &bull; {previewPhotoItem.user.country}
					</h3>
					<p>"{previewPhotoItem.message}"</p>
					<span class="status-badge badge-{previewPhotoItem.status.toLowerCase()}"
						>{previewPhotoItem.status}</span
					>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.moderator-dashboard {
		max-width: 1300px;
		margin: 0 auto;
		padding: 30px 20px 80px;
		color: #e2e8f0;
		font-family: inherit;
	}

	/* HEADER */
	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 20px;
		margin-bottom: 25px;
		padding-bottom: 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}
	.dashboard-header h1 {
		font-size: 1.85rem;
		font-weight: 800;
		margin: 8px 0 4px;
		color: #ffd700;
	}
	.dashboard-header p {
		color: #94a3b8;
		margin: 0;
		font-size: 0.92rem;
	}
	.header-actions {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}
	.view-site-btn,
	.refresh-btn {
		padding: 8px 16px;
		background: #232334;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 6px;
		color: #fff;
		font-size: 0.85rem;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		transition: background 0.2s;
	}
	.view-site-btn:hover,
	.refresh-btn:hover {
		background: #34344c;
	}

	/* METRICS */
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 15px;
		margin-bottom: 25px;
	}
	.metric-card {
		background: #191926;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		padding: 16px 20px;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s ease;
		color: inherit;
	}
	.metric-card:hover {
		background: #202033;
		border-color: rgba(255, 255, 255, 0.2);
	}
	.metric-card.selected {
		border-color: #ffd700;
		background: #232338;
	}
	.metric-label {
		display: block;
		font-size: 0.8rem;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}
	.metric-value {
		display: block;
		font-size: 1.85rem;
		font-weight: 800;
		color: #fff;
		margin-top: 4px;
	}
	.card-pending .metric-value {
		color: #f59e0b;
	}
	.card-approved .metric-value {
		color: #10b981;
	}
	.card-denied .metric-value {
		color: #ef4444;
	}
	.metric-alert {
		display: inline-block;
		font-size: 0.7rem;
		background: rgba(245, 158, 11, 0.2);
		color: #fbbf24;
		padding: 2px 8px;
		border-radius: 10px;
		margin-top: 6px;
		font-weight: 700;
	}

	/* BANNERS */
	.banner {
		padding: 12px 18px;
		border-radius: 6px;
		margin-bottom: 20px;
		font-size: 0.92rem;
		font-weight: 600;
	}
	.banner-success {
		background: rgba(16, 185, 129, 0.15);
		border: 1px solid #10b981;
		color: #6ee7b7;
	}
	.banner-error {
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid #ef4444;
		color: #fca5a5;
	}

	/* FILTERS & SEARCH */
	.filter-controls-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 15px;
		flex-wrap: wrap;
		margin-bottom: 18px;
	}
	.filter-tabs {
		display: flex;
		background: #171724;
		border-radius: 8px;
		padding: 4px;
		gap: 4px;
	}
	.tab-btn {
		padding: 8px 16px;
		background: transparent;
		border: none;
		border-radius: 6px;
		color: #94a3b8;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}
	.tab-btn:hover {
		color: #fff;
	}
	.tab-btn.active {
		background: #2b2b40;
		color: #fff;
	}
	.tab-btn.tab-pending.active {
		color: #fbbf24;
	}
	.tab-btn.tab-approved.active {
		color: #34d399;
	}
	.tab-btn.tab-denied.active {
		color: #f87171;
	}

	.search-box {
		position: relative;
		display: flex;
		align-items: center;
		min-width: 300px;
		flex-grow: 1;
		max-width: 500px;
	}
	.search-icon {
		position: absolute;
		left: 12px;
		font-size: 0.85rem;
		pointer-events: none;
	}
	.search-box input {
		width: 100%;
		padding: 9px 36px 9px 36px;
		background: #171724;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		color: #fff;
		font-size: 0.88rem;
	}
	.search-box input:focus {
		outline: none;
		border-color: #ffd700;
	}
	.clear-search-btn {
		position: absolute;
		right: 10px;
		background: none;
		border: none;
		color: #94a3b8;
		font-size: 1.1rem;
		cursor: pointer;
	}

	/* TABLE */
	.table-container {
		background: #141420;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		overflow-x: auto;
	}
	.submissions-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.88rem;
		text-align: left;
	}
	.submissions-table th {
		background: #1c1c2b;
		padding: 12px 16px;
		color: #cbd5e1;
		font-weight: 700;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}
	.submissions-table td {
		padding: 14px 16px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		vertical-align: middle;
	}
	.submissions-table tr:hover td {
		background: rgba(255, 255, 255, 0.02);
	}

	/* CELLS */
	.photo-thumb-btn {
		position: relative;
		background: none;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 6px;
		padding: 0;
		cursor: zoom-in;
		overflow: hidden;
		width: 70px;
		height: 70px;
		display: block;
	}
	.photo-thumb-btn img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.zoom-pill {
		position: absolute;
		bottom: 2px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.75);
		color: #fff;
		font-size: 0.65rem;
		padding: 1px 6px;
		border-radius: 4px;
		opacity: 0;
		transition: opacity 0.2s;
	}
	.photo-thumb-btn:hover .zoom-pill {
		opacity: 1;
	}

	.user-row {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 180px;
	}
	.table-avatar {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		object-fit: cover;
		background: #2a2a3c;
		flex-shrink: 0;
	}
	.user-name {
		font-weight: 700;
		color: #fff;
	}
	.user-country {
		font-size: 0.8rem;
		color: #94a3b8;
		margin-top: 2px;
	}

	.username-tag {
		font-size: 0.82rem;
		color: #cbd5e1;
	}
	.contact-tag {
		font-size: 0.78rem;
		color: #94a3b8;
		margin-top: 4px;
		word-break: break-all;
	}
	.contact-type {
		color: #38bdf8;
		font-weight: 700;
	}

	.message-cell {
		max-width: 280px;
	}
	.message-text {
		font-size: 0.85rem;
		color: #cbd5e1;
		font-style: italic;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.date-time {
		font-size: 0.8rem;
		color: #94a3b8;
		white-space: nowrap;
	}

	.status-badge {
		display: inline-block;
		padding: 4px 10px;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.badge-pending {
		background: rgba(245, 158, 11, 0.2);
		border: 1px solid #f59e0b;
		color: #fbbf24;
	}
	.badge-approved {
		background: rgba(16, 185, 129, 0.2);
		border: 1px solid #10b981;
		color: #34d399;
	}
	.badge-denied {
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid #ef4444;
		color: #f87171;
	}

	/* ACTION BUTTONS */
	.action-buttons {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		min-width: 170px;
	}
	.btn-action {
		padding: 5px 10px;
		border-radius: 4px;
		font-size: 0.78rem;
		font-weight: 700;
		cursor: pointer;
		border: 1px solid transparent;
		transition: all 0.15s;
	}
	.btn-action:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.btn-approve {
		background: rgba(16, 185, 129, 0.18);
		border-color: #10b981;
		color: #34d399;
	}
	.btn-approve:hover:not(:disabled) {
		background: #10b981;
		color: #000;
	}
	.btn-deny {
		background: rgba(245, 158, 11, 0.18);
		border-color: #f59e0b;
		color: #fbbf24;
	}
	.btn-deny:hover:not(:disabled) {
		background: #f59e0b;
		color: #000;
	}
	.btn-delete {
		background: rgba(239, 68, 68, 0.18);
		border-color: #ef4444;
		color: #f87171;
	}
	.btn-delete:hover:not(:disabled) {
		background: #ef4444;
		color: #fff;
	}

	.empty-state {
		padding: 60px 20px;
		text-align: center;
		color: #94a3b8;
	}

	/* MODALS */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(4px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		padding: 20px;
	}
	.confirm-modal {
		background: #1c1c2c;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 10px;
		padding: 26px;
		max-width: 480px;
		width: 100%;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7);
	}
	.modal-warning {
		background: rgba(239, 68, 68, 0.12);
		border: 1px solid rgba(239, 68, 68, 0.3);
		padding: 10px 14px;
		border-radius: 6px;
		color: #fca5a5;
		font-size: 0.85rem;
		margin: 15px 0 20px;
	}
	.modal-buttons {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
	}
	.modal-btn {
		padding: 8px 18px;
		border-radius: 6px;
		font-weight: 700;
		font-size: 0.88rem;
		cursor: pointer;
	}
	.btn-cancel {
		background: #2a2a3e;
		color: #cbd5e1;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
	.btn-confirm-delete {
		background: #ef4444;
		color: #fff;
		border: none;
	}
	.btn-confirm-delete:hover:not(:disabled) {
		background: #dc2626;
	}

	.photo-inspect-modal {
		background: #181826;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 10px;
		max-width: 600px;
		width: 100%;
		overflow: hidden;
		position: relative;
	}
	.modal-close-x {
		position: absolute;
		top: 10px;
		right: 12px;
		background: rgba(0, 0, 0, 0.6);
		color: #fff;
		border: none;
		border-radius: 50%;
		width: 32px;
		height: 32px;
		font-size: 1.3rem;
		cursor: pointer;
		z-index: 2;
	}
	.inspect-img {
		width: 100%;
		max-height: 480px;
		object-fit: contain;
		background: #000;
		display: block;
	}
	.inspect-info {
		padding: 20px;
	}
	.inspect-info h3 {
		margin: 0 0 8px;
		color: #ffd700;
	}
	.inspect-info p {
		font-style: italic;
		color: #cbd5e1;
		margin: 0 0 12px;
	}
</style>
