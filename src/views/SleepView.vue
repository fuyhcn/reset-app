<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/router'
import { useEventStore } from '@/stores/eventStore'
import { useToast } from '@/composables/useToast'
import { computeSleepWeek } from '@/composables/useSleepStats'
import PageNav from '@/components/PageNav.vue'

const router = useRouter()
const store = useEventStore()
const toast = useToast()

/** 最近 7 天睡眠时长（小时），按起床日归属，避免早晚串配 */
const week = computed(() => computeSleepWeek(store.events, 7))
const maxHours = 10

/** 当前睡眠状态：更自然地把“入睡→起床”视为一个连续会话 */
const sleepState = computed(() => {
  const list = store.events
    .filter(e => e.type === 'sleep' && (e.action === 'sleep_start' || e.action === 'wake_up'))
    .sort((a, b) => a.timestamp - b.timestamp)

  if (!list.length) return { phase: 'idle' as const }

  const last = list[list.length - 1]
  if (last.action === 'sleep_start') {
    return { phase: 'sleeping' as const, startTs: last.timestamp }
  }
  return { phase: 'awake' as const, wakeTs: last.timestamp }
})

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDateTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  const prefix = isYesterday ? '昨晚 ' : ''
  return `${prefix}${formatTime(ts)}`
}

function record(action: 'sleep_start' | 'wake_up') {
  const ev = store.recordSleep(action)
  const text = action === 'sleep_start' ? '已记录入睡' : '已记录起床'
  toast.show(text, {
    undoAction: () => store.removeEvent(ev.id),
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

      <!-- 状态 1：正在睡觉 —— 只能起床 -->
      <template v-if="sleepState.phase === 'sleeping'">
        <div class="status-card sleeping">
          <i class="i-ph-moon status-icon" />
          <div class="status-title">正在休息</div>
          <div class="status-sub">{{ formatDateTime(sleepState.startTs) }} 入睡</div>
        </div>

        <button
          class="main-btn wake"
          type="button"
          @click="record('wake_up')"
        >
          <div class="btn-left">
            <i class="i-ph-sun" />
            <span>记录起床</span>
          </div>
          <i class="i-ph-caret-right btn-arrow" />
        </button>

        <button class="ghost-btn" type="button" @click="record('sleep_start')">
          重新记录入睡（覆盖当前入睡时间）
        </button>
      </template>

      <!-- 状态 2：已起床/未睡觉 —— 只能入睡 -->
      <template v-else>
        <div v-if="sleepState.phase === 'awake'" class="status-card awake">
          <i class="i-ph-sun status-icon" />
          <div class="status-title">今日已起床</div>
          <div class="status-sub">{{ formatTime(sleepState.wakeTs) }} 醒来</div>
        </div>

        <button
          class="main-btn sleep"
          type="button"
          @click="record('sleep_start')"
        >
          <div class="btn-left">
            <i class="i-ph-moon" />
            <span>{{ sleepState.phase === 'awake' ? '再记一段入睡' : '记录入睡' }}</span>
          </div>
          <i class="i-ph-caret-right btn-arrow" />
        </button>

        <button class="ghost-btn" type="button" @click="record('wake_up')">
          先记录起床（忘记昨晚入睡）
        </button>
      </template>

      <button class="finish-btn" type="button" @click="finish">完成 · 返回首页</button>

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

.status-card {
  width: 100%;
  padding: 24px 20px;
  border-radius: 24px;
  text-align: center;
  margin-bottom: 16px;
  color: #fff;
}
.status-card.sleeping {
  background: linear-gradient(135deg, #5856D6, #7B5BE0);
}
.status-card.awake {
  background: linear-gradient(135deg, #FF9500, #FFB340);
}
.status-icon { font-size: 36px; margin-bottom: 10px; }
.status-title { font-size: 20px; font-weight: 700; }
.status-sub { font-size: 14px; opacity: 0.85; margin-top: 4px; }

.main-btn {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 22px 20px; border-radius: 20px; border: none; cursor: pointer;
  margin-bottom: 12px; color: #fff; font-family: inherit;
  transition: transform 0.2s var(--spring); text-align: left;
}
.main-btn:active { transform: scale(0.98); }
.main-btn.sleep { background: linear-gradient(135deg, #5856D6, #7B5BE0); }
.main-btn.wake { background: linear-gradient(135deg, #FF9500, #FFB340); }
.btn-left { display: flex; align-items: center; gap: 14px; font-size: 19px; font-weight: 700; }
.btn-left i { font-size: 26px; }
.btn-arrow { font-size: 20px; opacity: 0.8; }

.ghost-btn {
  display: block;
  width: 100%;
  padding: 12px 4px;
  border: none;
  background: transparent;
  color: var(--text2);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  margin-bottom: 16px;
}

.finish-btn {
  width: 100%; padding: 16px; border-radius: 18px; border: none; cursor: pointer;
  background: rgba(52, 199, 89, 0.12); color: var(--green);
  font-size: 16px; font-weight: 700; font-family: inherit;
  transition: transform 0.2s var(--spring);
  margin-bottom: 28px;
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
