import type { RequestHandler } from './$types';
import { getStore } from '$lib/submissions';

export const GET: RequestHandler = async ({ params }) => {
	const filename = params.filename;

	if (!filename || !/^[a-zA-Z0-9_.-]+$/.test(filename) || filename.includes('..')) {
		return new Response('Invalid filename', { status: 400 });
	}

	const image = await getStore().getImage(filename);
	if (!image) {
		return new Response('Image not found', { status: 404 });
	}

	return new Response(new Uint8Array(image.data), {
		status: 200,
		headers: {
			'Content-Type': image.mimeType,
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
};
