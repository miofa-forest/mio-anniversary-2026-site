import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getStore,
	verifyPassword,
	SubmissionStatus,
	type StoredSubmission,
	type SubmissionData
} from '$lib/submissions';
import { createFanToken, getFanSession, FAN_COOKIE_NAME } from '$lib/server/auth';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

function mapSubmissionSummary(sub: StoredSubmission) {
	return {
		id: sub.id,
		status: sub.status,
		displayName: sub.data.user.name || '',
		username: sub.data.user.username,
		country: sub.data.user.country || '',
		contact: sub.data.user.contact?.info || '',
		photo: sub.data.photo,
		avatar: sub.data.user.profilePic || '/user/m1.jpg',
		message: sub.data.message,
		submittedAt: sub.submittedAt,
		updatedAt: sub.updatedAt
	};
}

/**
 * GET /api/submissions/manage
 * Retrieves the currently logged-in fan's submission data.
 */
export const GET: RequestHandler = async (event) => {
	const session = getFanSession(event);
	if (!session) {
		return json({ authenticated: false });
	}

	const sub = (await getStore().getSubmission(session.submissionId)) as StoredSubmission | null;
	if (!sub) {
		event.cookies.delete(FAN_COOKIE_NAME, { path: '/' });
		return json({ authenticated: false });
	}

	return json({
		authenticated: true,
		submission: mapSubmissionSummary(sub)
	});
};

/**
 * POST /api/submissions/manage
 * Authenticates a fan by submission username and password.
 */
export const POST: RequestHandler = async (event) => {
	try {
		const body = await event.request.json();
		const username = (body.username as string)?.trim().toLowerCase();
		const password = (body.password as string) || '';

		if (!username || !password) {
			return json({ success: false, error: 'Username and password are required' }, { status: 400 });
		}

		const store = getStore();
		const sub = await store.findSubmissionByUsername(username);

		if (!sub || !sub.data.user.passwordHash) {
			return json(
				{ success: false, error: 'No submission found matching this username' },
				{ status: 401 }
			);
		}

		const isPasswordValid = verifyPassword(password, sub.data.user.passwordHash);
		if (!isPasswordValid) {
			return json({ success: false, error: 'Incorrect submission password' }, { status: 401 });
		}

		// Set authenticated session cookie
		const token = createFanToken(sub.id, username);
		event.cookies.set(FAN_COOKIE_NAME, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 30 * 24 * 60 * 60
		});

		return json({
			success: true,
			submission: mapSubmissionSummary(sub),
			message: `Welcome back, @${username}!`
		});
	} catch (err: unknown) {
		console.error('Fan auth error:', err);
		return json({ success: false, error: 'Login request failed' }, { status: 500 });
	}
};

/**
 * PATCH /api/submissions/manage
 * Allows a fan to update their message, displayName, country, or replacement dish photo.
 */
export const PATCH: RequestHandler = async (event) => {
	const session = getFanSession(event);
	if (!session) {
		return json({ success: false, error: 'Authentication required' }, { status: 401 });
	}

	const store = getStore();
	const existing = (await store.getSubmission(session.submissionId)) as StoredSubmission | null;
	if (!existing) {
		return json({ success: false, error: 'Submission not found' }, { status: 404 });
	}

	try {
		const formData = await event.request.formData();
		const displayName = (formData.get('displayName') as string)?.trim();
		const country = (formData.get('country') as string)?.trim();
		const message = (formData.get('message') as string)?.trim();
		const newFoodImage = formData.get('foodImage') as File | null;

		let updatedPhoto = existing.data.photo;
		let status = existing.status;

		if (newFoodImage && newFoodImage instanceof File && newFoodImage.size > 0) {
			const uploadsDir = path.resolve(process.cwd(), 'static', 'uploads');
			await fs.mkdir(uploadsDir, { recursive: true });

			const ext = path.extname(newFoodImage.name).toLowerCase() || '.webp';
			const newFileName = `food_${randomUUID()}${ext}`;
			const newFilePath = path.join(uploadsDir, newFileName);
			const buffer = Buffer.from(await newFoodImage.arrayBuffer());
			await fs.writeFile(newFilePath, buffer);

			// Clean up old uploaded photo if it is inside /uploads/
			if (existing.data.photo.startsWith('/uploads/')) {
				try {
					const oldPath = path.join(process.cwd(), 'static', existing.data.photo);
					await fs.unlink(oldPath);
				} catch {
					// Ignore unlink errors
				}
			}

			updatedPhoto = `/uploads/${newFileName}`;
			// If replacing photo, set back to PENDING for moderation re-approval
			status = SubmissionStatus.PENDING;
		}

		const updatedData: SubmissionData = {
			...existing.data,
			photo: updatedPhoto,
			message: message !== undefined && message !== '' ? message : existing.data.message,
			user: {
				...existing.data.user,
				name: displayName !== undefined ? displayName : existing.data.user.name,
				country: country !== undefined && country !== '' ? country : existing.data.user.country
			}
		};

		await store.updateSubmission(existing.id, updatedData, status);

		const refreshed = (await store.getSubmission(existing.id)) as StoredSubmission;

		return json({
			success: true,
			submission: mapSubmissionSummary(refreshed),
			message: 'Submission successfully updated!'
		});
	} catch (err: unknown) {
		console.error('Fan update error:', err);
		return json({ success: false, error: 'Failed to update submission' }, { status: 500 });
	}
};

/**
 * DELETE /api/submissions/manage
 * Handles session logout (query action=logout) or permanent entry withdrawal.
 */
export const DELETE: RequestHandler = async (event) => {
	const action = event.url.searchParams.get('action');

	if (action === 'logout') {
		event.cookies.delete(FAN_COOKIE_NAME, { path: '/' });
		return json({ success: true, message: 'Logged out successfully' });
	}

	const session = getFanSession(event);
	if (!session) {
		return json({ success: false, error: 'Authentication required' }, { status: 401 });
	}

	const store = getStore();
	const deleted = await store.deleteSubmission(session.submissionId);

	if (deleted) {
		// Clean up files
		if (deleted.data.photo.startsWith('/uploads/')) {
			try {
				const foodPath = path.join(process.cwd(), 'static', deleted.data.photo);
				await fs.unlink(foodPath);
			} catch {
				// Ignore
			}
		}
		if (deleted.data.user.profilePic && deleted.data.user.profilePic.startsWith('/uploads/')) {
			try {
				const avatarPath = path.join(process.cwd(), 'static', deleted.data.user.profilePic);
				await fs.unlink(avatarPath);
			} catch {
				// Ignore
			}
		}
	}

	event.cookies.delete(FAN_COOKIE_NAME, { path: '/' });

	return json({
		success: true,
		message: 'Your entry has been withdrawn and removed from the archive.'
	});
};
