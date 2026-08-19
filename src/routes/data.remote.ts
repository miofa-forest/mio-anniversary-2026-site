import * as v from 'valibot';
import { form, query } from '$app/server';
import { addSubmission, getSubmissions } from '$lib/submissions';

export const listSubmissions = query(async () => {
	return (await getSubmissions()).map((s) => ({
		id: s.id,
		data: s.data
	}));
});

export const newSubmission = form(
	v.object({
		message: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ message }) => {
		await addSubmission({
			message: message,
			photo: 'aaa.png'
		});
	}
);
