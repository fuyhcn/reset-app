<script setup lang="ts">
import { useReminderStore } from '@/stores/reminderStore'

const store = useReminderStore()

function fmtTime(r: { hour: number; minute: number }): string {
  return `${String(r.hour).padStart(2, '0')}:${String(r.minute).padStart(2, '0')}`
}

function ok(id: string) {
  store.dismiss(id)
}
</script>

<template>
  <transition name="rem-mask">
    <div v-if="store.pending.length" class="rem-mask">
      <div
        v-for="r in store.pending"
        :key="r.id"
        class="rem-card"
        @click.stop
      >
        <div class="rem-glow" />
        <div class="rem-icon"><i class="i-ph-bell-ringing" /></div>
        <div class="rem-time">{{ fmtTime(r) }}</div>
        <h3 class="rem-title">{{ r.title }}</h3>
        <p v-if="r.body" class="rem-body">{{ r.body }}</p>
        <button class="rem-btn" @click="ok(r.id)">知道了</button>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.rem-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.rem-card {
  position: relative;
  width: min(86vw, 360px);
  padding: 28px 24px 22px;
  border-radius: 28px;
  text-align: center;
  background: var(--sheet-bg);
  border: 0.5px solid var(--sheet-border);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.rem-glow {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: rgba(255, 149, 0, 0.18);
  filter: blur(40px);
  pointer-events: none;
}

.rem-icon {
  position: relative;
  font-size: 40px;
  color: var(--orange);
}
.rem-time {
  position: relative;
  margin-top: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text2);
  letter-spacing: 0.5px;
}
.rem-title {
  position: relative;
  margin: 4px 0 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
}
.rem-body {
  position: relative;
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--text2);
  line-height: 1.45;
}

.rem-btn {
  position: relative;
  margin-top: 20px;
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 16px;
  background: var(--orange);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s var(--spring);
}
.rem-btn:active {
  transform: scale(0.97);
}

.rem-mask-enter-active,
.rem-mask-leave-active {
  transition: opacity 0.25s ease;
}
.rem-mask-enter-from,
.rem-mask-leave-to {
  opacity: 0;
}
.rem-mask-enter-active .rem-card {
  transition: transform 0.3s var(--spring);
}
.rem-mask-enter-from .rem-card {
  transform: scale(0.92) translateY(10px);
}
</style>
