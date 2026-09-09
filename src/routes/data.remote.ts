import * as v from 'valibot';
import { form, query } from '$app/server';
import { getStore } from '$lib/submissions';

/**
 * Retrieves the currently stored submissions.
 */
export const listSubmissions = query(async () => {
	return (await getStore().getSubmissions()).map((s) => ({
		id: s.id,
		data: s.data
	}));
});

/**
 * Adds a new submission.
 */
export const newSubmission = form(
	v.object({
		message: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ message }) => {
		await getStore().addSubmission({
			user: {},
			message: message,
			photo: 'aaa.png'
		});
	}
);
