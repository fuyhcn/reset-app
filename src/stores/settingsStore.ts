/**
 * Reset 设置 Store
 * 管理主题模式、每日打卡数据、默认运动时长、以及给 AI 用的提示词模板。
 * 持久化到 localStorage (key: reset-settings)
 */
import { defineStore } from 'pinia'

/** 主题模式：浅色 / 深色 / 跟随系统 */
export type ThemeMode = 'light' | 'dark' | 'auto'

/** 提示词模板：用于导出数据时拼接到 JSON 前，交给 AI 分析 */
export interface PromptTemplate {
  id: string
  name: string
  content: string
  active: boolean
}

const STORAGE_KEY = 'reset-settings'

interface SettingsState {
  themeMode: ThemeMode
  checkinDates: string[]
  /** 默认运动时长（分钟），用于首页快速记录运动 */
  defaultDuration: number
  /** 每日抽烟目标（支），用于首页抽烟看板与恢复指数 */
  dailySmokeGoal: number
  /** 提示词模板（仅一个启用） */
  promptTemplates: PromptTemplate[]
  /** 首页时间线是否锁定：锁定后点击事件卡片不弹窗编辑 */
  timelineLocked: boolean
}

/** 生成唯一 ID */
function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const DEFAULT_PROMPT = `你是一位温和、不评判的生活教练。下面是我导出的日常修行记录（JSON）。请帮我：
1. 用鼓励而非指责的语气总结这段时间的状态；
2. 指出 1-3 个可以温和改进的小习惯；
3. 如果某天冲动没忍住，不要贴标签，只帮我看到诱因；
4. 不超过 300 字。`

function defaultPrompts(): PromptTemplate[] {
  return [{ id: genId(), name: '通用分析', content: DEFAULT_PROMPT, active: true }]
}

/** 读取持久化设置 */
function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const prompts = Array.isArray(parsed.promptTemplates) && parsed.promptTemplates.length
        ? parsed.promptTemplates
        : defaultPrompts()
      // 保证只有一个启用
      const hasActive = prompts.some((p: PromptTemplate) => p.active)
      if (!hasActive && prompts[0]) prompts[0].active = true
      return {
        themeMode: parsed.themeMode === 'light' || parsed.themeMode === 'dark' || parsed.themeMode === 'auto'
          ? parsed.themeMode
          : 'auto',
        checkinDates: Array.isArray(parsed.checkinDates) ? parsed.checkinDates : [],
        defaultDuration: typeof parsed.defaultDuration === 'number' ? parsed.defaultDuration : 30,
        dailySmokeGoal: typeof parsed.dailySmokeGoal === 'number' ? parsed.dailySmokeGoal : 10,
        promptTemplates: prompts,
        timelineLocked: typeof parsed.timelineLocked === 'boolean' ? parsed.timelineLocked : false,
      }
    }
  } catch {
    /* 解析失败则回落到默认值 */
  }
  return { themeMode: 'auto', checkinDates: [], defaultDuration: 30, dailySmokeGoal: 10, promptTemplates: defaultPrompts(), timelineLocked: false }
}

/** 本地日期 YYYY-MM-DD（打卡以本地日为准，不补打） */
function todayStr(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export const useSettingsStore = defineStore('settings', {
  state: () => loadSettings(),

  getters: {
    /** 今天是否已打卡 */
    isCheckedInToday(state): boolean {
      return state.checkinDates.includes(todayStr())
    },

    /** 连续打卡天数（从今天往前数，断签即止；今天未打卡不计断签） */
    checkinStreak(state): number {
      const dates = new Set(state.checkinDates)
      let streak = 0
      const d = new Date()
      for (let i = 0; i < 365; i++) {
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const key = `${d.getFullYear()}-${m}-${day}`
        if (dates.has(key)) {
          streak++
        } else if (i > 0) {
          // 今天还没打卡不算断签，从昨天起断签才停止
          break
        }
        d.setDate(d.getDate() - 1)
      }
      return streak
    },

    /** 当前启用的提示词（列表第一条默认启用） */
    activePrompt(state): PromptTemplate | null {
      const active = state.promptTemplates.find((p) => p.active)
      if (active) return active
      return state.promptTemplates[0] ?? null
    },
  },

  actions: {
    /** 设置主题模式（仅持久化，类名的增删由 useTheme 负责） */
    setTheme(mode: ThemeMode) {
      this.themeMode = mode
      this.persist()
    },

    /** 打卡今天（已打卡则忽略） */
    checkinToday() {
      const key = todayStr()
      if (!this.checkinDates.includes(key)) {
        this.checkinDates.push(key)
        this.persist()
      }
    },

    /** 设置默认运动时长（分钟） */
    setDefaultDuration(min: number) {
      this.defaultDuration = min
      this.persist()
    },

    /** 设置每日抽烟目标（支） */
    setDailySmokeGoal(n: number) {
      this.dailySmokeGoal = n
      this.persist()
    },

    /** 切换首页时间线锁定状态 */
    toggleTimelineLock() {
      this.timelineLocked = !this.timelineLocked
      this.persist()
    },

    /** 新增提示词模板（列表为空时自动启用） */
    addPrompt(name: string, content: string): PromptTemplate {
      const tpl: PromptTemplate = {
        id: genId(),
        name: name.trim() || '未命名提示词',
        content,
        active: this.promptTemplates.length === 0,
      }
      this.promptTemplates.push(tpl)
      this.persist()
      return tpl
    },

    /** 修改提示词模板 */
    updatePrompt(id: string, patch: Partial<Pick<PromptTemplate, 'name' | 'content'>>) {
      const tpl = this.promptTemplates.find((p) => p.id === id)
      if (tpl) {
        if (patch.name !== undefined) tpl.name = patch.name
        if (patch.content !== undefined) tpl.content = patch.content
        this.persist()
      }
    },

    /** 删除提示词模板；若删掉的是启用项，则启用列表第一条 */
    deletePrompt(id: string) {
      const idx = this.promptTemplates.findIndex((p) => p.id === id)
      if (idx === -1) return
      const wasActive = this.promptTemplates[idx].active
      this.promptTemplates.splice(idx, 1)
      if (wasActive && this.promptTemplates.length) {
        this.promptTemplates[0].active = true
      }
      this.persist()
    },

    /** 设置启用的提示词（保证只有一个启用） */
    setActivePrompt(id: string) {
      let changed = false
      for (const p of this.promptTemplates) {
        const shouldActive = p.id === id
        if (p.active !== shouldActive) changed = true
        p.active = shouldActive
      }
      if (changed) this.persist()
    },

    /** 写入 localStorage */
    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          themeMode: this.themeMode,
          checkinDates: this.checkinDates,
          defaultDuration: this.defaultDuration,
          dailySmokeGoal: this.dailySmokeGoal,
          promptTemplates: this.promptTemplates,
          timelineLocked: this.timelineLocked,
        }),
      )
    },
  },
})
