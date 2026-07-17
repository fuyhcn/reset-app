<script setup lang="ts">
/**
 * 体重记录 Sheet
 * - 数字轮盘选择重量（整数 + 小数）
 * - 单位切换：kg / 斤，默认 kg
 * - 点「记录」即保存，并显示撤销 Toast
 */
import { ref, computed } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import { useToast } from '@/composables/useToast'
import WheelPicker from '@/components/WheelPicker.vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [val: boolean] }>()

const store = useEventStore()
const toast = useToast()

const unit = ref<'kg' | 'jin'>('kg')
const integer = ref(65)
const decimal = ref(0)

const kgValue = computed(() => {
  const val = integer.value + decimal.value / 10
  return unit.value === 'kg' ? val : val / 2
})

const displayValue = computed(() => {
  const val = integer.value + decimal.value / 10
  return val.toFixed(1)
})

const displayUnit = computed(() => (unit.value === 'kg' ? 'kg' : '斤'))

const kgHint = computed(() => {
  // 当前显示值对应的 kg 数
  const kg = kgValue.value
  return `约 ${kg.toFixed(1)} kg`
})

const integerOptions = Array.from({ length: 171 }, (_, i) => ({
  value: i + 30,
  label: String(i + 30),
}))

const decimalOptions = Array.from({ length: 10 }, (_, i) => ({
  value: i,
  label: `${i}`,
}))

function switchUnit(u: 'kg' | 'jin') {
  if (u === unit.value) return
  // 切换单位时保持实际重量不变，只改显示数值
  const currentKg = kgValue.value
  unit.value = u
  const target = u === 'kg' ? currentKg : currentKg * 2
  integer.value = Math.floor(target)
  decimal.value = Math.round((target - Math.floor(target)) * 10) % 10
}

function close() {
  emit('update:modelValue', false)
}

function record() {
  const ev = store.recordWeight(Number(displayValue.value), unit.value)
  toast.show(`已记录 · ${displayValue.value}${displayUnit.value}`, {
    undoAction: () => store.removeEvent(ev.id),
  })
  close()
}
</script>

<template>
  <Transition name="sheet">
    <div v-if="modelValue" class="sheet-overlay" @click.self="close">
      <div class="sheet" :class="{ open: modelValue }">
        <div class="sheet-handle" />

        <div class="sheet-header">
          <div class="sheet-title">记录体重</div>
          <button class="close-btn" @click="close">
            <i class="i-ph-x" />
          </button>
        </div>

        <div class="weight-display">
          <div class="value">{{ displayValue }}</div>
          <div class="unit-group">
            <button
              class="unit-btn"
              :class="{ active: unit === 'kg' }"
              @click="switchUnit('kg')"
            >kg</button>
            <button
              class="unit-btn"
              :class="{ active: unit === 'jin' }"
              @click="switchUnit('jin')"
            >斤</button>
          </div>
        </div>

        <div class="hint">{{ kgHint }}</div>

        <div class="picker-row">
          <WheelPicker v-model="integer" :options="integerOptions" />
          <span class="picker-dot">.</span>
          <WheelPicker v-model="decimal" :options="decimalOptions" />
          <div class="picker-unit">{{ displayUnit }}</div>
        </div>

        <button class="record-btn" @click="record">记录</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  -webkit-tap-highlight-color: transparent;
}

.sheet {
  background: var(--sheet-bg);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-top: 0.5px solid var(--sheet-border);
  border-radius: 24px 24px 0 0;
  padding: 10px 20px calc(var(--safe-bottom) + 20px);
  box-shadow: var(--sheet-shadow);
  transform: translateY(0);
}

.sheet-handle {
  width: 36px;
  height: 5px;
  border-radius: 2.5px;
  background: var(--text2);
  opacity: 0.3;
  margin: 0 auto 16px;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sheet-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--card);
  color: var(--text2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
}

.weight-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 12px;
  margin-bottom: 4px;
}

.value {
  font-size: 56px;
  font-weight: 800;
  color: var(--text);
  line-height: 1;
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
}

.unit-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.unit-btn {
  width: 44px;
  height: 28px;
  border-radius: 14px;
  border: 0.5px solid var(--sep);
  background: var(--card);
  color: var(--text2);
  font-size: 13px;
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
  font-size: 13px;
  color: var(--text2);
  margin-bottom: 20px;
  opacity: 0.8;
}

.picker-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 200px;
  margin-bottom: 24px;
}

.picker-dot {
  font-size: 22px;
  font-weight: 700;
  color: var(--text2);
  margin-top: 4px;
}

.picker-unit {
  width: 50px;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
}

.record-btn {
  width: 100%;
  height: 52px;
  border-radius: 16px;
  border: none;
  background: var(--text);
  color: var(--card);
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s;
}

.record-btn:active {
  transform: scale(0.98);
}

/* 进入/离开动画 */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s ease;
}
.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.25s cubic-bezier(0.25, 1, 0.5, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(100%);
}
</style>
