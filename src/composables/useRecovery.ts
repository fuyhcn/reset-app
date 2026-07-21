/**
 * 恢复指数（参考意义，非考核）
 *
 * 设计原则（呼应《设计圣经》Principle 04 不评价用户 / 3.15 不游戏化）：
 * - 这是一个「给自己看的、我正在变好」的温和信号，不是考试分、不是排名。
 * - 以滚动窗口（默认 7 天 = 本周）为口径，综合 4 个维度，权重透明、可解释。
 *
 * 维度与权重：
 *   吸烟克制 30%  — 每日吸烟是否 ≤ 目标(每日抽烟目标)，达标记 1，超标线性递减
 *   运动达标 25%  — 窗口内运动总分钟 / 周目标(默认150分) 折算
 *   睡眠充足 25%  — 有睡眠记录的日子，平均时长 / 目标(7h)
 *   掌控力 20%    — 窗口内「掌控力积分」/ 周目标(14 分 ≈ 每天 2 分)
 * 某项完全无记录时取 0，避免「无数据却显示 50%」带来的误解。
 */
import type { ResetEvent } from '@/types/event'
import { computeSleepDay } from './useSleepStats'
import { useSettingsStore } from '@/stores/settingsStore'
import { controlPowerPoints } from '@/stores/eventStore'

export interface RecoveryPart {
  key: string
  label: string
  ratio: number // 0..1
  weight: number
  color: string
  detail: string
}

export interface RecoveryResult {
  score: number // 0..100
  parts: RecoveryPart[]
  windowDays: number
}

const SLEEP_GOAL = 7

function dayStart(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function computeRecovery(events: ResetEvent[], windowDays = 7): RecoveryResult {
  const settings = useSettingsStore()
  const smokeGoal = settings.dailySmokeGoal
  const weeklyExerciseGoal = settings.weeklyExerciseGoal
  const todayStart = dayStart(Date.now())
  const start = todayStart - (windowDays - 1) * 86400000
  const end = todayStart + 86400000

  const win = events.filter((e) => e.timestamp >= start && e.timestamp < end)

  // 按天分桶
  const buckets: ResetEvent[][] = []
  for (let i = 0; i < windowDays; i++) {
    const ds = start + i * 86400000
    buckets.push(win.filter((e) => e.timestamp >= ds && e.timestamp < ds + 86400000))
  }

  // 1) 吸烟克制
  let smokeSum = 0
  let smokeDays = 0
  for (const day of buckets) {
    const cnt = day.filter((e) => e.type === 'smoke' && e.action === 'smoked').length
    if (cnt > 0) smokeDays++
    const comp = cnt <= smokeGoal ? 1 : Math.max(0, 1 - (cnt - smokeGoal) / smokeGoal)
    smokeSum += comp
  }
  const smokeRatio = smokeDays === 0 ? 0 : smokeSum / windowDays

  // 2) 运动达标：窗口内运动总分钟 / 周目标（窗口不足 7 天按比例折算）
  const totalMin = win
    .filter((e) => e.type === 'exercise' && e.context?.duration)
    .reduce((s, e) => s + (e.context?.duration || 0), 0)
  const exerciseTarget = weeklyExerciseGoal * (windowDays / 7)
  const exerciseRatio = totalMin === 0 ? 0 : Math.min(1, totalMin / exerciseTarget)

  // 3) 睡眠充足：按「起床归属日」计算每天睡眠，避免把今早起床和今晚入睡串配
  let sleepSum = 0
  let sleepDays = 0
  for (let i = 0; i < windowDays; i++) {
    const ds = start + i * 86400000
    const stat = computeSleepDay(events, ds)
    if (stat.has && stat.durationMs > 0) {
      const h = stat.durationMs / 3600000
      sleepSum += Math.min(1, h / SLEEP_GOAL)
      sleepDays++
    } else if (stat.has) {
      // 有记录但尚未起床，按 0 处理（不构成睡眠充足）
      sleepDays++
    }
  }
  const sleepRatio = sleepDays === 0 ? 0 : sleepSum / sleepDays

  // 4) 掌控力：窗口内累积掌控力积分 / 周目标（14 分 ≈ 每天 2 分），只增不减、不扣分
  const weeklyControlPoints = controlPowerPoints(win)
  const WEEKLY_CONTROL_GOAL = 14
  const controlRatio = Math.min(1, weeklyControlPoints / WEEKLY_CONTROL_GOAL)

  const parts: RecoveryPart[] = [
    {
      key: 'smoke',
      label: '吸烟克制',
      ratio: smokeRatio,
      weight: 0.3,
      color: '#FF3B30',
      detail: smokeDays === 0 ? '本周暂无吸烟记录' : `${smokeDays} 天达标`,
    },
    {
      key: 'exercise',
      label: '运动达标',
      ratio: exerciseRatio,
      weight: 0.25,
      color: '#34C759',
      detail: totalMin === 0 ? '本周暂无运动记录' : `共 ${totalMin} / ${weeklyExerciseGoal} 分钟`,
    },
    {
      key: 'sleep',
      label: '睡眠充足',
      ratio: sleepRatio,
      weight: 0.25,
      color: '#5856D6',
      detail: sleepDays === 0 ? '本周暂无睡眠记录' : `${sleepDays} 天达标`,
    },
    {
      key: 'control',
      label: '掌控力',
      ratio: controlRatio,
      weight: 0.2,
      color: '#FF2D55',
      detail: `本周 +${weeklyControlPoints} 分`,
    },
  ]

  const score = Math.round(100 * parts.reduce((s, p) => s + p.ratio * p.weight, 0))
  return {
    score: Math.max(0, Math.min(100, score)),
    parts,
    windowDays,
  }
}
