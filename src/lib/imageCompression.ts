export interface CompressionOptions {
	maxWidth?: number;
	maxHeight?: number;
	quality?: number;
	mimeType?: string;
}

/**
 * Formats byte count into a human-readable string (e.g. "1.4 MB", "320 KB").
 */
export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Compresses an image file in the browser using HTML5 Canvas.
 * Automatically downscales large dimensions and converts to lightweight WebP/JPEG.
 * If compression is not supported or fails, safely returns the original file.
 */
export async function compressImage(file: File, options: CompressionOptions = {}): Promise<File> {
	// Only compress images
	if (!file.type.startsWith('image/')) {
		return file;
	}

	// SVG and animated GIF shouldn't be flattened to WebP
	if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
		return file;
	}

	const maxWidth = options.maxWidth ?? 1600;
	const maxHeight = options.maxHeight ?? 1600;
	const quality = options.quality ?? 0.82;
	const targetMime = options.mimeType ?? 'image/webp';

	return new Promise((resolve) => {
		const img = new Image();
		const objectUrl = URL.createObjectURL(file);

		img.onload = () => {
			URL.revokeObjectURL(objectUrl);

			let { width, height } = img;

			// Don't upscale smaller images
			if (width <= maxWidth && height <= maxHeight && file.size < 400 * 1024) {
				resolve(file);
				return;
			}

			// Maintain aspect ratio
			if (width > maxWidth || height > maxHeight) {
				const ratio = Math.min(maxWidth / width, maxHeight / height);
				width = Math.round(width * ratio);
				height = Math.round(height * ratio);
			}

			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;

			const ctx = canvas.getContext('2d');
			if (!ctx) {
				resolve(file);
				return;
			}

			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';
			ctx.drawImage(img, 0, 0, width, height);

			canvas.toBlob(
				(blob) => {
					if (!blob || blob.size >= file.size) {
						// If compressed version is somehow larger or failed, retain original
						resolve(file);
						return;
					}

					const extension = targetMime === 'image/webp' ? 'webp' : 'jpg';
					const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'upload';
					const newFileName = `${baseName}.${extension}`;

					const compressedFile = new File([blob], newFileName, {
						type: targetMime,
						lastModified: Date.now()
					});

					resolve(compressedFile);
				},
				targetMime,
				quality
			);
		};

		img.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			resolve(file);
		};

		img.src = objectUrl;
	});
}
