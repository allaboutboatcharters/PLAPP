/**
 * Сжатие фото паспорта перед отправкой в Claude:
 * даунскейл до ~maxSize по большей стороне, JPEG.
 * Возвращает Blob (для хранения) и base64 (для API, без префикса data:).
 */
export interface CompressedImage {
  blob: Blob
  base64: string
  mediaType: 'image/jpeg'
}

export async function compressImage(file: Blob, maxSize = 1600, quality = 0.85): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap
  const scale = Math.min(1, maxSize / Math.max(width, height))
  width = Math.round(width * scale)
  height = Math.round(height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context недоступен')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Не удалось сжать изображение'))),
      'image/jpeg',
      quality
    )
  })

  const base64 = await blobToBase64(blob)
  return { blob, base64, mediaType: 'image/jpeg' }
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
