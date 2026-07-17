<script setup lang="ts">
import { computed } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import { computeRecovery } from '@/composables/useRecovery'

interface Summary {
  smokeCount: number
  smokeGoal: number
  exerciseMinutes: number
  exerciseGoal: number
  sleepHours: number
  sleepMinutes: number
  sleepHas: boolean
  controlDays: number
}

const props = defineProps<{
  summary: Summary
}>()

const store = useEventStore()
// 恢复指数：基于近 7 天，有参考意义（非考核）
const score = computed(() => computeRecovery(store.events, 7).score)

const band = computed(() => {
  const s = score.value
  if (s >= 80) return '状态很稳'
  if (s >= 60) return '正在恢复'
  if (s >= 40) return '慢慢来'
  return '刚刚开始'
})

function sleepText() {
  if (props.summary.sleepHours > 0) {
    const h = props.summary.sleepHours
    const m = props.summary.sleepMinutes
    return m > 0 ? `${h}小时${m}分` : `${h}小时`
  }
  if (props.summary.sleepHas) return '已记录'
  return '未记录'
}
</script>

<template>
  <section class="snapshot">
    <div class="header">
      <div class="label">今日恢复状态</div>
      <div class="status">
        <span>{{ band }}</span>
        🌱
      </div>
    </div>

    <div class="score">
      <strong>{{ score }}</strong>
      <span>恢复指数</span>
    </div>

    <div class="divider" />

    <div class="grid">
      <div class="metric">
        <div class="icon smoke"><i class="i-ph-cigarette" /></div>
        <div>
          <label>吸烟</label>
          <p>{{ summary.smokeCount }}<span>/{{ summary.smokeGoal }}支</span></p>
        </div>
      </div>

      <div class="metric">
        <div class="icon sport"><i class="i-ph-person-simple-run" /></div>
        <div>
          <label>运动</label>
          <p>{{ summary.exerciseMinutes }}<span>分钟</span></p>
        </div>
      </div>

      <div class="metric">
        <div class="icon sleep"><i class="i-ph-moon" /></div>
        <div>
          <label>睡眠</label>
          <p>{{ sleepText() }}</p>
        </div>
      </div>

      <div class="metric">
        <div class="icon heart"><i class="i-ph-heart" /></div>
        <div>
          <label>掌控</label>
          <p>{{ summary.controlDays }}<span>天</span></p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.snapshot {
  margin: 0 24px 32px;
  padding: 24px;
  border-radius: 32px;
  background: var(--card);
  box-shadow: var(--shadow);
}

.label { font-size: 14px; color: var(--text2); }

.status {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 700;
  display: flex;
  gap: 8px;
  align-items: center;
}

.score {
  margin-top: 18px;
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.score strong {
  font-size: 72px;
  line-height: 1;
  letter-spacing: -4px;
  font-weight: 800;
}

.score span { font-size: 15px; color: var(--text2); }

.divider {
  height: 1px;
  background: var(--sep);
  margin: 24px 0;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px 12px;
}

.metric {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.smoke { background: rgba(255, 59, 48, 0.12); color: #FF3B30; }
.sport { background: rgba(52, 199, 89, 0.12); color: #34C759; }
.sleep { background: rgba(88, 86, 214, 0.12); color: #5856D6; }
.heart { background: rgba(255, 45, 85, 0.12); color: #FF2D55; }

html.dark .smoke { background: rgba(255, 59, 48, 0.22); }
html.dark .sport { background: rgba(52, 199, 89, 0.22); }
html.dark .sleep { background: rgba(88, 86, 214, 0.22); }
html.dark .heart { background: rgba(255, 45, 85, 0.22); }

label { display: block; font-size: 12px; color: var(--text2); }

.metric p {
  margin: 3px 0 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.metric p span {
  font-size: 12px;
  font-weight: 500;
  color: var(--text2);
}
</style>
