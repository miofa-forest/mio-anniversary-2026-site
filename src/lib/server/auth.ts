import { env } from '$env/dynamic/private';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';

export const MODERATOR_COOKIE_NAME = 'mod_session';

/**
 * Returns the configured moderator passkey from environment variables,
 * falling back to a default development passkey if not defined.
 */
export function getModeratorKey(): string {
	return env.MODERATOR_KEY || 'miofa2026';
}

function getSecretSignKey(): string {
	return env.SESSION_SECRET || getModeratorKey();
}

/**
 * Generates an HMAC-signed session token for authenticated moderators.
 */
export function createSessionToken(): string {
	const timestamp = Date.now().toString();
	const hmac = createHmac('sha256', getSecretSignKey());
	hmac.update(`mod_auth_${timestamp}`);
	const signature = hmac.digest('hex');
	return `${timestamp}.${signature}`;
}

/**
 * Validates the HMAC signature and timestamp of a session token.
 */
export function verifySessionToken(token: string): boolean {
	if (!token || !token.includes('.')) return false;
	const [timestamp, signature] = token.split('.');
	if (!timestamp || !signature) return false;

	// Session valid for up to 7 days
	const age = Date.now() - parseInt(timestamp, 10);
	if (isNaN(age) || age < 0 || age > 7 * 24 * 60 * 60 * 1000) {
		return false;
	}

	const hmac = createHmac('sha256', getSecretSignKey());
	hmac.update(`mod_auth_${timestamp}`);
	const expectedSignature = hmac.digest('hex');

	try {
		return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
	} catch {
		return false;
	}
}

/**
 * Checks whether an incoming request is authorized as a moderator,
 * either by inspecting the HTTP-only session cookie or an 'x-moderator-key' header.
 */
export function isModeratorAuthenticated(event: RequestEvent): boolean {
	// 1. Direct header check (ideal for scripts/API calls)
	const headerKey = event.request.headers.get('x-moderator-key');
	if (headerKey && headerKey === getModeratorKey()) {
		return true;
	}

	// 2. Cookie check (used by web interface)
	const cookieToken = event.cookies.get(MODERATOR_COOKIE_NAME);
	if (cookieToken && verifySessionToken(cookieToken)) {
		return true;
	}

	return false;
}
