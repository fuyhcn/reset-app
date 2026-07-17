/**
 * 本地消息提醒 Store
 *
 * 设计目标：无服务器也能用。提醒完全本地存储（localStorage），由前台调度器轮询触发。
 * 用户可自由增删改多个提醒（如「每天 8:00 称体重」「每天 22:00 别玩手机」）。
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface Reminder {
  id: string
  title: string
  body: string
  hour: number // 0-23
  minute: number // 0-59
  enabled: boolean
  sound: boolean
  /** 最近一次触发日期 YYYY-MM-DD，用于防止同一天重复触发 */
  lastFiredDate?: string
}

const KEY = 'reset-reminders'

/** 今天的日期串（本地时区） */
export function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function uid(): string {
  return 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function load(): Reminder[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Reminder[]
  } catch {
    /* ignore */
  }
  return []
}

export const useReminderStore = defineStore('reminders', () => {
  const reminders = ref<Reminder[]>(load())
  /** 应用内待显示提醒队列（系统通知不可用 / 未授权时降级使用） */
  const pending = ref<Reminder[]>([])

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(reminders.value))
    } catch {
      /* ignore */
    }
  }
  watch(reminders, persist, { deep: true })

  function add(r: Omit<Reminder, 'id' | 'lastFiredDate'>) {
    reminders.value.push({ ...r, id: uid() })
  }
  function update(id: string, patch: Partial<Reminder>) {
    const i = reminders.value.findIndex((x) => x.id === id)
    if (i >= 0) reminders.value[i] = { ...reminders.value[i], ...patch }
  }
  function remove(id: string) {
    reminders.value = reminders.value.filter((x) => x.id !== id)
    pending.value = pending.value.filter((x) => x.id !== id)
  }
  function toggle(id: string) {
    const r = reminders.value.find((x) => x.id === id)
    if (r) r.enabled = !r.enabled
  }

  /** 调度器标记某提醒今天已触发，避免重复 */
  function markFired(id: string) {
    const r = reminders.value.find((x) => x.id === id)
    if (r) r.lastFiredDate = todayStr()
  }

  /** 入应用内弹层队列 */
  function enqueue(r: Reminder) {
    if (!pending.value.find((x) => x.id === r.id)) pending.value.push(r)
  }
  function dismiss(id: string) {
    pending.value = pending.value.filter((x) => x.id !== id)
  }

  return { reminders, pending, add, update, remove, toggle, markFired, enqueue, dismiss }
})
