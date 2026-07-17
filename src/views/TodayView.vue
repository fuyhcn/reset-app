<script setup lang="ts">
import { ref, computed, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '@/stores/eventStore'
import type { TimelineDisplay } from '@/types/event'
import { ROUTES } from '@/router'
import ResetHeader from '@/components/ResetHeader.vue'
import SummaryCards from '@/components/SummaryCards.vue'
import EventTimeline from '@/components/EventTimeline.vue'
import QuickDock from '@/components/QuickDock.vue'
import ActionSheet from '@/components/ActionSheet.vue'
import QuickRecordSheet from '@/components/QuickRecordSheet.vue'
import WeightSheet from '@/components/WeightSheet.vue'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const store = useEventStore()
const toast = useToast()

const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const now = new Date()
const dateStr = `${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`

const groupedTimeline = computed(() => store.groupedTimeline)
const summary = computed(() => store.summary)

/* 从其他页面（如睡眠记录）返回时强制刷新看板，保证 keep-alive 缓存下数据同步 */
const summaryKey = ref(0)
onActivated(() => { summaryKey.value++ })

/* ===== 事件详情 Sheet（点击时间线触发，仅查看/删除） ===== */
const detailOpen = ref(false)
const detailItems = ref<{ key: string; value: string }[]>([])
const selectedId = ref<string | null>(null)

function showDetail(item: TimelineDisplay) {
  selectedId.value = item.id
  detailItems.value = Object.entries(item.detail).map(([key, value]) => ({ key, value }))
  detailOpen.value = true
}

function deleteSelected() {
  if (selectedId.value) {
    store.removeEvent(selectedId.value)
    toast.show('已删除')
  }
  detailOpen.value = false
  selectedId.value = null
}

/* ===== 快速记录 Sheet（抽烟/冲动/运动/心情，点一下即记录） ===== */
const quickOpen = ref(false)
const sheetMode = ref<'smoke' | 'urge' | 'sport' | 'mood'>('smoke')

/* ===== 体重记录 Sheet ===== */
const weightOpen = ref(false)

function openQuick(type: string) {
  if (type === 'more') {
    router.push(ROUTES.MORE)
    return
  }
  if (type === 'weight') {
    weightOpen.value = true
    return
  }
  const map: Record<string, 'smoke' | 'urge' | 'sport' | 'mood'> = {
    smoke: 'smoke', urge: 'urge', sport: 'sport', mood: 'mood',
  }
  sheetMode.value = map[type] ?? 'smoke'
  quickOpen.value = true
}

/* 空状态「开始记录」→ 直接弹抽烟快速记录 */
function startRecord() {
  openQuick('smoke')
}
</script>

<template>
  <div class="home">
    <ResetHeader :date="dateStr" />
    <SummaryCards :summary="summary" :key="summaryKey" style="margin-bottom: 28px" />
    <EventTimeline
      :groups="groupedTimeline"
      @select="showDetail"
      @start="startRecord"
    />
    <QuickDock @record="openQuick" />

    <!-- 事件详情（底部 Sheet，支持删除） -->
    <ActionSheet
      v-model="detailOpen"
      :items="detailItems"
      @delete="deleteSelected"
    />

    <!-- 快速记录（底部 Sheet，即时记录 + 撤销） -->
    <QuickRecordSheet v-model="quickOpen" :mode="sheetMode" />

    <!-- 体重记录（数字轮盘） -->
    <WeightSheet v-model="weightOpen" />
  </div>
</template>

<style scoped>
.home {
  padding-bottom: calc(var(--safe-bottom) + 96px);
}
</style>
