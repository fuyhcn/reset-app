<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '@/stores/eventStore'
import { useToast } from '@/composables/useToast'
import PageNav from '@/components/PageNav.vue'
import WheelPicker from '@/components/WheelPicker.vue'

const router = useRouter()
const store = useEventStore()
const toast = useToast()

const unit = ref<'kg' | 'jin'>('kg')
const integer = ref(65)
const decimal = ref(0)

const displayValue = computed(() => (integer.value + decimal.value / 10).toFixed(1))
const displayUnit = computed(() => (unit.value === 'kg' ? 'kg' : '斤'))
const kgValue = computed(() => {
  const val = integer.value + decimal.value / 10
  return unit.value === 'kg' ? val : val / 2
})

const integerOptions = Array.from({ length: 171 }, (_, i) => ({
  value: i + 30,
  label: String(i + 30),
}))

const decimalOptions = Array.from({ length: 10 }, (_, i) => ({
  value: i,
  label: `.${i}`,
}))

function switchUnit(u: 'kg' | 'jin') {
  if (u === unit.value) return
  const currentKg = kgValue.value
  unit.value = u
  const target = u === 'kg' ? currentKg : currentKg * 2
  integer.value = Math.floor(target)
  decimal.value = Math.round((target - Math.floor(target)) * 10) % 10
}

function submit() {
  const ev = store.recordWeight(Number(displayValue.value), unit.value)
  toast.show(`已记录 · ${displayValue.value}${displayUnit.value}`, {
    undoAction: () => store.removeEvent(ev.id),
  })
  router.back()
}

function back() {
  router.back()
}
</script>

<template>
  <div class="page">
    <PageNav title="体重记录" :show-back="true" />

    <div class="body">
      <div class="weight-display">
        <div class="value">{{ displayValue }}</div>
        <div class="unit-group">
          <button class="unit-btn" :class="{ active: unit === 'kg' }" @click="switchUnit('kg')">kg</button>
          <button class="unit-btn" :class="{ active: unit === 'jin' }" @click="switchUnit('jin')">斤</button>
        </div>
      </div>

      <div class="hint">约 {{ kgValue.toFixed(1) }} kg</div>

      <div class="picker-row">
        <WheelPicker v-model="integer" :options="integerOptions" />
        <span class="picker-dot">.</span>
        <WheelPicker v-model="decimal" :options="decimalOptions" />
        <div class="picker-unit">{{ displayUnit }}</div>
      </div>

      <div class="actions">
        <button class="secondary" @click="back">取消</button>
        <button class="primary" @click="submit">记录</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
}

.body {
  padding: 24px 20px calc(var(--safe-bottom) + 24px);
}

.weight-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 12px;
  margin-bottom: 4px;
}

.value {
  font-size: 72px;
  font-weight: 800;
  color: var(--text);
  line-height: 1;
  letter-spacing: -2px;
  font-variant-numeric: tabular-nums;
}

.unit-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.unit-btn {
  width: 48px;
  height: 32px;
  border-radius: 16px;
  border: 0.5px solid var(--sep);
  background: var(--card);
  color: var(--text2);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.unit-btn.active {
  background: var(--text);
  color: var(--card);
  border-color: var(--text);
}

.hint {
  text-align: center;
  font-size: 14px;
  color: var(--text2);
  margin-bottom: 28px;
}

.picker-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 220px;
  margin-bottom: 32px;
}

.picker-dot {
  font-size: 24px;
  font-weight: 700;
  color: var(--text2);
  margin-top: 4px;
}

.picker-unit {
  width: 50px;
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
}

.actions {
  display: flex;
  gap: 12px;
}

.actions button {
  flex: 1;
  height: 52px;
  border-radius: 16px;
  border: none;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s;
}
.actions button:active {
  transform: scale(0.98);
}

.actions .secondary {
  background: var(--card);
  color: var(--text);
  border: 0.5px solid var(--sep);
}

.actions .primary {
  background: var(--text);
  color: var(--card);
}
</style>
