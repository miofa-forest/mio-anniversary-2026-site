import { randomUUID } from 'crypto';

/**
 * The type of contact information submitted.
 */
export enum ContactType {
	/** A Twitter handle */
	TWITTER = 'TWITTER',
	/** A Discord username */
	DISCORD = 'DISCORD',
	/** An email address */
	EMAIL = 'EMAIL'
}

/**
 * A user's contact information.
 */
export interface Contact {
	/** The type of contact */
	readonly type: ContactType;
	/** The information */
	readonly info: string;
}

/**
 * A user's information.
 */
export interface User {
	/** The user's name */
	readonly name?: string;
	/** Reference to the user's profile picture */
	readonly profilePic?: string;
	/** The user's contact information */
	readonly contact?: Contact;
	/** The user's country */
	readonly country?: string;
}

/**
 * Data submitted by a user.
 */
export interface SubmissionData {
	/** The submitting user's information */
	readonly user: User;
	/** The submitted message */
	readonly message: string;
	/** Reference to the submitted photo */
	readonly photo: string;
}

/**
 * Status of a submission.
 */
export enum SubmissionStatus {
	/** The submission is pending approval by moderators */
	PENDING = 'PENDING',
	/** The submission was approved by moderators */
	APPROVED = 'APPROVED',
	/** The submission was rejected by moderators */
	DENIED = 'DENIED'
}

/**
 * A submission in the system.
 */
export interface Submission {
	/** The submission ID */
	readonly id: string;
	/** When the submission was created */
	readonly submittedAt: Date;
	/** The last time the submission was edited */
	readonly updatedAt: Date;
	/** The submission data */
	readonly data: SubmissionData;
	/** The status of the submission */
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
 * Error thrown if an edit is attempted with the
 */
export class InvalidSubmissionToken extends Error {
	constructor() {
		super('Submission token does not match');
	}
}

/**
 * Storage for submissions.
 */
export interface SubmissionStore {
	/**
	 * Adds a new submission.
	 *
	 * @param data The submission data
	 * @returns The ID and token of the new submission
	 */
	addSubmission(data: SubmissionData): Promise<readonly [id: string, token: string]>;

	/**
	 * Edits an existing submission.
	 *
	 * @param id The submission ID
	 * @param token The edit token for the submission
	 * @param data The new submission data
	 * @throws {InvalidSubmissionId} If there is no submission with the given ID
	 * @throws {InvalidSubmissionToken} If the submission token does not match
	 */
	editSubmission(id: string, token: string, data: SubmissionData): Promise<void>;

	/**
	 * Retrieves the existing submissions.
	 *
	 * @returns The submissions
	 */
	getSubmissions(): Promise<readonly Submission[]>;
}

/**
 * Submission stored in-memory for testing.
 */
interface TestSubmission extends Submission {
	/** The edit token. */
	token: string;
}

/**
 * In-memory submission store used for testing.
 */
class TestSubmissionStore implements SubmissionStore {
	/** Submission storage */
	#submissions: TestSubmission[] = [
		{
			id: 'aaa',
			token: 'abc',
			submittedAt: new Date(),
			updatedAt: new Date(),
			data: {
				user: {
					name: 'Test user 1'
				},
				message: 'My message',
				photo: 'abcde.png'
			},
			status: SubmissionStatus.PENDING
		},
		{
			id: 'bbb',
			token: 'def',
			submittedAt: new Date(),
			updatedAt: new Date(),
			data: {
				user: {
					country: 'USA'
				},
				message: 'Other submission',
				photo: '22222.png'
			},
			status: SubmissionStatus.DENIED
		}
	];

	async addSubmission(data: SubmissionData): Promise<readonly [id: string, token: string]> {
		console.log(`Adding submission ${JSON.stringify(data)}`);
		console.log(data);

		const submission: TestSubmission = {
			id: randomUUID(),
			token: randomUUID(),
			submittedAt: new Date(),
			updatedAt: new Date(),
			data: data,
			status: SubmissionStatus.PENDING
		};

		this.#submissions.push(submission);
		return [submission.id, submission.token];
	}

	async editSubmission(id: string, token: string, data: SubmissionData): Promise<void> {
		console.log(`Editing submission ${id}:${token} to ${data}`);

		const idx = this.#submissions.findIndex((v) => v.id == id);
		if (idx == -1) {
			throw new InvalidSubmissionId();
		}

		const submission = this.#submissions[idx];
		if (token != submission.token) {
			throw new InvalidSubmissionToken();
		}

		this.#submissions[idx] = {
			...submission,
			data: data
		};
	}

	async getSubmissions(): Promise<readonly Submission[]> {
		return this.#submissions;
	}
}

/** The active store */
let store: SubmissionStore | null = null;

/**
 * Retrieves the active submission store, initializing it if needed.
 *
 * @returns The active store
 */
export function getStore(): SubmissionStore {
	if (!store) {
		// Initialize the store
		store = new TestSubmissionStore();
	}

	return store;
}
