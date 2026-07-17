/**
 * 主题切换 composable
 *
 * 三态：light / dark / auto
 * - 通过给 <html> 添加 .light / .dark 类来驱动：
 *   1) UnoCSS 的 dark:'class' 变体（dark: 前缀）
 *   2) src/style.css 中的 token 覆盖
 * - 持久化：settingsStore(themeMode) 为唯一数据源，同时镜像到 index.html 启动脚本读取的
 *   `reset-theme` 本地键，避免首屏闪烁（FOUC）。
 */
import { ref } from 'vue'
import { useSettingsStore, type ThemeMode } from '@/stores/settingsStore'

const THEME_KEY = 'reset-theme'

const media: MediaQueryList | null =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

/** 根据模式把对应 class 应用到 <html> */
function applyTo(mode: ThemeMode) {
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  if (mode === 'dark') {
    root.classList.add('dark')
  } else if (mode === 'light') {
    root.classList.add('light')
  } else if (media?.matches) {
    // auto + 系统深色
    root.classList.add('dark')
  }
}

export function useTheme() {
  const settings = useSettingsStore()
  const mode = ref<ThemeMode>(settings.themeMode)

  /** 切换主题：更新 store、写镜像键、应用 class */
  function setMode(next: ThemeMode) {
    mode.value = next
    settings.setTheme(next)
    localStorage.setItem(THEME_KEY, next)
    applyTo(next)
  }

  /** 应用启动时调用：同步初始类与媒体监听 */
  function initTheme() {
    mode.value = settings.themeMode
    localStorage.setItem(THEME_KEY, settings.themeMode)
    applyTo(settings.themeMode)
    if (media && typeof media.addEventListener === 'function') {
      media.addEventListener('change', () => {
        if (settings.themeMode === 'auto') applyTo('auto')
      })
    }
  }

  return {
    mode,
    setMode,
    initTheme,
    /** 依据当前模式重新应用 class（供外部在设置变更后调用） */
    apply: () => applyTo(mode.value),
  }
}
