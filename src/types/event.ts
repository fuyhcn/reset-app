/**
 * Reset 事件系统类型定义
 * 事件优先架构 — 每一次用户操作都生成一个 Event
 */

/** 事件类型枚举 */
export type EventType =
  | 'smoke'       // 吸烟
  | 'exercise'    // 运动
  | 'sleep'       // 睡眠
  | 'sexual'      // 性冲动管理
  | 'mood'        // 心情
  | 'urge'        // 冲动（酒色财气）
  | 'learning'    // 学习
  | 'weight'      // 体重

/** 事件动作 */
export type EventAction =
  | 'smoked'          // 抽了一根
  | 'urge_resisted'   // 冲动 - 忍住了
  | 'urge_failed'     // 冲动 - 没忍住
  | 'walk' | 'run' | 'cycle' | 'strength' | 'badminton' | 'swim'  // 运动子类型
  | 'sleep_start'     // 记录睡觉
  | 'wake_up'         // 记录起床
  | 'mood_record'     // 心情记录
  | 'sexual_normal'   // 正常
  | 'sexual_urge'     // 冲动 - 控制住
  | 'sexual_failed'   // 冲动 - 没控制
  | 'self_control'    // 自控日
  | 'weight_record'   // 体重记录

/** 冲动四大类：酒色财气 */
export type UrgeCategory = 'wine' | 'sex' | 'wealth' | 'anger'

export interface UrgeTriggerDef {
  key: string
  label: string
}

/** 冲动分类（酒色财气 · 接从良） */
export const URGE_CATEGORIES: {
  key: UrgeCategory
  label: string
  icon: string
  color: string
  desc: string
}[] = [
  { key: 'wine', label: '酒', icon: 'i-ph-wine', color: '#FF9500', desc: '穿肠毒' },
  { key: 'sex', label: '色', icon: 'i-ph-heart-straight', color: '#FF2D55', desc: '刮骨刀' },
  { key: 'wealth', label: '财', icon: 'i-ph-coins', color: '#FFCC00', desc: '祸根苗' },
  { key: 'anger', label: '气', icon: 'i-ph-warning', color: '#FF3B30', desc: '雷烟炮' },
]

/** 每个分类下的具体诱因 */
export const URGE_TRIGGERS: Record<UrgeCategory, UrgeTriggerDef[]> = {
  wine: [
    { key: 'party', label: '朋友聚会' },
    { key: 'crave', label: '想喝一杯' },
    { key: 'toast', label: '应酬劝酒' },
    { key: 'alone', label: '独处想喝' },
    { key: 'celebrate', label: '庆祝/喜事' },
    { key: 'sad', label: '情绪低落' },
  ],
  sex: [
    { key: 'manual', label: '手动(自慰)' },
    { key: 'love', label: '正常爱爱' },
    { key: 'porn', label: '想看片' },
    { key: 'impulse', label: '冲动来袭' },
    { key: 'bored', label: '无聊' },
    { key: 'tired', label: '疲惫想放松' },
  ],
  wealth: [
    { key: 'spend', label: '想乱花钱' },
    { key: 'shop', label: '冲动购物' },
    { key: 'invest', label: '想投机' },
    { key: 'gamble', label: '想赌博' },
    { key: 'sale', label: '促销诱惑' },
    { key: 'peer', label: '攀比心理' },
  ],
  anger: [
    { key: 'provoked', label: '被人惹了' },
    { key: 'stress', label: '压力大' },
    { key: 'vent', label: '想发泄' },
    { key: 'irritable', label: '莫名烦躁' },
    { key: 'traffic', label: '堵车/排队' },
    { key: 'family', label: '家人/亲密关系' },
  ],
}

export function urgeCategoryLabel(category: UrgeCategory): string {
  return URGE_CATEGORIES.find((c) => c.key === category)?.label ?? category
}

export function urgeTriggerLabel(category: UrgeCategory, key: string): string {
  return URGE_TRIGGERS[category]?.find((t) => t.key === key)?.label ?? key
}

/** 核心事件接口 */
export interface ResetEvent {
  id: string
  timestamp: number
  type: EventType
  action: EventAction
  /** 附加数据 */
  data?: Record<string, string | number | boolean>
  /** 上下文 */
  context?: {
    trigger?: string    // 诱因：饭后/工作压力/社交/...
    note?: string       // 备注
    reason?: string     // 原因标签
    feeling?: string    // 运动感受
    duration?: number   // 运动时长(分钟)
    mood?: number       // 心情等级 1-5
    /** 冲动（酒色财气）分类与具体诱因 key */
    category?: UrgeCategory
    urgeTrigger?: string
    /** 体重记录：重量与单位（kg/斤） */
    weight?: number
    weightUnit?: 'kg' | 'jin'
  }
  createdAt: number
}

/** 时间线显示信息（由 store 计算） */
export interface TimelineDisplay {
  id: string
  timestamp: number     // 原始时间戳（用于日期分组）
  time: string          // HH:MM 格式
  type: EventType
  action: EventAction
  title: string         // 显示标题
  desc?: string         // 描述文字
  badge?: string        // 角标文字
  badgeType?: 'success' | 'neutral' | 'warn'
  iconClass: string     // UnoCSS 图标类名 (i-ph-xxx)
  color: string         // 主题色 hex
  detail: Record<string, string>
}

/** 日期分组（用于时间线渲染） */
export interface TimelineGroup {
  dateLabel: string     // "今天" / "昨天" / "前天" / "周二" / "7月12日"
  items: TimelineDisplay[]
}

/** 今日统计摘要 */
export interface TodaySummary {
  smokeCount: number
  smokeGoal: number
  exerciseMinutes: number
  exerciseGoal: number
  sleepHours: number
  sleepMinutes: number
  sleepTime?: string
  wakeTime?: string
  controlDays: number
}

/** 事件颜色映射 */
export const EVENT_COLORS: Record<EventType, string> = {
  smoke: '#FF3B30',
  exercise: '#34C759',
  sleep: '#5856D6',
  sexual: '#FF2D55',
  mood: '#007AFF',
  urge: '#FF9500',
  learning: '#FF9500',
  weight: '#8E8E93',
}

/** 事件图标映射 (Phosphor UnoCSS class) */
export const EVENT_ICONS: Record<string, string> = {
  smoked: 'i-ph-cigarette',
  urge_resisted: 'i-ph-flame',
  urge_failed: 'i-ph-flame',
  walk: 'i-ph-person-simple-run',
  run: 'i-ph-person-simple-run',
  cycle: 'i-ph-bicycle',
  strength: 'i-ph-barbell',
  badminton: 'i-ph-racquet',
  swim: 'i-ph-drop',
  sleep_start: 'i-ph-moon',
  wake_up: 'i-ph-sun',
  mood_record: 'i-ph-smiley',
  sexual_normal: 'i-ph-heart',
  sexual_urge: 'i-ph-heart',
  sexual_failed: 'i-ph-heart',
  self_control: 'i-ph-shield',
  weight_record: 'i-ph-scales',
}
