import { env } from '$env/dynamic/private';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';

export const MODERATOR_COOKIE_NAME = 'mod_session';

export interface StaffUser {
	username: string;
	role: 'admin' | 'moderator';
}

const DEFAULT_ADMIN_PASS = 'i am what i eat, and im an innocent miofa';

/**
 * Returns a dictionary of configured staff accounts { [username]: password }.
 * Checks env.STAFF_ACCOUNTS (JSON), or falls back to admin with env.STAFF_PASSWORD / env.MODERATOR_KEY.
 */
export function getStaffAccounts(): Record<string, string> {
	if (env.STAFF_ACCOUNTS) {
		try {
			const parsed = JSON.parse(env.STAFF_ACCOUNTS);
			if (typeof parsed === 'object' && parsed !== null) {
				const map: Record<string, string> = {};
				for (const [k, v] of Object.entries(parsed)) {
					if (typeof v === 'string') {
						map[k.trim().toLowerCase()] = v;
					}
				}
				return map;
			}
		} catch {
			// fallback on parse error
		}
	}

	const adminPass = env.STAFF_PASSWORD || env.MODERATOR_KEY || DEFAULT_ADMIN_PASS;
	return {
		admin: adminPass
	};
}

function getSecretSignKey(): string {
	return env.SESSION_SECRET || env.STAFF_PASSWORD || env.MODERATOR_KEY || DEFAULT_ADMIN_PASS;
}

/**
 * Verifies staff username & password against registered staff accounts.
 */
export function verifyStaffCredentials(username: string, password: string): StaffUser | null {
	const accounts = getStaffAccounts();
	const normalizedUser = (username || 'admin').trim().toLowerCase();
	const expectedPassword = accounts[normalizedUser];

	if (!expectedPassword) {
		return null;
	}

	const bufA = Buffer.from(password);
	const bufB = Buffer.from(expectedPassword);

	if (bufA.length === bufB.length && timingSafeEqual(bufA, bufB)) {
		return {
			username: normalizedUser,
			role: normalizedUser === 'admin' ? 'admin' : 'moderator'
		};
	}

	return null;
}

/**
 * Generates an HMAC-signed session token containing the staff username.
 */
export function createSessionToken(username: string): string {
	const timestamp = Date.now();
	const payload = Buffer.from(JSON.stringify({ u: username, t: timestamp })).toString('base64url');
	const hmac = createHmac('sha256', getSecretSignKey());
	hmac.update(`staff_auth_${payload}`);
	const signature = hmac.digest('base64url');
	return `${payload}.${signature}`;
}

/**
 * Validates the HMAC signature and timestamp of a session token.
 * Returns the decoded staff user if valid, or null.
 */
export function verifySessionToken(token: string): StaffUser | null {
	if (!token || !token.includes('.')) return null;
	const [payload, signature] = token.split('.');
	if (!payload || !signature) return null;

	const hmac = createHmac('sha256', getSecretSignKey());
	hmac.update(`staff_auth_${payload}`);
	const expectedSignature = hmac.digest('base64url');

	try {
		const validSig = timingSafeEqual(
			Buffer.from(signature, 'utf-8'),
			Buffer.from(expectedSignature, 'utf-8')
		);
		if (!validSig) return null;

		const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
		if (!decoded || typeof decoded.u !== 'string' || typeof decoded.t !== 'number') {
			return null;
		}

		// Valid for up to 7 days
		const age = Date.now() - decoded.t;
		if (isNaN(age) || age < 0 || age > 7 * 24 * 60 * 60 * 1000) {
			return null;
		}

		return {
			username: decoded.u,
			role: decoded.u === 'admin' ? 'admin' : 'moderator'
		};
	} catch {
		return null;
	}
}

/**
 * Returns the authenticated staff session if present, or null.
 */
export function getStaffSession(event: RequestEvent): StaffUser | null {
	// 1. Direct header check (for automation or script tests)
	const headerKey = event.request.headers.get('x-moderator-key');
	if (headerKey) {
		const adminPass = env.STAFF_PASSWORD || env.MODERATOR_KEY || DEFAULT_ADMIN_PASS;
		const bufA = Buffer.from(headerKey);
		const bufB = Buffer.from(adminPass);
		if (bufA.length === bufB.length && timingSafeEqual(bufA, bufB)) {
			return { username: 'api-admin', role: 'admin' };
		}
	}

	// 2. Cookie check
	const cookieToken = event.cookies.get(MODERATOR_COOKIE_NAME);
	if (cookieToken) {
		return verifySessionToken(cookieToken);
	}

	return null;
}

/**
 * Checks whether an incoming request is authorized as a moderator.
 */
export function isModeratorAuthenticated(event: RequestEvent): boolean {
	return getStaffSession(event) !== null;
}
