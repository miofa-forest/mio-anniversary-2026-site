import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStore, SubmissionStatus } from '$lib/submissions';
import { isModeratorAuthenticated, getStaffSession } from '$lib/server/auth';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * GET /api/moderator/submissions
 * Retrieves submissions for the moderator control panel with counts and optional filtering.
 * Protected: Requires valid moderator session or x-moderator-key header.
 */
export const GET: RequestHandler = async (event) => {
	if (!isModeratorAuthenticated(event)) {
		return json(
			{ success: false, error: 'Unauthorized: Moderator authentication required' },
			{ status: 401 }
		);
	}

	const statusParam = event.url.searchParams.get('status')?.toUpperCase();
	const searchQuery = event.url.searchParams.get('search')?.toLowerCase().trim() || '';

	const all = await getStore().getSubmissions();

	const counts = {
		total: all.length,
		pending: all.filter((s) => s.status === SubmissionStatus.PENDING).length,
		approved: all.filter((s) => s.status === SubmissionStatus.APPROVED).length,
		denied: all.filter((s) => s.status === SubmissionStatus.DENIED).length
	};

	let filtered = [...all];

	if (statusParam && statusParam !== 'ALL') {
		if (
			statusParam === SubmissionStatus.PENDING ||
			statusParam === SubmissionStatus.APPROVED ||
			statusParam === SubmissionStatus.DENIED
		) {
			filtered = filtered.filter((s) => s.status === statusParam);
		}
	}

	if (searchQuery) {
		filtered = filtered.filter((s) => {
			const name = (s.data.user.name || '').toLowerCase();
			const country = (s.data.user.country || '').toLowerCase();
			const username = (s.data.user.username || '').toLowerCase();
			const contact = (s.data.user.contact?.info || '').toLowerCase();
			const message = (s.data.message || '').toLowerCase();
			return (
				name.includes(searchQuery) ||
				country.includes(searchQuery) ||
				username.includes(searchQuery) ||
				contact.includes(searchQuery) ||
				message.includes(searchQuery)
			);
		});
	}

	// Exclude passwordHash from moderator view for safety
	const safeSubmissions = filtered.map((s) => ({
		id: s.id,
		submittedAt: s.submittedAt,
		updatedAt: s.updatedAt,
		status: s.status,
		moderatedBy: s.moderatedBy,
		user: {
			name: s.data.user.name,
			profilePic: s.data.user.profilePic,
			country: s.data.user.country,
			username: s.data.user.username,
			contact: s.data.user.contact
		},
		message: s.data.message,
		photo: s.data.photo
	}));

	return json({
		success: true,
		counts,
		submissions: safeSubmissions
	});
};

/**
 * PATCH /api/moderator/submissions
 * Updates the status of a submission (e.g. APPROVED or DENIED).
 * Protected: Requires valid moderator session or x-moderator-key header.
 */
export const PATCH: RequestHandler = async (event) => {
	if (!isModeratorAuthenticated(event)) {
		return json(
			{ success: false, error: 'Unauthorized: Moderator authentication required' },
			{ status: 401 }
		);
	}

	try {
		const body = await event.request.json();
		const { id, status } = body;

		if (!id || !status) {
			return json({ success: false, error: 'ID and status are required' }, { status: 400 });
		}

		if (!Object.values(SubmissionStatus).includes(status)) {
			return json({ success: false, error: 'Invalid status value' }, { status: 400 });
		}

		const staffUser = getStaffSession(event);
		await getStore().updateStatus(id, status, staffUser?.username || 'admin');

		return json({
			success: true,
			message: `Submission ${id} status updated to ${status}`
		});
	} catch (err: unknown) {
		console.error('Moderator status update error:', err);
		const errorMsg = err instanceof Error ? err.message : 'Failed to update status';
		return json({ success: false, error: errorMsg }, { status: 500 });
	}
};

/**
 * DELETE /api/moderator/submissions
 * Deletes a submission and cleans up uploaded files if present.
 * Protected: Requires valid moderator session or x-moderator-key header.
 */
export const DELETE: RequestHandler = async (event) => {
	if (!isModeratorAuthenticated(event)) {
		return json(
			{ success: false, error: 'Unauthorized: Moderator authentication required' },
			{ status: 401 }
		);
	}

	try {
		const body = await event.request.json();
		const { id } = body;

		if (!id) {
			return json({ success: false, error: 'Submission ID is required' }, { status: 400 });
		}

		const deleted = await getStore().deleteSubmission(id);
		if (!deleted) {
			return json({ success: false, error: 'Submission not found' }, { status: 404 });
		}

		// Clean up files in static/uploads if they were custom uploads
		const uploadsDir = path.resolve(process.cwd(), 'static', 'uploads');
		const filesToClean = [deleted.data.photo, deleted.data.user.profilePic].filter(
			(p): p is string => Boolean(p && p.startsWith('/uploads/'))
		);

		for (const fileUrl of filesToClean) {
			try {
				const fileName = path.basename(fileUrl);
				const diskPath = path.join(uploadsDir, fileName);
				await fs.unlink(diskPath);
			} catch {
				// Ignore if file was already gone
			}
		}

		return json({
			success: true,
			message: `Submission ${id} deleted successfully`
		});
	} catch (err: unknown) {
		console.error('Moderator delete error:', err);
		const errorMsg = err instanceof Error ? err.message : 'Failed to delete submission';
		return json({ success: false, error: errorMsg }, { status: 500 });
	}
};
