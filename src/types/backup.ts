import type { ResetEvent } from '@/types/event'

/** 备份数据结构（导出 / 导入，仅包含事件数据） */
export interface BackupData {
  version: number
  exportedAt: string
  appName: 'Reset'
  /** 导出范围 */
  range?: 'week' | 'all'
  /** 事件流（替代旧 sessions 结构） */
  events: ResetEvent[]
}

export const CURRENT_BACKUP_VERSION = 1
