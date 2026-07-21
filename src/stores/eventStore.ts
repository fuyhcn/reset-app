/**
 * Reset 事件 Store
 * 管理事件 CRUD、时间线计算、今日摘要
 */
import { defineStore } from 'pinia'
import type { ResetEvent, TimelineDisplay, TimelineGroup, TodaySummary, EventType, EventAction, UrgeCategory } from '@/types/event'
import { EVENT_COLORS, EVENT_ICONS, URGE_CATEGORIES, urgeCategoryLabel, urgeTriggerLabel } from '@/types/event'
import { computeSleepDay } from '@/composables/useSleepStats'
import { useSettingsStore } from '@/stores/settingsStore'

/** 生成唯一 ID */
function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** 格式化时间为 HH:MM */
function fmtTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 判断时间戳是否是今天 */
function isToday(ts: number): boolean {
  const now = new Date()
  const d = new Date(ts)
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
}

/** 获取日期标签（微信式） */
function getDateLabel(ts: number): string {
  const now = new Date()
  const d = new Date(ts)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.floor((today.getTime() - target.getTime()) / 86400000)

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays === 2) return '前天'
  if (diffDays <= 6) {
    return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  }
  // 超过一周显示日期
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

/** 掌控力：哪些动作算「忍住冲动 / 自控成功」 */
export const RESISTED_ACTIONS: EventAction[] = ['urge_resisted', 'sexual_urge', 'self_control']
/** 失控：哪些动作算「没忍住 / 破戒」 */
export const FAILED_ACTIONS: EventAction[] = ['urge_failed', 'smoked', 'sexual_failed']

const SLEEP_GOAL_MS = 7 * 3600000

function dayStartTs(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * 掌控力（累积总分，只增不减）：
 *   - 忍住冲动（RESISTED_ACTIONS：urge_resisted / sexual_urge / self_control）：每事件 +1
 *   - 运动：时长 ≥30 分钟 +2，不足 30 分钟 +1（每个运动事件）
 *   - 睡眠达标（当天时长 ≥ 7h）：每天 +1（按天去重，避免入睡/起床两条事件重复计）
 *   - 心情记录（当天任意 mood_record）：每天 +1（按天去重）
 * 不扣分（减分措施暂不做）。核心：每一次正向选择都是「恢复进度」。
 */
export function controlPowerPoints(events: ResetEvent[]): number {
  const byDay = new Map<number, ResetEvent[]>()
  for (const e of events) {
    const d = dayStartTs(e.timestamp)
    if (!byDay.has(d)) byDay.set(d, [])
    byDay.get(d)!.push(e)
  }
  let total = 0
  for (const [d, dayEvents] of byDay) {
    for (const e of dayEvents) {
      if (RESISTED_ACTIONS.includes(e.action)) total += 1
      if (e.type === 'exercise' && e.context?.duration) {
        total += e.context.duration >= 30 ? 2 : 1
      }
    }
    const sleep = computeSleepDay(events, d)
    if (sleep.has && sleep.durationMs >= SLEEP_GOAL_MS) total += 1
    if (dayEvents.some((e) => e.type === 'mood' && e.action === 'mood_record')) total += 1
  }
  return total
}

/** 将事件转为时间线显示信息 */
function toDisplay(e: ResetEvent): TimelineDisplay {
  const typeLabels: Record<EventType, string> = {
    smoke: '抽烟', exercise: '运动', sleep: '睡眠',
    sexual: '性冲动', mood: '心情', urge: '冲动', learning: '学习', weight: '体重',
  }

  const actionLabels: Record<EventAction, string> = {
    smoked: '抽了一根',
    urge_resisted: '忍住',
    urge_failed: '没忍住',
    walk: '走路', run: '跑步', cycle: '骑车',
    strength: '健身', badminton: '羽毛球', swim: '游泳',
    sleep_start: '入睡', wake_up: '起床',
    mood_record: '记录心情',
    sexual_normal: '正常', sexual_urge: '冲动控制',
    sexual_failed: '冲动', self_control: '自控',
    weight_record: '记录体重',
  }

  let badge: string | undefined
  let badgeType: 'success' | 'neutral' | 'warn' | undefined

  if (e.action === 'urge_resisted') {
    badge = '已克制'
    badgeType = 'success'
  } else if (e.action === 'urge_failed') {
    badge = '未克制'
    badgeType = 'neutral'
  }

  let title = actionLabels[e.action] || e.action
  let iconClass = EVENT_ICONS[e.action] || 'i-ph-circle'
  let color = EVENT_COLORS[e.type]
  let desc: string | undefined

  const detail: Record<string, string> = {
    '时间': fmtTime(e.timestamp),
    '类型': typeLabels[e.type] || e.type,
  }

  if (e.type === 'urge' && e.context?.category) {
    // 酒色财气冲动：标题 = 类别·诱因
    const cat = e.context.category
    const catLabel = urgeCategoryLabel(cat)
    const trigLabel = urgeTriggerLabel(cat, e.context.urgeTrigger || '')
    title = `${catLabel}·${trigLabel}`
    const catDef = URGE_CATEGORIES.find((c) => c.key === cat)
    if (catDef) { iconClass = catDef.icon; color = catDef.color }
    detail['类别'] = catLabel
    detail['诱因'] = trigLabel
    detail['结果'] = e.action === 'urge_resisted' ? '已克制' : '未克制'
    if (e.context.note) detail['备注'] = e.context.note
    desc = e.context.note || (e.action === 'urge_resisted' ? '稳住了' : '没忍住')
  } else if (e.type === 'smoke' && (e.action === 'urge_resisted' || e.action === 'urge_failed')) {
    // 烟瘾（仍是抽烟类）
    title = '特别想抽'
    iconClass = 'i-ph-cigarette'
    color = EVENT_COLORS.smoke
    detail['结果'] = e.action === 'urge_resisted' ? '忍住' : '没忍住'
    if (e.context?.note) detail['备注'] = e.context.note
    desc = e.action === 'urge_resisted' ? '忍住了' : '没忍住，抽了一根'
  } else {
    if (e.context?.duration) {
      desc = `${e.context.duration}分钟${e.context.feeling ? ` · ${e.context.feeling}` : ''}`
    } else if (e.context?.mood) {
      const moods = ['', '很差', '不太好', '一般', '还不错', '很好']
      desc = moods[e.context.mood] || ''
    } else if (e.context?.weight) {
      const unit = e.context.weightUnit === 'jin' ? '斤' : 'kg'
      desc = `${e.context.weight}${unit}`
    } else if (e.context?.trigger) {
      desc = e.context.trigger
    }
    if (e.action.includes('walk') || e.action === 'run' || e.action === 'cycle' ||
        e.action === 'strength' || e.action === 'badminton' || e.action === 'swim') {
      detail['运动类型'] = actionLabels[e.action] || e.action
    }
    if (e.context?.duration) detail['时长'] = `${e.context.duration}分钟`
    if (e.context?.weight) detail['重量'] = `${e.context.weight}${e.context.weightUnit === 'jin' ? '斤' : 'kg'}`
    if (e.context?.trigger) detail['诱因'] = e.context.trigger
    if (e.action === 'urge_resisted' || e.action === 'urge_failed') {
      detail['结果'] = e.action === 'urge_resisted' ? '已克制' : '未克制'
    }
    if (e.context?.note) detail['备注'] = e.context.note
  }

  return {
    id: e.id,
    timestamp: e.timestamp,
    time: fmtTime(e.timestamp),
    type: e.type,
    action: e.action,
    title,
    desc,
    badge,
    badgeType,
    iconClass,
    color,
    detail,
  }
}

/** localStorage 持久化 key */
const STORAGE_KEY = 'reset-events'

function loadEvents(): ResetEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function saveEvents(events: ResetEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
}

export const useEventStore = defineStore('events', {
    state: () => ({
    events: loadEvents() as ResetEvent[],
    exerciseGoal: 150,
  }),

  getters: {
    todayEvents(): ResetEvent[] {
      return this.events.filter(e => isToday(e.timestamp))
        .sort((a, b) => b.timestamp - a.timestamp)
    },

    /** 最近 30 天的所有事件，按时间倒序 */
    recentEvents(): ResetEvent[] {
      const cutoff = Date.now() - 30 * 86400000
      return this.events
        .filter(e => e.timestamp >= cutoff)
        .sort((a, b) => b.timestamp - a.timestamp)
    },

    timeline(): TimelineDisplay[] {
      return this.recentEvents.map(toDisplay)
    },

    /** 按天分组的时间线（微信式日期分隔） */
    groupedTimeline(): TimelineGroup[] {
      const items = this.timeline
      if (!items.length) return []

      const groups: TimelineGroup[] = []
      let currentLabel = ''
      let currentItems: TimelineDisplay[] = []

      for (const item of items) {
        const label = getDateLabel(item.timestamp)
        if (label !== currentLabel) {
          if (currentItems.length) {
            groups.push({ dateLabel: currentLabel, items: currentItems })
          }
          currentLabel = label
          currentItems = [item]
        } else {
          currentItems.push(item)
        }
      }
      if (currentItems.length) {
        groups.push({ dateLabel: currentLabel, items: currentItems })
      }

      return groups
    },

    summary(): TodaySummary {
      const today = this.todayEvents
      const smokeCount = today.filter(e => e.type === 'smoke' && (e.action === 'smoked' || e.action === 'urge_failed')).length
      const exerciseMinutes = today
        .filter(e => e.type === 'exercise' && e.context?.duration)
        .reduce((sum, e) => sum + (e.context?.duration || 0), 0)

      const sleepStat = computeSleepDay(this.events, Date.now())
      const sleepHas = sleepStat.has
      const sleepHours = Math.floor(sleepStat.durationMs / 3600000)
      const sleepMinutes = Math.floor((sleepStat.durationMs % 3600000) / 60000)

      return {
        smokeCount,
        smokeGoal: useSettingsStore().dailySmokeGoal,
        exerciseMinutes,
        exerciseGoal: this.exerciseGoal,
        sleepHours,
        sleepMinutes,
        sleepHas,
        sleepTime: sleepStat.sleepStart ? fmtTime(sleepStat.sleepStart) : undefined,
        wakeTime: sleepStat.wakeUp ? fmtTime(sleepStat.wakeUp) : undefined,
        controlPower: controlPowerPoints(this.events),
      }
    },

    isEmpty(): boolean {
      return this.todayEvents.length === 0
    },
  },

  actions: {
    /** 添加事件 */
    addEvent(event: Omit<ResetEvent, 'id' | 'createdAt'>): ResetEvent {
      const newEvent: ResetEvent = {
        ...event,
        id: genId(),
        createdAt: Date.now(),
      }
      this.events.push(newEvent)
      saveEvents(this.events)
      return newEvent
    },

    /** 快速记录：抽烟 */
    recordSmoke(trigger?: string): ResetEvent {
      return this.addEvent({
        timestamp: Date.now(),
        type: 'smoke',
        action: 'smoked',
        context: trigger ? { trigger } : undefined,
      })
    },

    /** 快速记录：烟瘾（仍是抽烟类） */
    recordUrge(resisted: boolean): ResetEvent {
      return this.addEvent({
        timestamp: Date.now(),
        type: 'smoke',
        action: resisted ? 'urge_resisted' : 'urge_failed',
      })
    },

    /** 快速记录：冲动（酒色财气）— 与抽烟冲动分离，避免重复 */
    recordTemptation(category: UrgeCategory, trigger: string, resisted: boolean, note?: string): ResetEvent {
      return this.addEvent({
        timestamp: Date.now(),
        type: 'urge',
        action: resisted ? 'urge_resisted' : 'urge_failed',
        context: { category, urgeTrigger: trigger, note },
      })
    },

    /** 快速记录：运动 */
    recordExercise(sport: EventAction, duration: number, feeling?: string): ResetEvent {
      return this.addEvent({
        timestamp: Date.now(),
        type: 'exercise',
        action: sport,
        context: { duration, feeling },
      })
    },

    /** 删除事件 */
    removeEvent(id: string) {
      this.events = this.events.filter(e => e.id !== id)
      saveEvents(this.events)
    },

    /** 清空全部事件历史（不可恢复，仅清数据，保留设置/目标） */
    clearAll() {
      this.events = []
      saveEvents(this.events)
    },

    /** 批量替换事件（导入备份时使用） */
    replaceEvents(events: ResetEvent[]) {
      this.events = events
      saveEvents(this.events)
    },

    /** 快速记录：心情（level 1-5，可选备注） */
    recordMood(level: number, note?: string): ResetEvent {
      return this.addEvent({
        timestamp: Date.now(),
        type: 'mood',
        action: 'mood_record',
        context: note ? { mood: level, note } : { mood: level },
      })
    },

    /** 快速记录：体重（kg/斤，默认 kg） */
    recordWeight(weight: number, unit: 'kg' | 'jin' = 'kg'): ResetEvent {
      return this.addEvent({
        timestamp: Date.now(),
        type: 'weight',
        action: 'weight_record',
        context: { weight, weightUnit: unit },
      })
    },

    /** 快速记录：睡眠（入睡 / 起床） */
    recordSleep(action: 'sleep_start' | 'wake_up'): ResetEvent {
      return this.addEvent({
        timestamp: Date.now(),
        type: 'sleep',
        action,
      })
    },

    /**
     * 快速记录：性冲动管理
     * - normal: 正常生活 (sexual_normal)
     * - urge + result=true:  冲动·已控制 (sexual_urge, 正向)
     * - urge + result=false: 冲动·未控制 (sexual_failed)
     * - control: 自控日 (self_control, 正向)
     */
    recordSexual(type: 'normal' | 'urge' | 'control', result?: boolean): ResetEvent {
      let action: EventAction = 'sexual_normal'
      if (type === 'urge') {
        action = result ? 'sexual_urge' : 'sexual_failed'
      } else if (type === 'control') {
        action = 'self_control'
      }
      return this.addEvent({
        timestamp: Date.now(),
        type: 'sexual',
        action,
      })
    },
  },
})
