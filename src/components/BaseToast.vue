<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { state, undo } = useToast()
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="state.visible" class="toast">
        <i class="i-ph-check-fat toast-icon" />
        <span class="toast-text">{{ state.message }}</span>
        <button v-if="state.undoAction" class="toast-undo" type="button" @click="undo">
          {{ state.undoLabel }}
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: calc(var(--safe-bottom) + 110px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: rgba(30, 30, 30, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 14px;
  z-index: 60;
  white-space: nowrap;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
.toast-icon {
  font-size: 18px;
  color: var(--green);
}
.toast-text {
  font-size: 15px;
  font-weight: 500;
  color: #fff;
}
.toast-undo {
  background: none;
  border: none;
  font-size: 15px;
  font-weight: 600;
  color: var(--green);
  cursor: pointer;
  padding: 4px 8px;
}
.toast-enter-active {
  transition: all 0.3s var(--spring);
}
.toast-leave-active {
  transition: all 0.25s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
