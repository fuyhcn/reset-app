<script setup lang="ts">
/**
 * 快速记录底部 Sheet（回归文档 2.5 / 4.6 的「一次动作即完成」模型）
 * - 点击 Dock 按钮 → 弹出本 Sheet → 选择一项 → 立即记录 + Toast 撤销
 * - 冲动（第二个按钮）= 酒色财气 四大类：上方选分类，下方出具体项，点选即存
 */
import { ref, computed, watch } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useToast } from '@/composables/useToast'
import { URGE_CATEGORIES, URGE_TRIGGERS, type EventAction, type UrgeCategory } from '@/types/event'

const props = defineProps<{
  modelValue: boolean
  mode: 'smoke' | 'urge' | 'sport' | 'mood'
}>()
const emit = defineEmits<{ 'update:modelValue': [val: boolean] }>()

const store = useEventStore()
const settings = useSettingsStore()
const toast = useToast()

const close = () => emit('update:modelValue', false)

/* 抽烟页内：展开「特别想抽」的结果 */
const showUrgeSub = ref(false)
watch(() => props.modelValue, (v) => {
  if (v) {
    showUrgeSub.value = false
    urgeCat.value = null
  }
})

const sports = [
  { key: 'run' as EventAction, icon: 'i-ph-person-simple-run', label: '跑步', color: '#34C759' },
  { key: 'walk' as EventAction, icon: 'i-ph-person-simple-walk', label: '步行', color: '#007AFF' },
  { key: 'cycle' as EventAction, icon: 'i-ph-bicycle', label: '骑行', color: '#FF9500' },
  { key: 'strength' as EventAction, icon: 'i-ph-barbell', label: '力量', color: '#5856D6' },
  { key: 'badminton' as EventAction, icon: 'i-ph-racquet', label: '羽毛球', color: '#FF2D55' },
  { key: 'swim' as EventAction, icon: 'i-ph-drop', label: '游泳', color: '#007AFF' },
]

const moods = [
  { level: 5, emoji: '😁', label: '很好' },
  { level: 4, emoji: '🙂', label: '还不错' },
  { level: 3, emoji: '😐', label: '一般' },
  { level: 2, emoji: '🙁', label: '不太好' },
  { level: 1, emoji: '😣', label: '很差' },
]

const titleMap = { smoke: '抽烟', urge: '冲动', sport: '运动', mood: '心情' }
const sheetTitle = computed(() => titleMap[props.mode])

/* 冲动：酒色财气分类选择 */
const urgeCat = ref<UrgeCategory | null>(null)
function pickCat(c: UrgeCategory) {
  urgeCat.value = urgeCat.value === c ? null : c
}

/** 快速记录运动时长：直接用设置里的「默认单次运动时长」，不做历史平均（要改请在「更多」里设置） */
function recordSmoked() {
  const ev = store.recordSmoke()
  toast.show('已记录 · 抽了一根', { undoAction: () => store.removeEvent(ev.id) })
  close()
}

function recordUrge(resist: boolean) {
  const ev = store.recordUrge(resist)
  toast.show(resist ? '已记录 · 忍住了' : '已记录 · 没忍住', { undoAction: () => store.removeEvent(ev.id) })
  close()
}

function recordSport(key: EventAction, label: string) {
  const dur = settings.defaultDuration
  const ev = store.recordExercise(key, dur)
  toast.show(`已记录 · ${label} ${dur}分钟`, { undoAction: () => store.removeEvent(ev.id) })
  close()
}

function recordMood(level: number, label: string) {
  const ev = store.recordMood(level)
  toast.show(`已记录 · 心情${label}`, { undoAction: () => store.removeEvent(ev.id) })
  close()
}

function recordTempt(cat: UrgeCategory, key: string, label: string, resisted: boolean) {
  const ev = store.recordTemptation(cat, key, resisted)
  const catLabel = URGE_CATEGORIES.find((c) => c.key === cat)?.label ?? ''
  const text = resisted ? `已记录 · ${catLabel}·${label} 已克制` : `已记录 · ${catLabel}·${label} 没忍住`
  toast.show(text, { undoAction: () => store.removeEvent(ev.id) })
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="overlay" @click="close" />
    </Transition>
    <Transition name="sheet">
      <div v-if="modelValue" class="sheet">
        <div class="handle" />
        <div class="sheet-title">{{ sheetTitle }}</div>

        <!-- 抽烟：抽了一根 + 特别想抽（仍为烟瘾） -->
        <template v-if="mode === 'smoke'">
          <button class="big-btn" style="--c:#FF3B30" type="button" @click="recordSmoked">
            <i class="i-ph-cigarette" /> 抽了一根
          </button>
          <button class="big-btn" style="--c:#FF9500" type="button" @click="showUrgeSub = true">
            <i class="i-ph-flame" /> 特别想抽
          </button>
          <div v-if="showUrgeSub" class="sub">
            <div class="sub-label">结果？</div>
            <div class="sub-row">
              <button class="sub-btn ok" type="button" @click="recordUrge(true)"><i class="i-ph-check-fat" /> 忍住</button>
              <button class="sub-btn" type="button" @click="recordUrge(false)"><i class="i-ph-x" /> 没忍住</button>
            </div>
          </div>
        </template>

        <!-- 冲动（Dock 🔥）：酒色财气 上下布局，点选即存 -->
        <template v-else-if="mode === 'urge'">
          <div class="cat-grid">
            <button
              v-for="c in URGE_CATEGORIES"
              :key="c.key"
              class="cat-card"
              :class="{ active: urgeCat === c.key }"
              type="button"
              @click="pickCat(c.key)"
            >
              <div class="cat-icon" :style="{ background: c.color + '18', color: c.color }">
                <i :class="c.icon" />
              </div>
              <div class="cat-text">
                <div class="cat-label">{{ c.label }}</div>
                <div class="cat-desc">{{ c.desc }}</div>
              </div>
              <div class="cat-check"><i class="i-ph-check" /></div>
            </button>
          </div>

          <div v-if="urgeCat" class="triggers">
            <div v-for="t in URGE_TRIGGERS[urgeCat]" :key="t.key" class="trigger-card">
              <div class="trigger-label">{{ t.label }}</div>
              <div class="trigger-actions">
                <button class="t-ok" type="button" @click="recordTempt(urgeCat, t.key, t.label, true)">
                  <i class="i-ph-check-fat" /> 克制
                </button>
                <button class="t-fail" type="button" @click="recordTempt(urgeCat, t.key, t.label, false)">
                  <i class="i-ph-x" /> 没忍住
                </button>
              </div>
            </div>
          </div>
          <div v-else class="tip">先选上方类别，再点具体情形即可记录</div>
        </template>

        <!-- 运动：点类型即记录（默认时长取近期平均） -->
        <template v-else-if="mode === 'sport'">
          <div class="grid">
            <button
              v-for="s in sports"
              :key="s.key"
              class="sport-btn"
              type="button"
              @click="recordSport(s.key, s.label)"
            >
              <i :class="s.icon" :style="{ color: s.color }" />
              <span>{{ s.label }}</span>
            </button>
          </div>
          <div class="tip">点击即记录，时长取近期平均；想精确设置点「更多 → 运动」</div>
        </template>

        <!-- 心情：点表情即记录 -->
        <template v-else-if="mode === 'mood'">
          <div class="mood-row">
            <button
              v-for="m in moods"
              :key="m.level"
              class="mood-btn"
              type="button"
              @click="recordMood(m.level, m.label)"
            >
              <span class="me">{{ m.emoji }}</span>
              <span class="ml">{{ m.label }}</span>
            </button>
          </div>
        </template>

        <button class="cancel" type="button" @click="close">取消</button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay { position: fixed; inset: 0; background: var(--overlay); z-index: 200; }
.sheet {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px; z-index: 210;
  background: var(--sheet-bg);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-top: 1px solid var(--sheet-border);
  border-radius: 22px 22px 0 0; padding: 8px 20px calc(var(--safe-bottom) + 16px);
  display: flex; flex-direction: column; gap: 14px;
}
.handle {
  width: 36px; height: 5px; border-radius: 3px; margin: 4px auto 6px;
  background: var(--text3); opacity: 0.4;
}
.sheet-title {
  font-size: 17px; font-weight: 600; color: var(--text); text-align: center; padding: 2px 0 4px;
}

.big-btn {
  width: 100%; height: 60px; border-radius: 16px; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  font-size: 17px; font-weight: 600; font-family: inherit; color: #fff;
  background: var(--c); transition: transform 0.15s var(--spring), opacity 0.15s;
}
.big-btn:active { transform: scale(0.98); opacity: 0.92; }
.big-btn i { font-size: 22px; }

.sub { display: flex; flex-direction: column; gap: 10px; margin-top: 2px; }
.sub-label { font-size: 14px; font-weight: 600; color: var(--text2); text-align: center; }
.sub-row { display: flex; gap: 12px; }
.sub-btn {
  flex: 1; height: 56px; border-radius: 16px; border: 1.5px solid var(--sep);
  background: var(--card); font-size: 16px; font-weight: 600; color: var(--text);
  font-family: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: transform 0.15s var(--spring);
}
.sub-btn:active { transform: scale(0.97); }
.sub-btn.ok { background: rgba(52, 199, 89, 0.12); border-color: var(--green); color: var(--green); }
.sub-btn i { font-size: 20px; }

/* 冲动：酒色财气分类卡片 */
.cat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.cat-card {
  display: flex; align-items: center; gap: 12px;
  padding: 16px; border-radius: 18px; border: 2px solid var(--sep);
  background: var(--card); cursor: pointer; font-family: inherit; color: var(--text);
  transition: all 0.2s var(--spring); text-align: left;
}
.cat-card:active { transform: scale(0.97); }
.cat-card.active { border-color: var(--orange); background: rgba(255, 149, 0, 0.08); box-shadow: 0 0 0 1px var(--orange), var(--shadow); }
.cat-icon { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.cat-text { flex: 1; min-width: 0; }
.cat-label { font-size: 18px; font-weight: 700; }
.cat-desc { font-size: 12px; color: var(--text2); margin-top: 2px; }
.cat-check {
  width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--sep);
  display: flex; align-items: center; justify-content: center; font-size: 14px; color: #fff;
  opacity: 0; transform: scale(0.3); transition: all 0.2s var(--spring); flex-shrink: 0;
}
.cat-card.active .cat-check { opacity: 1; transform: scale(1); border-color: transparent; background: var(--orange); }

/* 冲动：具体诱因卡片 */
.triggers { display: flex; flex-direction: column; gap: 10px; max-height: 240px; overflow-y: auto; }
.trigger-card {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 14px 16px; border-radius: 16px; border: 1.5px solid var(--sep);
  background: var(--card); transition: transform 0.15s var(--spring);
}
.trigger-card:active { transform: scale(0.98); }
.trigger-label { font-size: 16px; font-weight: 600; color: var(--text); flex: 1; }
.trigger-actions { display: flex; gap: 8px; }
.t-ok, .t-fail {
  height: 38px; padding: 0 14px; border-radius: 12px; border: 1.5px solid var(--sep);
  font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer;
  display: flex; align-items: center; gap: 6px; transition: transform 0.15s var(--spring);
}
.t-ok:active, .t-fail:active { transform: scale(0.95); }
.t-ok { background: rgba(52, 199, 89, 0.1); border-color: var(--green); color: var(--green); }
.t-fail { background: transparent; color: var(--text2); }
.t-ok i, .t-fail i { font-size: 16px; }

.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.sport-btn {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 16px 4px; border-radius: 16px; border: 1.5px solid var(--sep);
  background: var(--card); cursor: pointer; font-family: inherit; color: var(--text);
  transition: transform 0.15s var(--spring);
}
.sport-btn:active { transform: scale(0.95); }
.sport-btn i { font-size: 24px; }
.sport-btn span { font-size: 13px; font-weight: 600; }

.tip { font-size: 12px; color: var(--text2); text-align: center; line-height: 1.5; }

.mood-row { display: flex; justify-content: space-between; gap: 8px; }
.mood-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 16px 4px; border-radius: 16px; border: 1.5px solid var(--sep);
  background: var(--card); cursor: pointer; font-family: inherit; color: var(--text);
  transition: transform 0.15s var(--spring);
}
.mood-btn:active { transform: scale(0.94); }
.me { font-size: 28px; line-height: 1; }
.ml { font-size: 12px; color: var(--text2); }

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
