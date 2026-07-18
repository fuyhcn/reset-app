/**
 * 本地提醒调度器（无服务器方案）
 *
 * 工作原理：App 启动后启动一个 30s 轮询（应用处于前台时）。
 * 每到设定的「时:分」且当天尚未触发，就 fire 一次。
 * - 优先使用系统通知（Notification API，需授权；Android Chrome 生效）。
 * - iOS Safari 不支持 Web 通知，自动降级为应用内毛玻璃弹层。
 * - 应用从后台回到前台时立即补检一次，避免漏触发。
 */
import { useReminderStore, todayStr, type Reminder } from '@/stores/reminderStore'

interface NotificationLike {
  new (title: string, opts?: { body?: string; tag?: string }): unknown
  permission: 'default' | 'granted' | 'denied'
  requestPermission?: () => Promise<string>
}

function getNotificationCtor(): NotificationLike | null {
  return typeof Notification !== 'undefined' ? (Notification as unknown as NotificationLike) : null
}

export function useReminderScheduler() {
  const store = useReminderStore()
  let timer: number | undefined

  function fire(r: Reminder) {
    const ctor = getNotificationCtor()
    let usedSystem = false
    if (store.systemNotify && ctor && ctor.permission === 'granted') {
      try {
        new ctor(r.title, { body: r.body, tag: r.id })
        usedSystem = true
      } catch {
        usedSystem = false
      }
    }
    // 系统通知关闭 / 不可用 / 未授权 → 应用内弹层兜底
    if (!usedSystem) store.enqueue(r)
  }

  function tick() {
    const now = new Date()
    const today = todayStr(now)
    for (const r of store.reminders) {
      if (!r.enabled) continue
      if (r.lastFiredDate === today) continue
      const target = new Date()
      target.setHours(r.hour, r.minute, 0, 0)
      const diff = now.getTime() - target.getTime()
      // 落在到点的 ±60s 窗口内触发
      if (diff >= 0 && diff < 60_000) {
        store.markFired(r.id)
        fire(r)
      }
    }
  }

  function start() {
    if (timer !== undefined) return
    tick()
    timer = window.setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', onVisible)
  }

  function onVisible() {
    if (document.visibilityState === 'visible') tick()
  }

  function stop() {
    if (timer !== undefined) {
      clearInterval(timer)
      timer = undefined
    }
    document.removeEventListener('visibilitychange', onVisible)
  }

  /** 首次启用提醒时尝试申请通知权限（支持的浏览器） */
  async function requestPermission(): Promise<boolean> {
    const ctor = getNotificationCtor()
    if (!ctor || ctor.permission === 'denied') return false
    if (ctor.permission === 'granted') return true
    if (ctor.requestPermission) {
      const res = await ctor.requestPermission()
      return res === 'granted'
    }
    return false
  }

  return { start, stop, requestPermission }
}
