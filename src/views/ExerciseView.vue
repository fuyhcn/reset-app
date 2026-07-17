<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '@/stores/eventStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { EventAction } from '@/types/event'
import { useToast } from '@/composables/useToast'
import PageNav from '@/components/PageNav.vue'

const router = useRouter()
const store = useEventStore()
const settings = useSettingsStore()
const toast = useToast()

const sports = [
  { key: 'run' as EventAction, icon: 'i-ph-person-simple-run', label: '跑步', color: '#34C759', bg: 'rgba(52,199,89,0.12)' },
  { key: 'walk' as EventAction, icon: 'i-ph-person-simple-walk', label: '步行', color: '#007AFF', bg: 'rgba(0,122,255,0.12)' },
  { key: 'cycle' as EventAction, icon: 'i-ph-bicycle', label: '骑行', color: '#FF9500', bg: 'rgba(255,149,0,0.12)' },
  { key: 'strength' as EventAction, icon: 'i-ph-barbell', label: '力量', color: '#5856D6', bg: 'rgba(88,86,214,0.12)' },
  { key: 'badminton' as EventAction, icon: 'i-ph-racquet', label: '羽毛球', color: '#FF2D55', bg: 'rgba(255,45,85,0.12)' },
  { key: 'swim' as EventAction, icon: 'i-ph-drop', label: '游泳', color: '#007AFF', bg: 'rgba(0,122,255,0.12)' },
]

const feelings = [
  { key: '轻松', color: '#34C759' },
  { key: '适中', color: '#007AFF' },
  { key: '吃力', color: '#FF9500' },
  { key: '力竭', color: '#FF3B30' },
]

const sport = ref<EventAction | null>(null)
const duration = ref(settings.defaultDuration || 30)
const feeling = ref<string | null>(null)

const presets = [15, 30, 45, 60]
const currentSport = computed(() => sports.find(s => s.key === sport.value))

function selectSport(key: EventAction) {
  sport.value = sport.value === key ? null : key
}

function adjust(delta: number) {
  const next = duration.value + delta
  if (next >= 5 && next <= 180) duration.value = next
}

function submit() {
  if (!sport.value) return
  const ev = store.recordExercise(sport.value, duration.value, feeling.value || undefined)
  const label = currentSport.value?.label ?? '运动'
  const text = `已记录 · ${label} ${duration.value}分钟${feeling.value ? ' · ' + feeling.value : ''}`
  toast.show(text, { undoAction: () => store.removeEvent(ev.id) })
  router.back()
}
</script>

<template>
  <div class="page">
    <PageNav title="运动记录" :show-back="true" />

    <div class="body">
      <div class="hint">今天动一动</div>

      <div class="sport-grid">
        <button
          v-for="s in sports"
          :key="s.key"
          class="sport-btn"
          :class="{ active: sport === s.key }"
          type="button"
          @click="selectSport(s.key)"
        >
          <div class="sport-icon" :style="{ background: s.bg }">
            <i :class="s.icon" :style="{ color: s.color }" />
          </div>
          <span class="sport-label">{{ s.label }}</span>
        </button>
      </div>

      <div v-if="sport" class="section">
        <div class="section-label">运动多久？</div>
        <div class="stepper">
          <button class="step-btn" type="button" @click="adjust(-5)">
            <i class="i-ph-minus" />
          </button>
          <div class="step-value">
            <span class="step-num">{{ duration }}</span>
            <span class="step-unit">分钟</span>
          </div>
          <button class="step-btn" type="button" @click="adjust(5)">
            <i class="i-ph-plus" />
          </button>
        </div>
        <div class="presets">
          <button
            v-for="p in presets"
            :key="p"
            class="preset"
            :class="{ active: duration === p }"
            type="button"
            @click="duration = p"
          >{{ p }}分钟</button>
        </div>
      </div>

      <div v-if="sport" class="section">
        <div class="section-label">感受如何？</div>
        <div class="feeling-row">
          <button
            v-for="f in feelings"
            :key="f.key"
            class="feeling-btn"
            :class="{ active: feeling === f.key }"
            type="button"
            :style="feeling === f.key ? { borderColor: f.color, color: f.color, background: f.color + '18' } : {}"
            @click="feeling = feeling === f.key ? null : f.key"
          >
            {{ f.key }}
          </button>
        </div>
      </div>
    </div>

    <div class="done-wrap">
      <button class="done-btn" :class="{ disabled: !sport }" type="button" :disabled="!sport" @click="submit">
        <i class="i-ph-check-fat" /> 记录完成
      </button>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100dvh; }
.body { padding: 4px 20px 24px; }

.hint { font-size: 26px; font-weight: 700; color: var(--text); letter-spacing: -0.3px; margin: 8px 0 20px; padding-left: 4px; }

.sport-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.sport-btn {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 16px 4px; border-radius: 16px;
  border: 1.5px solid var(--sep); background: var(--card);
  cursor: pointer; transition: all 0.2s var(--spring);
}
.sport-btn:active { transform: scale(0.94); }
.sport-btn.active { border-color: var(--green); background: rgba(52, 199, 89, 0.06); }
.sport-icon { width: 46px; height: 46px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.sport-label { font-size: 13px; font-weight: 600; color: var(--text); }

.section { margin-top: 28px; }
.section-label { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 14px; padding-left: 4px; }

.stepper { display: flex; align-items: center; justify-content: center; gap: 24px; padding: 8px 0; }
.step-btn {
  width: 48px; height: 48px; border-radius: 50%;
  border: 1.5px solid var(--sep); background: transparent;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; color: var(--text); cursor: pointer; transition: all 0.15s ease;
}
.step-btn:active { background: var(--green); border-color: var(--green); color: #fff; }
.step-value { display: flex; flex-direction: column; align-items: center; min-width: 80px; }
.step-num { font-size: 40px; font-weight: 700; color: var(--text); line-height: 1; letter-spacing: -1px; font-variant-numeric: tabular-nums; }
.step-unit { font-size: 13px; color: var(--text2); margin-top: 4px; }

.presets { display: flex; gap: 8px; justify-content: center; margin-top: 12px; }
.preset {
  padding: 6px 14px; border-radius: 20px;
  border: 1px solid var(--sep); background: transparent;
  font-size: 13px; font-weight: 500; color: var(--text2); cursor: pointer; transition: all 0.15s ease;
}
.preset.active { background: rgba(52, 199, 89, 0.1); border-color: var(--green); color: var(--green); font-weight: 600; }

.feeling-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.feeling-btn {
  padding: 14px 4px; border-radius: 14px; border: 1.5px solid var(--sep);
  background: var(--card); font-size: 14px; font-weight: 600; color: var(--text);
  cursor: pointer; transition: all 0.2s var(--spring);
}
.feeling-btn:active { transform: scale(0.95); }

.done-wrap { padding: 16px 20px calc(var(--safe-bottom) + 16px); }
.done-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; height: 54px; border-radius: 16px; border: none;
  background: var(--green); color: #fff; font-size: 17px; font-weight: 600;
  font-family: inherit; cursor: pointer; transition: all 0.2s var(--spring);
}
.done-btn:active { transform: scale(0.97); opacity: 0.9; }
.done-btn.disabled { background: rgba(142, 142, 147, 0.12); color: var(--text3); cursor: default; pointer-events: none; }
</style>
