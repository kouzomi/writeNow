import { ref, readonly } from 'vue'

/** 与 CSS `@media (max-width: 768px)` 保持一致 */
export const MOBILE_BREAKPOINT = 768

const mobile = ref(false)

export const isMobile = readonly(mobile)

export const initMobileListener = () => {
  if (typeof window === 'undefined') return () => {}
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
  const sync = () => {
    mobile.value = mql.matches
    document.documentElement.classList.toggle('is-mobile', mql.matches)
  }
  sync()
  mql.addEventListener('change', sync)
  return () => mql.removeEventListener('change', sync)
}
