import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	createSessionToken,
	getStaffSession,
	verifyStaffCredentials,
	MODERATOR_COOKIE_NAME
} from '$lib/server/auth';

/**
 * GET /api/moderator/auth
 * Checks if current user has an active, valid staff moderator session.
 */
export const GET: RequestHandler = async (event) => {
	const user = getStaffSession(event);
	return json({
		authenticated: user !== null,
		user: user
			? {
					username: user.username,
					role: user.role
				}
			: null
	});
};

/**
 * POST /api/moderator/auth
 * Verifies staff account credentials (username + password) and sets an HTTP-only session cookie.
 */
export const POST: RequestHandler = async (event) => {
	try {
		const body = await event.request.json();
		const username = (body.username as string)?.trim() || 'admin';
		const password = (body.password as string) || (body.key as string);

		if (!password) {
			return json({ success: false, error: 'Staff account password is required' }, { status: 400 });
		}

		const staffUser = verifyStaffCredentials(username, password);
		if (!staffUser) {
			return json({ success: false, error: 'Invalid staff username or password' }, { status: 401 });
		}

		// Generate signed session token with username payload
		const token = createSessionToken(staffUser.username);

		// Set HTTP-only cookie (valid for 7 days)
		event.cookies.set(MODERATOR_COOKIE_NAME, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 7 * 24 * 60 * 60
		});

		return json({
			success: true,
			user: staffUser,
			message: `Welcome back, ${staffUser.username}!`
		});
	} catch {
		return json({ success: false, error: 'Authentication request failed' }, { status: 500 });
	}
};

/**
 * DELETE /api/moderator/auth
 * Logs the moderator out by clearing the session cookie.
 */
export const DELETE: RequestHandler = async (event) => {
	event.cookies.delete(MODERATOR_COOKIE_NAME, {
		path: '/'
	});

	return json({
		success: true,
		message: 'Moderator session ended'
	});
};
