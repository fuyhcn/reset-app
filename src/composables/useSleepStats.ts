import type { ResetEvent } from '@/types/event'

/** 某一天的睡眠统计 */
export interface SleepDayStat {
  /** 当天是否有睡眠相关记录（入睡/起床任一） */
  has: boolean
  /** 归属于当天的累计睡眠时长（毫秒） */
  durationMs: number
  /** 配对到的入睡时间戳 */
  sleepStart?: number
  /** 配对到的起床时间戳 */
  wakeUp?: number
}

/** 返回时间戳所在本地日期的 0 点 */
function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** 格式化睡眠时长为 "x小时" / "x小时y分" */
export function formatSleepDuration(ms: number): string {
  if (ms <= 0) return ''
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (m === 0) return `${h}小时`
  return `${h}小时${m}分`
}

/**
 * 计算某一天的睡眠统计。
 *
 * 配对规则（常识防串）：
 * - 以「起床」为归属日：一次入睡(sleep_start)与它之后第一次起床(wake_up)配对。
 * - 上床时间可能在前一天，起床时间在当天，时长算到当天。
 * - 不允许把一天早上的起床和当天晚上的入睡配对（入睡在起床之后，不会与前面的起床配对）。
 * - 同一天的午睡（入睡后起床）也会正常配对。
 *
 * 返回的 has 表示当天是否有睡眠记录：
 * - 当天有入睡或起床记录 → true
 * - 仅入睡未起床 / 仅起床未配对入睡 → 仍视为已记录，但 durationMs = 0
 */
export function computeSleepDay(events: ResetEvent[], dateMs: number): SleepDayStat {
  const dayStart = startOfDay(dateMs)
  const dayEnd = dayStart + 86400000

  const sleepEvents = events
    .filter((e) => e.type === 'sleep' && (e.action === 'sleep_start' || e.action === 'wake_up'))
    .sort((a, b) => a.timestamp - b.timestamp)

  let durationMs = 0
  let sleepStartTs: number | undefined
  let wakeUpTs: number | undefined

  // 用栈保存尚未配对的入睡记录；每个起床只与最近一个早于它的入睡配对
  const pending: ResetEvent[] = []

  for (const e of sleepEvents) {
    if (e.action === 'sleep_start') {
      pending.push(e)
      continue
    }

    if (e.action === 'wake_up') {
      while (pending.length) {
        const start = pending.pop()!
        if (start.timestamp < e.timestamp) {
          // 有效配对
          if (e.timestamp >= dayStart && e.timestamp < dayEnd) {
            durationMs += e.timestamp - start.timestamp
            if (!sleepStartTs) {
              sleepStartTs = start.timestamp
              wakeUpTs = e.timestamp
            }
          }
          break
        }
        // 若 start.timestamp >= wakeUp.timestamp（乱序/同秒），丢弃继续往前找
      }
    }
  }

  // 判断当天是否有睡眠记录：
  // 1) 有配对到有效时长；2) 当天有入睡；3) 当天有起床
  const has =
    durationMs > 0 ||
    sleepEvents.some((e) => e.timestamp >= dayStart && e.timestamp < dayEnd)

  return { has, durationMs, sleepStart: sleepStartTs, wakeUp: wakeUpTs }
}

/** 计算最近 N 天（含今天）的睡眠统计，按日期从早到晚排列 */
export function computeSleepWeek(
  events: ResetEvent[],
  days: number,
): { label: string; hours: number; has: boolean }[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekLabels = ['日', '一', '二', '三', '四', '五', '六']

  const result: { label: string; hours: number; has: boolean }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const stat = computeSleepDay(events, d.getTime())
    result.push({
      label: weekLabels[d.getDay()],
      hours: stat.durationMs / 3600000,
      has: stat.has,
    })
  }
  return result
}
