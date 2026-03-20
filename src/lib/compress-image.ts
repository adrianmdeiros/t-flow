const MAX_WIDTH = 800
const MAX_HEIGHT = 800
const QUALITY = 0.8

export async function compressImage(file: File): Promise<File> {
  // Skip non-image files
  if (!file.type.startsWith('image/')) {
    return file
  }

  // Already WebP and small enough — skip
  if (file.type === 'image/webp' && file.size < 100 * 1024) {
    return file
  }

  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap

  // Scale down if exceeds max dimensions
  if (width > MAX_WIDTH || height > MAX_HEIGHT) {
    const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  // Try WebP first, fall back to JPEG
  let blob = await canvas.convertToBlob({ type: 'image/webp', quality: QUALITY })
  if (blob.size === 0) {
    blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: QUALITY })
  }

  return new File([blob], file.name.replace(/\.\w+$/, '.webp'), {
    type: blob.type,
  })
}
