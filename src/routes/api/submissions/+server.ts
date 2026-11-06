import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStore, hashPassword, ContactType, SubmissionStatus } from '$lib/submissions';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// Helper to determine extension from file name or mime type
function getFileExtension(file: File): string {
	const originalExt = path.extname(file.name).toLowerCase();
	if (originalExt) return originalExt;
	if (file.type === 'image/png') return '.png';
	if (file.type === 'image/webp') return '.webp';
	if (file.type === 'image/gif') return '.gif';
	return '.jpg';
}

/**
 * Public GET: Returns all APPROVED submissions for the photo album book.
 */
export const GET: RequestHandler = async () => {
	const all = await getStore().getSubmissions();
	const approved = all.filter((s) => s.status === SubmissionStatus.APPROVED);

	const mapped = approved.map((s, index) => ({
		id: s.id,
		pageNumber: index + 1,
		caption: `#${index + 1}`,
		author: s.data.user.name?.trim() || 'Anonymous Miofa',
		country: s.data.user.country || 'Global',
		avatar: s.data.user.profilePic || '/user/m1.jpg',
		img: s.data.photo,
		message: s.data.message,
		submittedAt: s.submittedAt
	}));

	return json({
		success: true,
		submissions: mapped
	});
};

/**
 * Public POST: Receives submission form data and saves food photo + avatar.
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();

		const displayName = (formData.get('displayName') as string)?.trim() || 'Anonymous Miofa';
		const country = (formData.get('country') as string)?.trim();
		const username = (formData.get('username') as string)?.trim().toLowerCase();
		const password = (formData.get('password') as string)?.trim();
		const contact = (formData.get('contact') as string)?.trim();
		const message =
			(formData.get('message') as string)?.trim() ||
			'Happy 8th Anniversary, Mio mama! 🌲✨';

		const foodImageFile = formData.get('foodImage') as File | null;
		const avatarFile = formData.get('avatar') as File | null;
		const defaultAvatarUrl = (formData.get('defaultAvatarUrl') as string) || '/user/m1.jpg';

		// Validations
		if (!country) {
			return json({ success: false, error: 'Country is required' }, { status: 400 });
		}
		if (!username) {
			return json({ success: false, error: 'Username is required' }, { status: 400 });
		}
		if (!password) {
			return json({ success: false, error: 'Password is required' }, { status: 400 });
		}
		if (!contact) {
			return json({ success: false, error: 'Contact information is required' }, { status: 400 });
		}
		if (!foodImageFile || !(foodImageFile instanceof File) || foodImageFile.size === 0) {
			return json({ success: false, error: 'Food image is required' }, { status: 400 });
		}

		// Ensure static/uploads exists
		const uploadsDir = path.resolve(process.cwd(), 'static', 'uploads');
		await fs.mkdir(uploadsDir, { recursive: true });

		// Save food image
		const foodExt = getFileExtension(foodImageFile);
		const foodFileName = `food_${randomUUID()}${foodExt}`;
		const foodFilePath = path.join(uploadsDir, foodFileName);
		const foodBuffer = Buffer.from(await foodImageFile.arrayBuffer());
		await fs.writeFile(foodFilePath, foodBuffer);
		const foodPhotoUrl = `/uploads/${foodFileName}`;

		// Save avatar image if uploaded, otherwise use default
		let profilePicUrl = defaultAvatarUrl;
		if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
			const avatarExt = getFileExtension(avatarFile);
			const avatarFileName = `avatar_${randomUUID()}${avatarExt}`;
			const avatarFilePath = path.join(uploadsDir, avatarFileName);
			const avatarBuffer = Buffer.from(await avatarFile.arrayBuffer());
			await fs.writeFile(avatarFilePath, avatarBuffer);
			profilePicUrl = `/uploads/${avatarFileName}`;
		}

		// Determine contact type
		let contactType = ContactType.OTHER;
		if (contact.includes('@') && contact.includes('.')) {
			contactType = ContactType.EMAIL;
		} else if (contact.startsWith('@') || !contact.includes('#')) {
			contactType = ContactType.TWITTER;
		} else if (contact.includes('#') || !contact.startsWith('@')) {
			contactType = ContactType.DISCORD;
		}

		// Hash password for security
		const passwordHash = hashPassword(password);

		// Save to store
		const [id, token] = await getStore().addSubmission({
			user: {
				name: displayName,
				country,
				profilePic: profilePicUrl,
				username,
				passwordHash,
				contact: {
					type: contactType,
					info: contact
				}
			},
			photo: foodPhotoUrl,
			message
		});

		return json({
			success: true,
			id,
			token,
			message: `Submission successfully received! Entry ID: ${id}`
		});
	} catch (err: any) {
		console.error('Submission handling error:', err);
		return json(
			{
				success: false,
				error: err?.message || 'Internal server error while processing submission'
			},
			{ status: 500 }
		);
	}
};
