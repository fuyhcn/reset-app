<script setup lang="ts">
const emit = defineEmits<{
  record: [type: string]
}>()

const actions = [
  { type: 'smoke', icon: 'i-ph-cigarette', label: '抽烟', tint: '#8E8E93' },
  { type: 'urge', icon: 'i-ph-fire', label: '冲动', tint: '#FF9500' },
  { type: 'sport', icon: 'i-ph-person-simple-run', label: '运动', tint: '#34C759' },
  { type: 'weight', icon: 'i-ph-scales', label: '体重', tint: '#FF2D55' },
  { type: 'more', icon: 'i-ph-dots-three', label: '更多', tint: '#5E5E61' },
]
</script>


<template>
  <div class="dock-anchor">
    <div class="dock">
      <button v-for="item in actions" :key="item.type" class="dock-btn" @click="emit('record', item.type)">
        <div class="btn-glass" :style="{ '--tint': item.tint }">
          <i :class="item.icon" class="btn-icon" :style="{ color: item.tint }" />
        </div>
        <span class="btn-label">{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>


<style scoped>
.dock-anchor {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 100;
  pointer-events: none;
  /* 让毛玻璃模糊层一直延伸到屏幕最底部，覆盖整段安全区，不留空白 */
  background: linear-gradient(to top,
    color-mix(in srgb, var(--bg) 65%, transparent) 0%,
    color-mix(in srgb, var(--bg) 30%, transparent) 45%,
    transparent 100%);
  -webkit-backdrop-filter: blur(14px) saturate(180%);
  backdrop-filter: blur(14px) saturate(180%);
  padding: 8px 10px var(--safe-bottom);
}

/* ── 外层玻璃容器 ── */
.dock {
  display: flex;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 28px;
  background: var(--dock-glass);
  backdrop-filter: blur(50px) saturate(200%);
  -webkit-backdrop-filter: blur(50px) saturate(200%);
  border: 0.5px solid var(--dock-border);
  box-shadow: var(--dock-shadow);
  pointer-events: auto;
}

/* ── 单个按钮 ── */
.dock-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 2px;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.2s var(--spring);
}

.dock-btn:active {
  transform: scale(0.92);
}

/* ── 按钮内玻璃胶囊 ── */
.btn-glass {
  width: 50px;
  height: 50px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--tint) 12%, var(--card));
  border: 0.5px solid color-mix(in srgb, var(--tint) 18%, var(--sep));
  transition: all 0.2s var(--spring);
}

.dock-btn:active .btn-glass {
  background: color-mix(in srgb, var(--tint) 24%, var(--card));
}

/* ── 图标 ── */
.btn-icon {
  font-size: 22px;
}

/* ── 文字标签 ── */
.btn-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text2);
  letter-spacing: 0.2px;
}
</style>
