/** Поделиться файлом (Web Share API level 2) с фолбэком на скачивание. */
export async function shareOrDownload(blob: Blob, fileName: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], fileName, { type: blob.type })

  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: fileName })
      return 'shared'
    } catch (e) {
      // отмена пользователем — не считаем ошибкой, пробуем скачать
      if ((e as Error).name === 'AbortError') return 'shared'
    }
  }

  download(blob, fileName)
  return 'downloaded'
}

export function download(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
