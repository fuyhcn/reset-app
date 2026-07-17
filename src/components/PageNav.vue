<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ROUTES } from '@/router'

const props = withDefaults(
  defineProps<{
    title: string
    showBack?: boolean
  }>(),
  { showBack: true },
)

const router = useRouter()

function back() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push(ROUTES.TODAY)
  }
}
</script>

<template>
  <header class="page-nav">
    <button v-if="showBack" class="nav-back" type="button" aria-label="返回" @click="back">
      <i class="i-ph-caret-left" />
    </button>
    <div v-else class="nav-back nav-back--placeholder" aria-hidden="true" />
    <h1 class="nav-title">{{ title }}</h1>
    <div class="nav-right">
      <slot name="right" />
    </div>
  </header>
</template>

<style scoped>
.page-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: calc(env(safe-area-inset-top) + 10px) 16px 12px;
  position: sticky;
  top: 0;
  z-index: 30;
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 0.5px solid var(--sep);
}

.nav-back {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: rgba(118, 118, 128, 0.12);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.2s var(--spring), background 0.2s;
}
.nav-back:active {
  transform: scale(0.88);
  background: rgba(118, 118, 128, 0.2);
}
.nav-back--placeholder {
  background: transparent;
  pointer-events: none;
}

.nav-title {
  flex: 1;
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.4px;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
</style>
