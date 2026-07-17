<script setup lang="ts">
import { ref } from 'vue'
import PageNav from '@/components/PageNav.vue'
import ReminderEditorSheet from '@/components/ReminderEditorSheet.vue'
import { useReminderStore, type Reminder } from '@/stores/reminderStore'
import { useReminderScheduler } from '@/composables/useReminderScheduler'

const store = useReminderStore()
const sched = useReminderScheduler()

const editorOpen = ref(false)
const editing = ref<Reminder | null>(null)
const permHint = ref<string | null>(null)

function openNew() {
  editing.value = null
  editorOpen.value = true
}
function openEdit(r: Reminder) {
  editing.value = r
  editorOpen.value = true
}

function fmtTime(r: Reminder): string {
  return `${String(r.hour).padStart(2, '0')}:${String(r.minute).padStart(2, '0')}`
}

async function enableSystem() {
  const ok = await sched.requestPermission()
  permHint.value = ok
    ? '已开启系统通知，后台也能提醒 ✅'
    : '系统通知不可用（iOS 暂不支持 Web 通知），将使用应用内弹窗提醒'
  setTimeout(() => (permHint.value = null), 3500)
}
</script>

<template>
  <div class="page">
    <PageNav title="提醒" />

    <div class="body">
      <p class="lead">
        本地提醒，无需联网。每天到点会弹窗提醒你，可自由添加多个。
      </p>

      <button class="perm" @click="enableSystem">
        <i class="i-ph-bell" />
        <span>开启系统通知（可选）</span>
      </button>
      <p v-if="permHint" class="perm-hint">{{ permHint }}</p>

      <div v-if="!store.reminders.length" class="empty">
        <i class="i-ph-bell-ringing empty-icon" />
        <p>还没有提醒</p>
        <span>点击下方按钮，添加第一个提醒</span>
      </div>

      <ul v-else class="list">
        <li
          v-for="r in store.reminders"
          :key="r.id"
          class="item"
          @click="openEdit(r)"
        >
          <div class="meta">
            <div class="t">{{ r.title }}</div>
            <div v-if="r.body" class="b">{{ r.body }}</div>
          </div>
          <div class="right">
            <span class="time">{{ fmtTime(r) }}</span>
            <button
              class="sw"
              :class="{ on: r.enabled }"
              @click.stop="store.toggle(r.id)"
            >
              <i class="dot" />
            </button>
          </div>
        </li>
      </ul>
    </div>

    <button class="fab" @click="openNew">
      <i class="i-ph-plus" />
      <span>新增提醒</span>
    </button>

    <ReminderEditorSheet v-model:open="editorOpen" :editing="editing" />
  </div>
</template>

<style scoped>
.page {
  min-height: 100dvh;
  background: var(--bg);
}
.body {
  padding: 12px 20px calc(var(--safe-bottom) + 96px);
}
.lead {
  font-size: 14px;
  color: var(--text2);
  line-height: 1.5;
  margin: 4px 2px 16px;
}

.perm {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 13px 16px;
  border: 0.5px solid var(--sep);
  border-radius: 14px;
  background: color-mix(in srgb, var(--orange) 10%, var(--card));
  color: var(--text);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.perm i {
  font-size: 18px;
  color: var(--orange);
}
.perm-hint {
  font-size: 12.5px;
  color: var(--text2);
  margin: 8px 2px 0;
  line-height: 1.45;
}

.empty {
  margin-top: 60px;
  text-align: center;
  color: var(--text2);
}
.empty-icon {
  font-size: 46px;
  opacity: 0.5;
}
.empty p {
  margin: 12px 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}
.empty span {
  font-size: 13px;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--card);
  border: 0.5px solid var(--sep);
  cursor: pointer;
}
.meta {
  min-width: 0;
}
.t {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.b {
  margin-top: 2px;
  font-size: 13px;
  color: var(--text2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.time {
  font-size: 15px;
  font-weight: 700;
  color: var(--text2);
  font-variant-numeric: tabular-nums;
}
.sw {
  width: 47px;
  height: 28px;
  border-radius: 16px;
  border: none;
  background: rgba(120, 120, 128, 0.32);
  position: relative;
  cursor: pointer;
  transition: background 0.25s var(--spring);
}
.sw.on {
  background: var(--green);
}
.dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.25s var(--spring);
}
.sw.on .dot {
  transform: translateX(19px);
}

.fab {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(var(--safe-bottom) + 20px);
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 24px;
  border: none;
  border-radius: 24px;
  background: var(--green);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(52, 199, 89, 0.4);
  cursor: pointer;
  transition: transform 0.2s var(--spring);
}
.fab:active {
  transform: translateX(-50%) scale(0.96);
}
</style>
