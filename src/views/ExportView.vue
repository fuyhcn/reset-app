<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import { useSessions } from '@/composables/useSessions'
import { useSettingsStore, type PromptTemplate } from '@/stores/settingsStore'
import { useToast } from '@/composables/useToast'
import { EVENT_COLORS, type EventType } from '@/types/event'
import PageNav from '@/components/PageNav.vue'

const store = useEventStore()
const settings = useSettingsStore()
const { handleExport, isExporting } = useSessions()
const toast = useToast()

const range = ref<'week' | 'all'>('week')

function weekStartTs(): number {
  const d = new Date()
  const diff = (d.getDay() + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday.getTime()
}

const eventsInRange = computed(() => {
  if (range.value === 'all') return store.events
  const s = weekStartTs()
  return store.events.filter((e) => e.timestamp >= s)
})

/** 按类型聚合预览 */
const preview = computed(() => {
  const map: Record<string, number> = {}
  for (const e of eventsInRange.value) {
    map[e.type] = (map[e.type] || 0) + 1
  }
  const typeLabels: Record<EventType, string> = {
    smoke: '抽烟', exercise: '运动', sleep: '睡眠',
    sexual: '性冲动', mood: '心情', urge: '冲动', learning: '学习', weight: '体重',
  }
  return Object.entries(map)
    .map(([type, count]) => ({ type: type as EventType, label: typeLabels[type as EventType], count, color: EVENT_COLORS[type as EventType] }))
    .sort((a, b) => b.count - a.count)
})

const lastExport = computed(() => localStorage.getItem('reset-last-export'))

async function doExport() {
  const n = await handleExport(range.value, settings.activePrompt?.content)
  toast.show(`已复制 ${n} 条记录${settings.activePrompt ? '（含提示词）' : ''}`)
}

/* ===== 提示词模板管理 ===== */
const promptOpen = ref(false)
const formOpen = ref(false)
const editing = ref<PromptTemplate | null>(null)
const formName = ref('')
const formContent = ref('')

function openManager() {
  formOpen.value = false
  editing.value = null
  promptOpen.value = true
}

function chooseActive(id: string) {
  settings.setActivePrompt(id)
}

function startAdd() {
  editing.value = null
  formName.value = ''
  formContent.value = ''
  formOpen.value = true
}

function startEdit(tpl: PromptTemplate) {
  editing.value = tpl
  formName.value = tpl.name
  formContent.value = tpl.content
  formOpen.value = true
}

function saveForm() {
  if (editing.value) {
    settings.updatePrompt(editing.value.id, { name: formName.value, content: formContent.value })
  } else {
    settings.addPrompt(formName.value, formContent.value)
  }
  formOpen.value = false
  editing.value = null
}

function removePrompt(id: string) {
  if (settings.promptTemplates.length <= 1) {
    toast.show('至少保留一个提示词')
    return
  }
  settings.deletePrompt(id)
}

const activePromptName = computed(() => settings.activePrompt?.name ?? '无')
</script>

<template>
  <div class="page">
    <PageNav title="导出数据" :show-back="true" />

    <div class="body">
      <div class="privacy">
        <i class="i-ph-lock-simple" />
        <div>
          <div class="privacy-title">数据只属于你</div>
          <div class="privacy-sub">所有记录保存在本机，复制的内容不会上传任何服务器。</div>
        </div>
      </div>

      <!-- 提示词模板 -->
      <div class="section">
        <div class="section-label">分析提示词</div>
        <button class="prompt-bar" type="button" @click="openManager">
          <div class="prompt-bar-text">
            <div class="prompt-bar-label">启用中：{{ activePromptName }}</div>
            <div class="prompt-bar-sub">导出时会拼在 JSON 前，发给 AI 分析</div>
          </div>
          <i class="i-ph-caret-right prompt-bar-arrow" />
        </button>
      </div>

      <div class="section">
        <div class="section-label">导出范围</div>
        <div class="seg">
          <button class="seg-btn" :class="{ active: range === 'week' }" type="button" @click="range = 'week'">本周</button>
          <button class="seg-btn" :class="{ active: range === 'all' }" type="button" @click="range = 'all'">全部</button>
        </div>
      </div>

      <div class="section">
        <div class="section-label">数据预览</div>
        <div class="preview-card">
          <div class="preview-total">
            <span class="total-num">{{ eventsInRange.length }}</span>
            <span class="total-unit">条事件</span>
          </div>
          <div v-if="preview.length" class="preview-list">
            <div v-for="p in preview" :key="p.type" class="preview-row">
              <span class="dot" :style="{ background: p.color }" />
              <span class="preview-label">{{ p.label }}</span>
              <span class="preview-count">{{ p.count }}</span>
            </div>
          </div>
          <div v-else class="preview-empty">还没有记录</div>
        </div>
      </div>

      <button class="export-btn" type="button" :disabled="isExporting || eventsInRange.length === 0" @click="doExport">
        <i class="i-ph-clipboard" />
        {{ isExporting ? '复制中...' : '复制到剪贴板' }}
      </button>
      <div class="export-hint">手机上复制后，直接粘贴到聊天 / 备忘录即可。</div>

      <div v-if="lastExport" class="last-export">
        上次导出：{{ new Date(lastExport).toLocaleString('zh-CN') }}
      </div>
    </div>

    <!-- 提示词管理 Sheet -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="promptOpen" class="overlay" @click="promptOpen = false" />
      </Transition>
      <Transition name="sheet">
        <div v-if="promptOpen" class="sheet">
          <div class="handle" />
          <div class="sheet-title">分析提示词</div>

          <!-- 列表 -->
          <div v-if="!formOpen" class="pm-list">
            <div
              v-for="tpl in settings.promptTemplates"
              :key="tpl.id"
              class="pm-item"
              :class="{ active: tpl.active }"
              @click="chooseActive(tpl.id)"
            >
              <div class="pm-radio"><i v-if="tpl.active" class="i-ph-check" /></div>
              <div class="pm-text">
                <div class="pm-name">{{ tpl.name }}<span v-if="tpl.active" class="pm-tag">启用中</span></div>
                <div class="pm-preview">{{ tpl.content }}</div>
              </div>
              <div class="pm-actions">
                <button class="pm-mini" type="button" @click.stop="startEdit(tpl)"><i class="i-ph-pencil-simple" /></button>
                <button class="pm-mini" type="button" @click.stop="removePrompt(tpl.id)"><i class="i-ph-trash" /></button>
              </div>
            </div>
            <button class="pm-add" type="button" @click="startAdd">
              <i class="i-ph-plus" /> 新增提示词
            </button>
          </div>

          <!-- 编辑/新增表单 -->
          <div v-else class="pm-form">
            <input v-model="formName" class="pm-input" placeholder="提示词名称" maxlength="20" />
            <textarea v-model="formContent" class="pm-textarea" placeholder="写给 AI 的分析要求…" rows="8" />
            <div class="pm-form-actions">
              <button class="pm-cancel" type="button" @click="formOpen = false">取消</button>
              <button class="pm-save" type="button" @click="saveForm">保存</button>
            </div>
          </div>

          <button class="cancel" type="button" @click="promptOpen = false">完成</button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.page { min-height: 100dvh; }
.body { padding: 12px 20px calc(var(--safe-bottom) + 24px); }

.privacy {
  display: flex; gap: 12px; align-items: flex-start;
  padding: 16px; border-radius: 16px;
  background: rgba(52, 199, 89, 0.08); border: 1px solid rgba(52, 199, 89, 0.2);
}
.privacy > i { font-size: 22px; color: var(--green); margin-top: 2px; flex-shrink: 0; }
.privacy-title { font-size: 15px; font-weight: 600; color: var(--text); }
.privacy-sub { font-size: 13px; color: var(--text2); margin-top: 4px; line-height: 1.4; }

.section { margin-top: 24px; }
.section-label { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 12px; padding-left: 4px; }

.prompt-bar {
  width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px;
  border-radius: 16px; border: 1px solid var(--sep); background: var(--card);
  cursor: pointer; text-align: left; box-shadow: var(--shadow); font-family: inherit;
}
.prompt-bar:active { transform: scale(0.99); }
.prompt-bar-text { flex: 1; min-width: 0; }
.prompt-bar-label { font-size: 15px; font-weight: 600; color: var(--text); }
.prompt-bar-sub { font-size: 12px; color: var(--text2); margin-top: 3px; line-height: 1.4; }
.prompt-bar-arrow { font-size: 18px; color: var(--text3); flex-shrink: 0; }

.seg { display: flex; background: var(--card); border-radius: 14px; padding: 4px; gap: 4px; box-shadow: var(--shadow); }
.seg-btn {
  flex: 1; padding: 10px; border: none; border-radius: 10px; background: transparent;
  font-size: 15px; font-weight: 600; color: var(--text2); cursor: pointer; font-family: inherit;
  transition: all 0.2s var(--spring);
}
.seg-btn.active { background: var(--green); color: #fff; }

.preview-card { background: var(--card); border-radius: 16px; padding: 18px; box-shadow: var(--shadow); }
.preview-total { display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px; }
.total-num { font-size: 36px; font-weight: 800; color: var(--text); letter-spacing: -1px; }
.total-unit { font-size: 14px; color: var(--text2); }
.preview-list { display: flex; flex-direction: column; }
.preview-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 0.5px solid var(--sep); }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.preview-label { flex: 1; font-size: 14px; color: var(--text); }
.preview-count { font-size: 14px; font-weight: 600; color: var(--text2); }
.preview-empty { font-size: 14px; color: var(--text2); padding: 4px 0; }

.export-btn {
  width: 100%; height: 54px; margin-top: 28px; border-radius: 16px; border: none;
  background: var(--green); color: #fff; font-size: 17px; font-weight: 600;
  font-family: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all 0.2s var(--spring);
}
.export-btn:active { transform: scale(0.97); opacity: 0.9; }
.export-btn:disabled { background: rgba(142, 142, 147, 0.12); color: var(--text3); cursor: default; }
.export-hint { font-size: 12px; color: var(--text2); text-align: center; margin-top: 10px; line-height: 1.4; }

.last-export { text-align: center; font-size: 12px; color: var(--text2); margin-top: 14px; }

/* 提示词管理 Sheet */
.overlay { position: fixed; inset: 0; background: var(--overlay); z-index: 200; }
.sheet {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px; max-height: 80dvh; overflow-y: auto;
  background: var(--sheet-bg); z-index: 210;
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-top: 1px solid var(--sheet-border);
  border-radius: 22px 22px 0 0; padding: 8px 20px calc(var(--safe-bottom) + 16px);
  display: flex; flex-direction: column; gap: 12px;
}
.handle { width: 36px; height: 5px; border-radius: 3px; margin: 4px auto 6px; background: var(--text3); opacity: 0.4; }
.sheet-title { font-size: 17px; font-weight: 600; color: var(--text); text-align: center; padding: 2px 0 4px; }

.pm-list { display: flex; flex-direction: column; gap: 10px; }
.pm-item {
  display: flex; align-items: flex-start; gap: 12px; padding: 14px;
  border-radius: 14px; border: 1.5px solid var(--sep); background: var(--bg); cursor: pointer;
}
.pm-item.active { border-color: var(--green); background: rgba(52, 199, 89, 0.06); }
.pm-radio {
  width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--sep);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;
  color: #fff; font-size: 13px;
}
.pm-item.active .pm-radio { background: var(--green); border-color: var(--green); }
.pm-text { flex: 1; min-width: 0; }
.pm-name { font-size: 15px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 8px; }
.pm-tag { font-size: 10px; font-weight: 600; color: var(--green); background: rgba(52,199,89,0.12); padding: 2px 6px; border-radius: 6px; }
.pm-preview {
  font-size: 12px; color: var(--text2); margin-top: 4px; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.pm-actions { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
.pm-mini {
  width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--sep);
  background: transparent; color: var(--text2); font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.pm-mini:active { background: var(--bg); }
.pm-add {
  width: 100%; padding: 14px; border-radius: 14px; border: 1.5px dashed var(--sep);
  background: transparent; color: var(--green); font-size: 15px; font-weight: 600;
  cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.pm-add:active { background: var(--bg); }

.pm-form { display: flex; flex-direction: column; gap: 12px; }
.pm-input {
  width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid var(--sep);
  background: var(--bg); color: var(--text); font-size: 15px; font-family: inherit;
}
.pm-input:focus { outline: none; border-color: var(--green); }
.pm-textarea {
  width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid var(--sep);
  background: var(--bg); color: var(--text); font-size: 14px; font-family: inherit; line-height: 1.5;
  resize: vertical;
}
.pm-textarea:focus { outline: none; border-color: var(--green); }
.pm-form-actions { display: flex; gap: 12px; }
.pm-cancel, .pm-save {
  flex: 1; height: 48px; border-radius: 14px; border: none; font-size: 16px; font-weight: 600;
  font-family: inherit; cursor: pointer;
}
.pm-cancel { background: var(--bg); color: var(--text2); }
.pm-save { background: var(--green); color: #fff; }
.pm-save:active, .pm-cancel:active { opacity: 0.85; }

.cancel {
  margin-top: 4px; width: 100%; height: 50px; border-radius: 16px; border: none;
  background: rgba(142, 142, 147, 0.1); color: var(--text2); font-size: 16px; font-weight: 600;
  font-family: inherit; cursor: pointer;
}
.cancel:active { opacity: 0.8; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.sheet-enter-active, .sheet-leave-active { transition: transform 0.35s var(--spring); }
.sheet-enter-from, .sheet-leave-to { transform: translateX(-50%) translateY(100%); }
</style>
