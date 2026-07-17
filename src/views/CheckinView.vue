<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { useToast } from '@/composables/useToast'
import PageNav from '@/components/PageNav.vue'

const settings = useSettingsStore()
const toast = useToast()

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth()) // 0-11

const monthLabel = computed(() => `${viewYear.value}年${viewMonth.value + 1}月`)
const weekLabels = ['日', '一', '二', '三', '四', '五', '六']

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function dateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`
}

const cells = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const lead = first.getDay()
  const days = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const arr: { day: number | null; key: string; isToday: boolean; checked: boolean }[] = []
  for (let i = 0; i < lead; i++) arr.push({ day: null, key: '', isToday: false, checked: false })
  for (let d = 1; d <= days; d++) {
    const key = dateStr(viewYear.value, viewMonth.value, d)
    arr.push({
      day: d,
      key,
      isToday: key === dateStr(today.getFullYear(), today.getMonth(), today.getDate()),
      checked: settings.checkinDates.includes(key),
    })
  }
  return arr
})

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }
}
function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }
}

function checkin() {
  if (settings.isCheckedInToday) return
  settings.checkinToday()
  toast.show('已打卡 · 继续修行')
}
</script>

<template>
  <div class="page">
    <PageNav title="每日打卡" :show-back="true" />

    <div class="body">
      <div class="streak-card">
        <div class="streak-num">{{ settings.checkinStreak }}</div>
        <div class="streak-label">连续打卡天数</div>
      </div>

      <div class="cal-head">
        <button class="nav-btn" type="button" @click="prevMonth"><i class="i-ph-caret-left" /></button>
        <div class="month-label">{{ monthLabel }}</div>
        <button class="nav-btn" type="button" @click="nextMonth"><i class="i-ph-caret-right" /></button>
      </div>

      <div class="week-row">
        <span v-for="w in weekLabels" :key="w" class="week-cell">{{ w }}</span>
      </div>

      <div class="grid">
        <div
          v-for="(c, i) in cells"
          :key="i"
          class="cell"
          :class="{ empty: c.day === null, checked: c.checked, today: c.isToday }"
        >
          <template v-if="c.day !== null">
            <span class="cell-day">{{ c.day }}</span>
            <i v-if="c.checked" class="i-ph-check-circle cell-check" />
          </template>
        </div>
      </div>

      <button class="checkin-btn" type="button" :disabled="settings.isCheckedInToday" @click="checkin">
        <i class="i-ph-check-fat" />
        {{ settings.isCheckedInToday ? '今天已打卡' : '打卡今天' }}
      </button>
      <div class="note">打卡以本地日期为准，不补打过往日期。</div>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100dvh; }
.body { padding: 12px 20px calc(var(--safe-bottom) + 24px); }

.streak-card {
  text-align: center; padding: 20px; border-radius: 20px;
  background: linear-gradient(135deg, rgba(52,199,89,0.14), rgba(88,86,214,0.1));
  margin: 8px 0 20px;
}
.streak-num { font-size: 48px; font-weight: 800; color: var(--text); letter-spacing: -2px; line-height: 1; }
.streak-label { font-size: 14px; color: var(--text2); margin-top: 6px; }

.cal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.nav-btn {
  width: 36px; height: 36px; border-radius: 50%; border: none;
  background: var(--card); color: var(--text); cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
  box-shadow: var(--shadow);
}
.nav-btn:active { transform: scale(0.9); }
.month-label { font-size: 17px; font-weight: 700; color: var(--text); }

.week-row { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 8px; }
.week-cell { text-align: center; font-size: 12px; color: var(--text2); font-weight: 600; }

.grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.cell {
  aspect-ratio: 1; border-radius: 12px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 2px; background: var(--card);
  box-shadow: var(--shadow);
}
.cell.empty { background: transparent; box-shadow: none; }
.cell.today { border: 1.5px solid var(--green); }
.cell.checked { background: rgba(52, 199, 89, 0.14); }
.cell-day { font-size: 15px; font-weight: 600; color: var(--text); }
.cell-check { font-size: 14px; color: var(--green); }

.checkin-btn {
  width: 100%; height: 54px; margin-top: 24px; border-radius: 16px; border: none;
  background: var(--green); color: #fff; font-size: 17px; font-weight: 600;
  font-family: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all 0.2s var(--spring);
}
.checkin-btn:active { transform: scale(0.97); opacity: 0.9; }
.checkin-btn:disabled { background: rgba(142, 142, 147, 0.12); color: var(--text3); cursor: default; }

.note { text-align: center; font-size: 12px; color: var(--text2); margin-top: 12px; }
</style>
