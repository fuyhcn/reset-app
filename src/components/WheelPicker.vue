<script setup lang="ts">
/**
 * 垂直滚轮选择器（iOS 风格）
 * - 通过 CSS scroll-snap 实现吸附
 * - 支持触控滑动与点击项跳转
 */
const props = defineProps<{
  options: { value: number | string; label: string }[]
  modelValue: number | string
}>()
const emit = defineEmits<{ 'update:modelValue': [val: number | string] }>()

import { ref, watch, nextTick, onMounted } from 'vue'

const listRef = ref<HTMLDivElement | null>(null)
const itemHeight = 40 // px
const visibleCount = 5 // 奇数，中间选中

function findIndex(val: number | string) {
  return props.options.findIndex(o => o.value === val)
}

function scrollToIndex(idx: number, smooth = false) {
  if (!listRef.value) return
  const top = idx * itemHeight
  listRef.value.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' })
}

let isUserScrolling = false
let scrollTimer: number | null = null

function onScroll() {
  if (!listRef.value) return
  isUserScrolling = true
  if (scrollTimer) window.clearTimeout(scrollTimer)
  scrollTimer = window.setTimeout(() => {
    isUserScrolling = false
    const idx = Math.round(listRef.value!.scrollTop / itemHeight)
    const clamped = Math.max(0, Math.min(props.options.length - 1, idx))
    scrollToIndex(clamped, true)
    emit('update:modelValue', props.options[clamped].value)
  }, 120)
}

onMounted(() => {
  nextTick(() => scrollToIndex(findIndex(props.modelValue)))
})

watch(() => props.modelValue, (val) => {
  if (isUserScrolling) return
  const idx = findIndex(val)
  if (idx >= 0) scrollToIndex(idx)
})

function select(idx: number) {
  scrollToIndex(idx, true)
  emit('update:modelValue', props.options[idx].value)
}
</script>

<template>
  <div class="wheel">
    <!-- 顶部/底部遮罩，制造滚轮深浅效果 -->
    <div class="wheel-mask top" />
    <div class="wheel-mask bottom" />
    <div ref="listRef" class="wheel-list" @scroll.passive="onScroll">
      <!-- 顶部占位，让第一项能滚到中间 -->
      <div class="wheel-spacer" :style="{ height: `${itemHeight * ((visibleCount - 1) / 2)}px` }" />
      <div
        v-for="(opt, idx) in options"
        :key="String(opt.value) + idx"
        class="wheel-item"
        :class="{ active: opt.value === modelValue }"
        :style="{ height: `${itemHeight}px`, lineHeight: `${itemHeight}px` }"
        @click="select(idx)"
      >
        {{ opt.label }}
      </div>
      <!-- 底部占位 -->
      <div class="wheel-spacer" :style="{ height: `${itemHeight * ((visibleCount - 1) / 2)}px` }" />
    </div>
  </div>
</template>

<style scoped>
.wheel {
  position: relative;
  width: 80px;
  height: calc(v-bind(itemHeight) * v-bind(visibleCount) * 1px);
  overflow: hidden;
  border-radius: 12px;
}

.wheel-list {
  height: 100%;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.wheel-list::-webkit-scrollbar {
  display: none;
}

.wheel-item {
  scroll-snap-align: center;
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: var(--text2);
  transition: color 0.15s, transform 0.15s;
  cursor: pointer;
  user-select: none;
}

.wheel-item.active {
  color: var(--text);
  font-size: 24px;
}

.wheel-mask {
  position: absolute;
  left: 0;
  right: 0;
  height: 40px;
  pointer-events: none;
  z-index: 2;
}
.wheel-mask.top {
  top: 0;
  background: linear-gradient(to bottom, var(--sheet-bg) 0%, rgba(255,255,255,0) 100%);
}
.wheel-mask.bottom {
  bottom: 0;
  background: linear-gradient(to top, var(--sheet-bg) 0%, rgba(255,255,255,0) 100%);
}

html.dark .wheel-mask.top {
  background: linear-gradient(to bottom, var(--sheet-bg) 0%, rgba(0,0,0,0) 100%);
}
html.dark .wheel-mask.bottom {
  background: linear-gradient(to top, var(--sheet-bg) 0%, rgba(0,0,0,0) 100%);
}
</style>
