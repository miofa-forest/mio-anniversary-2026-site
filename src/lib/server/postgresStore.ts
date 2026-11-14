import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import {
	ContactType,
	InvalidSubmissionId,
	InvalidSubmissionToken,
	SubmissionStatus,
	type StoredSubmission,
	type Submission,
	type SubmissionData,
	type SubmissionStore
} from '$lib/submissions';
import { randomUUID } from 'node:crypto';

interface DbRow {
	id: string;
	token: string;
	submitted_at: Date;
	updated_at: Date;
	status: string;
	moderated_by: string | null;
	display_name: string | null;
	profile_pic: string | null;
	country: string;
	username: string | null;
	password_hash: string | null;
	contact_type: string | null;
	contact_info: string | null;
	message: string | null;
	photo: string;
}

export class PostgresSubmissionStore implements SubmissionStore {
	private sql: postgres.Sql;
	private initialized = false;

	constructor(connectionString?: string) {
		const conn = connectionString || env.DATABASE_URL;
		if (conn) {
			this.sql = postgres(conn, { max: 10, idle_timeout: 20 });
		} else {
			this.sql = postgres({
				host: env.DATABASE_HOST || 'localhost',
				port: parseInt(env.DATABASE_PORT || '5432', 10),
				database: env.DATABASE_DBNAME || 'site',
				username: env.DATABASE_USERNAME || 'server',
				password: env.DATABASE_PASSWORD || 'SamplePassword',
				max: 10,
				idle_timeout: 20
			});
		}
	}

	private async ensureInit(): Promise<void> {
		if (this.initialized) return;

		await this.sql`
			CREATE TABLE IF NOT EXISTS submissions (
				id VARCHAR(64) PRIMARY KEY,
				token VARCHAR(64) NOT NULL,
				submitted_at TIMESTAMPTZ NOT NULL,
				updated_at TIMESTAMPTZ NOT NULL,
				status VARCHAR(20) NOT NULL,
				moderated_by VARCHAR(64),
				display_name TEXT,
				profile_pic TEXT,
				country TEXT NOT NULL,
				username TEXT,
				password_hash TEXT,
				contact_type VARCHAR(20),
				contact_info TEXT,
				message TEXT,
				photo TEXT NOT NULL
			);
		`;

		await this.sql`
			CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
		`;
		await this.sql`
			CREATE INDEX IF NOT EXISTS idx_submissions_username ON submissions(username);
		`;

		this.initialized = true;
	}

	private mapRow(row: DbRow): StoredSubmission {
		let contactType = ContactType.OTHER;
		if (row.contact_type === 'TWITTER') contactType = ContactType.TWITTER;
		else if (row.contact_type === 'DISCORD') contactType = ContactType.DISCORD;
		else if (row.contact_type === 'EMAIL') contactType = ContactType.EMAIL;

		let status = SubmissionStatus.PENDING;
		if (row.status === 'APPROVED') status = SubmissionStatus.APPROVED;
		else if (row.status === 'DENIED') status = SubmissionStatus.DENIED;

		return {
			id: row.id,
			token: row.token,
			submittedAt: new Date(row.submitted_at),
			updatedAt: new Date(row.updated_at),
			status,
			moderatedBy: row.moderated_by || undefined,
			data: {
				user: {
					name: row.display_name || undefined,
					country: row.country,
					profilePic: row.profile_pic || undefined,
					username: row.username || undefined,
					passwordHash: row.password_hash || undefined,
					contact: row.contact_info
						? {
								type: contactType,
								info: row.contact_info
							}
						: undefined
				},
				message: row.message || '',
				photo: row.photo
			}
		};
	}

	async addSubmission(data: SubmissionData): Promise<readonly [id: string, token: string]> {
		await this.ensureInit();
		const id = randomUUID();
		const token = randomUUID();
		const now = new Date();

		await this.sql`
			INSERT INTO submissions (
				id, token, submitted_at, updated_at, status, display_name,
				profile_pic, country, username, password_hash, contact_type,
				contact_info, message, photo
			) VALUES (
				${id},
				${token},
				${now},
				${now},
				${SubmissionStatus.PENDING},
				${data.user.name || null},
				${data.user.profilePic || null},
				${data.user.country || 'Global'},
				${data.user.username?.toLowerCase() || null},
				${data.user.passwordHash || null},
				${data.user.contact?.type || null},
				${data.user.contact?.info || null},
				${data.message},
				${data.photo}
			);
		`;

		return [id, token];
	}

	async editSubmission(id: string, token: string, data: SubmissionData): Promise<void> {
		await this.ensureInit();
		const [existing] = await this.sql<DbRow[]>`
			SELECT id, token, password_hash FROM submissions WHERE id = ${id} LIMIT 1;
		`;

		if (!existing) {
			throw new InvalidSubmissionId();
		}
		if (existing.token !== token) {
			throw new InvalidSubmissionToken();
		}

		const now = new Date();
		await this.sql`
			UPDATE submissions SET
				updated_at = ${now},
				display_name = ${data.user.name || null},
				country = ${data.user.country || 'Global'},
				message = ${data.message},
				photo = ${data.photo}
			WHERE id = ${id};
		`;
	}

	async updateSubmission(
		id: string,
		data: SubmissionData,
		newStatus?: SubmissionStatus
	): Promise<void> {
		await this.ensureInit();
		const [existing] = await this.sql<DbRow[]>`
			SELECT id, status FROM submissions WHERE id = ${id} LIMIT 1;
		`;

		if (!existing) {
			throw new InvalidSubmissionId();
		}

		const now = new Date();
		const statusToSet = newStatus !== undefined ? newStatus : existing.status;

		await this.sql`
			UPDATE submissions SET
				updated_at = ${now},
				status = ${statusToSet},
				display_name = ${data.user.name || null},
				country = ${data.user.country || 'Global'},
				message = ${data.message},
				photo = ${data.photo}
			WHERE id = ${id};
		`;
	}

	async getSubmissions(): Promise<readonly Submission[]> {
		await this.ensureInit();
		const rows = await this.sql<DbRow[]>`
			SELECT * FROM submissions ORDER BY submitted_at DESC;
		`;
		return rows.map((r) => this.mapRow(r));
	}

	async getSubmission(id: string): Promise<Submission | null> {
		await this.ensureInit();
		const [row] = await this.sql<DbRow[]>`
			SELECT * FROM submissions WHERE id = ${id} LIMIT 1;
		`;
		return row ? this.mapRow(row) : null;
	}

	async findSubmissionByUsername(username: string): Promise<StoredSubmission | null> {
		await this.ensureInit();
		const cleanUser = username.trim().toLowerCase();
		const [row] = await this.sql<DbRow[]>`
			SELECT * FROM submissions WHERE LOWER(username) = ${cleanUser} LIMIT 1;
		`;
		return row ? this.mapRow(row) : null;
	}

	async updateStatus(id: string, status: SubmissionStatus, moderatedBy?: string): Promise<void> {
		await this.ensureInit();
		const now = new Date();
		const result = await this.sql`
			UPDATE submissions SET
				status = ${status},
				moderated_by = COALESCE(${moderatedBy || null}, moderated_by),
				updated_at = ${now}
			WHERE id = ${id};
		`;

		if (result.count === 0) {
			throw new InvalidSubmissionId();
		}
	}

	async deleteSubmission(id: string): Promise<Submission | null> {
		await this.ensureInit();
		const [row] = await this.sql<DbRow[]>`
			DELETE FROM submissions WHERE id = ${id} RETURNING *;
		`;
		return row ? this.mapRow(row) : null;
	}
}
