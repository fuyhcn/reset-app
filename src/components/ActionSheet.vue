<script setup lang="ts">
/**
 * 事件详情底部 Sheet（T03 精简后仅保留详情 + 删除）
 * 记录方式统一收口到各路由子页，详情查看/删除在此完成。
 */
const props = defineProps<{
  modelValue: boolean
  items?: { key: string; value: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  delete: []
}>()

const close = () => emit('update:modelValue', false)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="overlay" @click="close" />
    </Transition>
    <Transition name="sheet">
      <div v-if="modelValue" class="sheet">
        <div class="handle" />
        <div class="header">详情</div>
        <div class="detail-list">
          <div v-for="(row, i) in items" :key="i" class="detail-row">
            <span class="detail-k">{{ row.key }}</span>
            <span class="detail-v">{{ row.value }}</span>
          </div>
        </div>
        <button class="btn danger" type="button" @click="emit('delete')">删除记录</button>
        <button class="btn ghost" type="button" @click="close">关闭</button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay { position: fixed; inset: 0; background: var(--overlay); z-index: 200; }
.sheet {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px; z-index: 210;
  background: var(--sheet-bg);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-top: 1px solid var(--sheet-border);
  border-radius: 18px 18px 0 0; padding: 8px 20px calc(var(--safe-bottom) + 16px);
  display: flex; flex-direction: column; gap: 10px;
}
.handle {
  width: 36px; height: 5px; border-radius: 3px; margin: 4px auto 8px;
  background: var(--text3); opacity: 0.4;
}
.header {
  display: flex; align-items: center; gap: 8px;
  font-size: 17px; font-weight: 600; color: var(--text); padding: 4px 0 6px;
}
.detail-list { display: flex; flex-direction: column; gap: 0; }
.detail-row {
  display: flex; justify-content: space-between; padding: 12px 0;
  border-bottom: 0.5px solid var(--sep); font-size: 15px;
}
.detail-k { color: var(--text2); }
.detail-v { color: var(--text); font-weight: 500; }
.btn {
  width: 100%; padding: 14px; border-radius: 14px; font-size: 16px; font-weight: 600;
  border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
}
.danger { background: rgba(255, 59, 48, 0.1); color: var(--red); }
.ghost { background: rgba(142, 142, 147, 0.08); color: var(--text2); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.sheet-enter-active, .sheet-leave-active { transition: transform 0.35s var(--spring); }
.sheet-enter-from, .sheet-leave-to { transform: translateX(-50%) translateY(100%); }
</style>
