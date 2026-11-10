import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getModeratorKey,
	createSessionToken,
	isModeratorAuthenticated,
	MODERATOR_COOKIE_NAME
} from '$lib/server/auth';

/**
 * GET /api/moderator/auth
 * Checks if current user has an active, valid moderator session.
 */
export const GET: RequestHandler = async (event) => {
	const authenticated = isModeratorAuthenticated(event);
	return json({
		authenticated
	});
};

/**
 * POST /api/moderator/auth
 * Verifies the provided moderator passkey and sets an HTTP-only session cookie.
 */
export const POST: RequestHandler = async (event) => {
	try {
		const body = await event.request.json();
		const passkey = (body.key as string)?.trim();

		if (!passkey) {
			return json({ success: false, error: 'Passkey is required' }, { status: 400 });
		}

		const expectedKey = getModeratorKey();
		if (passkey !== expectedKey) {
			return json({ success: false, error: 'Invalid moderator passkey' }, { status: 401 });
		}

		// Generate signed session token
		const token = createSessionToken();

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
			message: 'Moderator access granted'
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
