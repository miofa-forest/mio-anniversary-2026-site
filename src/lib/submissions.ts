import { randomUUID, scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * The type of contact information submitted.
 */
export enum ContactType {
	TWITTER = 'TWITTER',
	DISCORD = 'DISCORD',
	EMAIL = 'EMAIL',
	OTHER = 'OTHER'
}

/**
 * A user's contact information.
 */
export interface Contact {
	readonly type: ContactType;
	readonly info: string;
}

/**
 * A user's information.
 */
export interface User {
	readonly name?: string;
	readonly profilePic?: string;
	readonly contact?: Contact;
	readonly country?: string;
	readonly username?: string;
	readonly passwordHash?: string;
}

/**
 * Data submitted by a user.
 */
export interface SubmissionData {
	readonly user: User;
	readonly message: string;
	readonly photo: string;
}

/**
 * Status of a submission.
 */
export enum SubmissionStatus {
	PENDING = 'PENDING',
	APPROVED = 'APPROVED',
	DENIED = 'DENIED'
}

/**
 * A submission in the system.
 */
export interface Submission {
	readonly id: string;
	readonly submittedAt: Date;
	readonly updatedAt: Date;
	readonly data: SubmissionData;
	readonly status: SubmissionStatus;
}

/**
 * Error thrown if an edit is attempted with an invalid ID.
 */
export class InvalidSubmissionId extends Error {
	constructor() {
		super('Submission ID not found');
	}
}

/**
 * Error thrown if an edit is attempted with an invalid token.
 */
export class InvalidSubmissionToken extends Error {
	constructor() {
		super('Submission token does not match');
	}
}

/**
 * Storage interface for submissions.
 * Any future database (PostgreSQL, Supabase, SQLite, etc.) will implement this interface.
 */
export interface SubmissionStore {
	addSubmission(data: SubmissionData): Promise<readonly [id: string, token: string]>;
	editSubmission(id: string, token: string, data: SubmissionData): Promise<void>;
	updateSubmission(id: string, data: SubmissionData, newStatus?: SubmissionStatus): Promise<void>;
	getSubmissions(): Promise<readonly Submission[]>;
	getSubmission(id: string): Promise<Submission | null>;
	findSubmissionByUsername(username: string): Promise<StoredSubmission | null>;
	updateStatus(id: string, status: SubmissionStatus): Promise<void>;
	deleteSubmission(id: string): Promise<Submission | null>;
}

export interface StoredSubmission extends Submission {
	token: string;
}

/**
 * Password hashing utility using built-in Node crypto (scrypt).
 */
export function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(password, salt, 32).toString('hex');
	return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
	const [salt, key] = storedHash.split(':');
	if (!salt || !key) return false;
	const hashedBuffer = scryptSync(password, salt, 32);
	const keyBuffer = Buffer.from(key, 'hex');
	return timingSafeEqual(hashedBuffer, keyBuffer);
}

/**
 * Seed entries inspired by Miofa community to ensure initial display is populated.
 */
const INITIAL_SEED_SUBMISSIONS: StoredSubmission[] = [
	{
		id: 'seed-1',
		token: 'token-seed-1',
		submittedAt: new Date('2026-08-15T10:00:00Z'),
		updatedAt: new Date('2026-08-15T10:00:00Z'),
		status: SubmissionStatus.APPROVED,
		data: {
			user: {
				name: 'Miofa1',
				country: 'Japan',
				profilePic: '/user/m1.jpg',
				contact: { type: ContactType.TWITTER, info: '@miofa_jp' },
				username: 'miofa1'
			},
			message: 'Happy 8th Anniversary Mio mama! Hope you enjoy this hot bowl of ramen!',
			photo: '/album assets/photo1.png'
		}
	},
	{
		id: 'seed-2',
		token: 'token-seed-2',
		submittedAt: new Date('2026-08-15T11:00:00Z'),
		updatedAt: new Date('2026-08-15T11:00:00Z'),
		status: SubmissionStatus.APPROVED,
		data: {
			user: {
				name: 'Anonymous Miofa',
				country: 'Philippines',
				profilePic: '/user/m1.jpg',
				contact: { type: ContactType.DISCORD, info: 'miofa_ph#1234' },
				username: 'anon_ph'
			},
			message: 'Warm forest stew from our province! Thank you for 8 wonderful years of smiles.',
			photo: '/album assets/photo1.png'
		}
	},
	{
		id: 'seed-3',
		token: 'token-seed-3',
		submittedAt: new Date('2026-08-16T08:00:00Z'),
		updatedAt: new Date('2026-08-16T08:00:00Z'),
		status: SubmissionStatus.APPROVED,
		data: {
			user: {
				name: 'KuroTae',
				country: 'USA',
				profilePic: '/user/m1.jpg',
				contact: { type: ContactType.TWITTER, info: '@kurotae' },
				username: 'kurotae'
			},
			message: 'Fresh homemade pancakes! Best paired with your morning streams.',
			photo: '/album assets/photo1.png'
		}
	},
	{
		id: 'seed-4',
		token: 'token-seed-4',
		submittedAt: new Date('2026-08-16T14:30:00Z'),
		updatedAt: new Date('2026-08-16T14:30:00Z'),
		status: SubmissionStatus.APPROVED,
		data: {
			user: {
				name: 'Miofa_Global',
				country: 'Indonesia',
				profilePic: '/user/m1.jpg',
				contact: { type: ContactType.DISCORD, info: 'global_fan#5678' },
				username: 'miofa_global'
			},
			message: 'Spicy satay skewers! Sending warm wishes from overseas!',
			photo: '/album assets/photo1.png'
		}
	},
	{
		id: 'seed-5',
		token: 'token-seed-5',
		submittedAt: new Date('2026-08-17T09:15:00Z'),
		updatedAt: new Date('2026-08-17T09:15:00Z'),
		status: SubmissionStatus.APPROVED,
		data: {
			user: {
				name: 'TaigaFan',
				country: 'Canada',
				profilePic: '/user/m1.jpg',
				contact: { type: ContactType.EMAIL, info: 'taiga@example.com' },
				username: 'taigafan'
			},
			message: 'Traditional maple pastries to celebrate your milestone.',
			photo: '/album assets/photo1.png'
		}
	},
	{
		id: 'seed-6',
		token: 'token-seed-6',
		submittedAt: new Date('2026-08-17T18:20:00Z'),
		updatedAt: new Date('2026-08-17T18:20:00Z'),
		status: SubmissionStatus.APPROVED,
		data: {
			user: {
				name: 'Sparky',
				country: 'Germany',
				profilePic: '/user/m1.jpg',
				contact: { type: ContactType.DISCORD, info: 'sparky#9999' },
				username: 'sparky_de'
			},
			message: 'Fresh bakery bread and sausages! Always cheering for you, Mio!',
			photo: '/album assets/photo1.png'
		}
	},
	{
		id: 'seed-7',
		token: 'token-seed-7',
		submittedAt: new Date('2026-08-18T12:00:00Z'),
		updatedAt: new Date('2026-08-18T12:00:00Z'),
		status: SubmissionStatus.APPROVED,
		data: {
			user: {
				name: 'NightWolf',
				country: 'Taiwan',
				profilePic: '/user/m1.jpg',
				contact: { type: ContactType.TWITTER, info: '@nightwolf_tw' },
				username: 'nightwolf'
			},
			message: 'Sweet bubble tea and street snacks for your anniversary concert!',
			photo: '/album assets/photo1.png'
		}
	},
	{
		id: 'seed-8',
		token: 'token-seed-8',
		submittedAt: new Date('2026-08-18T15:45:00Z'),
		updatedAt: new Date('2026-08-18T15:45:00Z'),
		status: SubmissionStatus.APPROVED,
		data: {
			user: {
				name: 'OuroMio',
				country: 'United Kingdom',
				profilePic: '/user/m1.jpg',
				contact: { type: ContactType.EMAIL, info: 'ouromio@example.co.uk' },
				username: 'ouromio'
			},
			message: 'Afternoon forest tea blend. Here is to many more anniversaries ahead!',
			photo: '/album assets/photo1.png'
		}
	}
];

/**
 * File-backed submission store that persists to JSON on disk.
 * Easily swappable to PostgreSQL or any database later.
 */
export class FileSubmissionStore implements SubmissionStore {
	private filePath: string;
	private submissions: StoredSubmission[] = [];
	private initialized = false;

	constructor(customPath?: string) {
		this.filePath = customPath || path.resolve(process.cwd(), 'data', 'submissions.json');
	}

	private ensureLoaded(): void {
		if (this.initialized) return;

		try {
			const dir = path.dirname(this.filePath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}

			if (fs.existsSync(this.filePath)) {
				const content = fs.readFileSync(this.filePath, 'utf-8');
				const raw = JSON.parse(content) as StoredSubmission[];
				this.submissions = raw.map((s) => ({
					...s,
					submittedAt: new Date(s.submittedAt),
					updatedAt: new Date(s.updatedAt)
				}));
			} else {
				// Initialize with seed submissions
				this.submissions = [...INITIAL_SEED_SUBMISSIONS];
				this.saveToDisk();
			}
		} catch (err) {
			console.error('Error loading submissions from file, falling back to seed:', err);
			this.submissions = [...INITIAL_SEED_SUBMISSIONS];
		} finally {
			this.initialized = true;
		}
	}

	private saveToDisk(): void {
		try {
			const dir = path.dirname(this.filePath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			const tempPath = `${this.filePath}.tmp.${Date.now()}`;
			fs.writeFileSync(tempPath, JSON.stringify(this.submissions, null, 2), 'utf-8');
			fs.renameSync(tempPath, this.filePath);
		} catch (err) {
			console.error('Failed to write submissions to disk:', err);
		}
	}

	async addSubmission(data: SubmissionData): Promise<readonly [id: string, token: string]> {
		this.ensureLoaded();
		const now = new Date();
		const submission: StoredSubmission = {
			id: randomUUID(),
			token: randomUUID(),
			submittedAt: now,
			updatedAt: now,
			data,
			status: SubmissionStatus.PENDING
		};

		this.submissions.unshift(submission);
		this.saveToDisk();
		return [submission.id, submission.token];
	}

	async editSubmission(id: string, token: string, data: SubmissionData): Promise<void> {
		this.ensureLoaded();
		const idx = this.submissions.findIndex((v) => v.id === id);
		if (idx === -1) {
			throw new InvalidSubmissionId();
		}

		const submission = this.submissions[idx];
		if (token !== submission.token) {
			throw new InvalidSubmissionToken();
		}

		this.submissions[idx] = {
			...submission,
			updatedAt: new Date(),
			data: {
				...data,
				user: {
					...data.user,
					passwordHash: submission.data.user.passwordHash || data.user.passwordHash
				}
			}
		};
		this.saveToDisk();
	}

	async updateSubmission(
		id: string,
		data: SubmissionData,
		newStatus?: SubmissionStatus
	): Promise<void> {
		this.ensureLoaded();
		const idx = this.submissions.findIndex((v) => v.id === id);
		if (idx === -1) {
			throw new InvalidSubmissionId();
		}

		const existing = this.submissions[idx];
		this.submissions[idx] = {
			...existing,
			updatedAt: new Date(),
			status: newStatus !== undefined ? newStatus : existing.status,
			data: {
				...data,
				user: {
					...data.user,
					passwordHash: existing.data.user.passwordHash || data.user.passwordHash
				}
			}
		};
		this.saveToDisk();
	}

	async findSubmissionByUsername(username: string): Promise<StoredSubmission | null> {
		this.ensureLoaded();
		const cleanUser = username.trim().toLowerCase();
		const found = this.submissions.find((s) => s.data.user.username?.toLowerCase() === cleanUser);
		return found || null;
	}

	async getSubmissions(): Promise<readonly Submission[]> {
		this.ensureLoaded();
		return this.submissions;
	}

	async getSubmission(id: string): Promise<Submission | null> {
		this.ensureLoaded();
		const found = this.submissions.find((s) => s.id === id);
		return found || null;
	}

	async updateStatus(id: string, status: SubmissionStatus): Promise<void> {
		this.ensureLoaded();
		const idx = this.submissions.findIndex((s) => s.id === id);
		if (idx === -1) {
			throw new InvalidSubmissionId();
		}
		this.submissions[idx] = {
			...this.submissions[idx],
			status,
			updatedAt: new Date()
		};
		this.saveToDisk();
	}

	async deleteSubmission(id: string): Promise<Submission | null> {
		this.ensureLoaded();
		const idx = this.submissions.findIndex((s) => s.id === id);
		if (idx === -1) {
			return null;
		}
		const [deleted] = this.submissions.splice(idx, 1);
		this.saveToDisk();
		return deleted;
	}
}

/** The active store singleton */
let store: SubmissionStore | null = null;

/**
 * Retrieves the active submission store, initializing it if needed.
 */
export function getStore(): SubmissionStore {
	if (!store) {
		store = new FileSubmissionStore();
	}
	return store;
}
