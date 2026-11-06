import { query } from '$app/server';
import { getStore } from '$lib/submissions';

/**
 * Retrieves the currently stored submissions.
 */
export const listSubmissions = query(async () => {
	return await getStore().getSubmissions();
});
