<script setup lang="ts">
import { ref, computed, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/router'
import { useEventStore } from '@/stores/eventStore'
import { useToast } from '@/composables/useToast'
import { computeSleepWeek } from '@/composables/useSleepStats'
import PageNav from '@/components/PageNav.vue'

const router = useRouter()
const store = useEventStore()
const toast = useToast()

function dayKey(ts: number): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** 最近 7 天睡眠时长（小时），按起床日归属，避免早晚串配 */
const week = computed(() => computeSleepWeek(store.events, 7))

const maxHours = 10

/** 今晚是否已记录（进入页面时与重新激活时同步真实数据） */
const recorded = ref({ start: false, wake: false })
function syncRecorded() {
  const key = dayKey(Date.now())
  recorded.value = {
    start: store.events.some(e => e.type === 'sleep' && e.action === 'sleep_start' && dayKey(e.timestamp) === key),
    wake: store.events.some(e => e.type === 'sleep' && e.action === 'wake_up' && dayKey(e.timestamp) === key),
  }
}
onActivated(syncRecorded)

function record(action: 'sleep_start' | 'wake_up') {
  const ev = store.recordSleep(action)
  const doneKey = action === 'sleep_start' ? 'start' : 'wake'
  recorded.value[doneKey] = true
  const text = action === 'sleep_start' ? '已记录 · 准备睡觉' : '已记录 · 起床'
  toast.show(text, {
    undoAction: () => {
      store.removeEvent(ev.id)
      recorded.value[doneKey] = false
    },
  })
}

function finish() {
  router.push(ROUTES.TODAY)
}
</script>

<template>
  <div class="page">
    <PageNav title="睡眠记录" :show-back="true" />

    <div class="body">
      <div class="hint">今天的休息</div>

      <button
        class="sleep-card sleep-start"
        :class="{ done: recorded.start }"
        type="button"
        @click="record('sleep_start')"
      >
        <div class="sleep-left">
          <i class="i-ph-moon" />
          <span>{{ recorded.start ? '已记录 · 准备睡觉' : '记录入睡' }}</span>
        </div>
        <i class="i-ph-caret-right sleep-arrow" />
      </button>

      <button
        class="sleep-card sleep-wake"
        :class="{ done: recorded.wake }"
        type="button"
        @click="record('wake_up')"
      >
        <div class="sleep-left">
          <i class="i-ph-sun" />
          <span>{{ recorded.wake ? '已记录 · 起床' : '记录起床' }}</span>
        </div>
        <i class="i-ph-caret-right sleep-arrow" />
      </button>

      <div v-if="recorded.start || recorded.wake" class="finish-bar">
        <button class="finish-btn" type="button" @click="finish">完成 · 返回首页</button>
      </div>

      <div class="section">
        <div class="section-label">本周睡眠</div>
        <div class="bars">
          <div v-for="(d, i) in week" :key="i" class="bar-col">
            <div class="bar-track">
              <div
                class="bar-fill"
                :class="d.hours >= 7 ? 'bar-good' : 'bar-low'"
                :style="{ height: (d.has ? Math.min(d.hours / maxHours, 1) * 100 : 0) + '%' }"
              />
            </div>
            <div class="bar-label">{{ d.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100dvh; }
.body { padding: 4px 20px 24px; }

.hint { font-size: 26px; font-weight: 700; color: var(--text); letter-spacing: -0.3px; margin: 8px 0 20px; padding-left: 4px; }

.sleep-card {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 22px 20px; border-radius: 20px; border: none; cursor: pointer;
  margin-bottom: 12px; color: #fff; font-family: inherit;
  transition: transform 0.2s var(--spring); text-align: left;
}
.sleep-card:active { transform: scale(0.98); }
.sleep-start { background: linear-gradient(135deg, #5856D6, #7B5BE0); }
.sleep-wake { background: linear-gradient(135deg, #FF9500, #FFB340); }
.sleep-card.done { opacity: 0.62; }
.sleep-left { display: flex; align-items: center; gap: 14px; font-size: 19px; font-weight: 700; }
.sleep-left i { font-size: 26px; }
.sleep-arrow { font-size: 20px; opacity: 0.8; }

.finish-bar { margin-top: 8px; }
.finish-btn {
  width: 100%; padding: 16px; border-radius: 18px; border: none; cursor: pointer;
  background: rgba(52, 199, 89, 0.12); color: var(--green);
  font-size: 16px; font-weight: 700; font-family: inherit;
  transition: transform 0.2s var(--spring);
}
.finish-btn:active { transform: scale(0.98); }

.section { margin-top: 28px; }
.section-label { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 16px; padding-left: 4px; }

.bars { display: flex; align-items: flex-end; gap: 10px; height: 140px; padding: 0 4px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; }
.bar-track { flex: 1; width: 100%; display: flex; align-items: flex-end; }
.bar-fill { width: 100%; border-radius: 8px 8px 4px 4px; transition: height 0.4s var(--spring); min-height: 2px; }
.bar-good { background: var(--green); }
.bar-low { background: var(--orange); }
.bar-label { font-size: 12px; color: var(--text2); font-weight: 500; }
</style>
