/**
 * 备份 composable
 * - buildBackup：把事件 + 设置序列化为 JSON 字符串（不再直接下载文件，由调用方决定复制/保存）。
 * - importData：解析并校验备份文件，返回结构化数据，由调用方负责写入。
 */
import { ref } from 'vue'
import type { BackupData } from '@/types/backup'
import type { ResetEvent } from '@/types/event'
import { CURRENT_BACKUP_VERSION } from '@/types/backup'

export function useBackup() {
  const isImporting = ref(false)
  const error = ref<string | null>(null)

  /** 构建备份 JSON 字符串（仅数据，不含设置） */
  function buildBackup(
    events: ResetEvent[],
    range: 'week' | 'all' = 'all',
  ): string {
    const backup: BackupData = {
      version: CURRENT_BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      appName: 'Reset',
      range,
      events,
    }
    return JSON.stringify(backup, null, 2)
  }

  /** 解析并校验备份文件，返回结构化数据（不直接写入） */
  async function importData(file: File): Promise<BackupData | null> {
    try {
      isImporting.value = true
      error.value = null

      const text = await file.text()
      const data = JSON.parse(text) as BackupData

      // 🔒 三重安全校验
      if (data.appName !== 'Reset') throw new Error('非 Reset 应用备份文件')
      if (typeof data.version !== 'number') throw new Error('备份文件格式无效')
      if (!Array.isArray(data.events)) throw new Error('事件数据缺失或格式错误')

      return data
    } catch (e) {
      error.value = e instanceof Error ? e.message : '导入失败，请确认文件完整性'
      return null
    } finally {
      isImporting.value = false
    }
  }

  return { buildBackup, importData, isImporting, error }
}
