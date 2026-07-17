<script setup lang="ts">
/**
 * 通用居中确认模态框（iOS 风格毛玻璃）
 * - 点击遮罩或「取消」关闭
 * - 点「确认」触发 confirm 事件并关闭
 */
const props = defineProps<{
  modelValue: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  /** 危险操作：确认按钮显示为红色 */
  danger?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [val: boolean]; confirm: [] }>()

function close() {
  emit('update:modelValue', false)
}
function confirm() {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="mask" @click="close" />
    </Transition>
    <Transition name="pop">
      <div v-if="modelValue" class="modal" role="alertdialog" aria-modal="true">
        <div class="modal-title">{{ title }}</div>
        <div v-if="message" class="modal-msg">{{ message }}</div>
        <div class="modal-actions">
          <button class="m-cancel" type="button" @click="close">
            {{ cancelText || '取消' }}
          </button>
          <button class="m-confirm" :class="{ danger }" type="button" @click="confirm">
            {{ confirmText || '确认' }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mask {
  position: fixed; inset: 0; z-index: 300;
  background: var(--overlay);
  -webkit-backdrop-filter: blur(2px);
  backdrop-filter: blur(2px);
}
.modal {
  position: fixed; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 64px); max-width: 320px; z-index: 310;
  background: var(--sheet-bg);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--sheet-border);
  border-radius: 18px; padding: 22px 20px 16px;
  text-align: center; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}
.modal-title {
  font-size: 17px; font-weight: 700; color: var(--text);
  letter-spacing: 0.2px;
}
.modal-msg {
  font-size: 14px; color: var(--text2); line-height: 1.55;
  margin-top: 10px; padding: 0 4px;
}
.modal-actions {
  display: flex; gap: 10px; margin-top: 20px;
}
.m-cancel, .m-confirm {
  flex: 1; height: 46px; border-radius: 13px; border: none;
  font-size: 16px; font-weight: 600; font-family: inherit; cursor: pointer;
  transition: opacity 0.15s var(--spring);
}
.m-cancel { background: var(--text3); color: #fff; opacity: 0.85; }
.m-cancel:active { opacity: 0.7; }
.m-confirm { background: var(--green); color: #fff; }
.m-confirm.danger { background: var(--red); }
.m-confirm:active, .m-cancel:active { opacity: 0.8; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.pop-enter-active { transition: opacity 0.22s ease, transform 0.28s var(--spring); }
.pop-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.pop-enter-from, .pop-leave-to {
  opacity: 0; transform: translate(-50%, -50%) scale(0.9);
}
</style>
