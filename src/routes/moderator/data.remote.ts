import { query } from '$app/server';
import { getSubmissions } from '$lib/submissions';

export const listSubmissions = query(async () => {
	return await getSubmissions();
});
