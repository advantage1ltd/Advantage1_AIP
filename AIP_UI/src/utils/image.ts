export interface ImageValidationOptions {
	maxSizeBytes: number
	allowedMimeTypes: string[]
}

export const DEFAULT_IMAGE_VALIDATION: ImageValidationOptions = {
	maxSizeBytes: 5 * 1024 * 1024,
	allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
}

export interface CompressImageOptions {
	maxSizePx: number
	mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
	quality: number
}

export const DEFAULT_COMPRESS_OPTIONS: CompressImageOptions = {
	maxSizePx: 256,
	mimeType: 'image/jpeg',
	quality: 0.8,
}

export const validateImageFile = (
	file: File,
	options: ImageValidationOptions = DEFAULT_IMAGE_VALIDATION
): { ok: true } | { ok: false; message: string } => {
	if (!file) {
		return { ok: false, message: 'No file selected' }
	}

	if (file.size > options.maxSizeBytes) {
		return { ok: false, message: `File size must be less than ${Math.round(options.maxSizeBytes / (1024 * 1024))}MB` }
	}

	if (!options.allowedMimeTypes.includes(file.type)) {
		return { ok: false, message: 'Please select a valid image file (JPEG, PNG, GIF, WEBP)' }
	}

	return { ok: true }
}

const readFileAsDataUrl = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(String(reader.result || ''))
		reader.onerror = () => reject(new Error('Error reading file'))
		reader.readAsDataURL(file)
	})

export const compressImageFileToDataUrl = async (
	file: File,
	options: CompressImageOptions = DEFAULT_COMPRESS_OPTIONS
): Promise<string> => {
	const dataUrl = await readFileAsDataUrl(file)

	const img = await new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image()
		image.onload = () => resolve(image)
		image.onerror = () => reject(new Error('Error loading image'))
		image.src = dataUrl
	})

	const canvas = document.createElement('canvas')
	const ctx = canvas.getContext('2d')
	if (!ctx) {
		throw new Error('Could not get canvas context')
	}

	const maxSize = Math.max(1, options.maxSizePx)
	let width = img.width
	let height = img.height

	if (width > height) {
		if (width > maxSize) {
			height = Math.round((height * maxSize) / width)
			width = maxSize
		}
	} else {
		if (height > maxSize) {
			width = Math.round((width * maxSize) / height)
			height = maxSize
		}
	}

	canvas.width = width
	canvas.height = height

	ctx.drawImage(img, 0, 0, width, height)
	return canvas.toDataURL(options.mimeType, options.quality)
}

