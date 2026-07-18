/**
 * 数据导出 / 导入 composable（事件驱动架构）
 *
 * 数据来源：eventStore（localStorage）与 settingsStore，不再依赖空的 Dexie 会话表。
 * 导出：按范围筛选 → 组合成 JSON 字符串 → 复制到剪贴板（手机优先，不再生成文件）。
 *       若传入 prompt，则把提示词拼接在 JSON 之前一起复制，方便直接发给 AI 分析。
 */
import { ref } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useBackup } from './useBackup'

/** 复制到剪贴板（带降级方案） */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* 走降级 */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/** 本周一 00:00 的时间戳 */
function weekStartTs(): number {
  const d = new Date()
  const day = d.getDay() // 0=周日
  const diff = (day + 6) % 7 // 让周一=0
  const monday = new Date(d)
  monday.setDate(d.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday.getTime()
}

export function useSessions() {
  const eventStore = useEventStore()
  const settingsStore = useSettingsStore()
  const { buildBackup, importData, isImporting, error } = useBackup()
  const isExporting = ref(false)

  /** 导出当前事件与设置（按范围），可选拼接提示词，复制到剪贴板。返回导出条数。 */
  async function handleExport(range: 'week' | 'all' = 'week', prompt?: string): Promise<number> {
    isExporting.value = true
    try {
      const start = range === 'week' ? weekStartTs() : 0
      const events = range === 'all'
        ? eventStore.events
        : eventStore.events.filter((e) => e.timestamp >= start)

      const json = buildBackup([...events], range)
      const payload = prompt && prompt.trim() ? `${prompt.trim()}\n\n${json}` : json
      await copyText(payload)
      localStorage.setItem('reset-last-export', new Date().toISOString())
      return events.length
    } finally {
      isExporting.value = false
    }
  }

  /** 下载备份文件到本机（iOS 会弹出"存储到文件/分享"）。返回导出条数。 */
  function downloadBackup(range: 'week' | 'all' = 'week'): number {
    const start = range === 'week' ? weekStartTs() : 0
    const events = range === 'all'
      ? eventStore.events
      : eventStore.events.filter((e) => e.timestamp >= start)

    const json = buildBackup([...events], range)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `Reset备份_${date}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    localStorage.setItem('reset-last-export', new Date().toISOString())
    return events.length
  }

  /** 从备份文件导入：替换事件流并合并设置（兼容旧备份中的 settings 字段） */
  async function handleImport(file: File): Promise<boolean> {
    const data = await importData(file)
    if (!data) return false

    eventStore.replaceEvents(data.events)
    const s = ((data as Record<string, any>).settings || {}) as {
      themeMode?: 'light' | 'dark' | 'auto'
      checkinDates?: string[]
    }
    if (s.themeMode) settingsStore.setTheme(s.themeMode)
    if (Array.isArray(s.checkinDates)) {
      settingsStore.checkinDates = s.checkinDates
      settingsStore.persist()
    }
    return true
  }

  return {
    events: ref(eventStore.events),
    error,
    handleExport,
    handleImport,
    downloadBackup,
    isExporting,
    isImporting,
  }
}
