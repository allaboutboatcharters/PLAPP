import { ref } from 'vue'

const message = ref('')
const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

export function showToast(text: string, durationMs = 4000): void {
  message.value = text
  visible.value = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => { visible.value = false }, durationMs)
}

export function hideToast(): void {
  visible.value = false
  if (timer) { clearTimeout(timer); timer = null }
}

export function useToast() {
  return { message, visible, show: showToast, hide: hideToast }
}
