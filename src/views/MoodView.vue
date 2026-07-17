<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '@/stores/eventStore'
import { useToast } from '@/composables/useToast'
import PageNav from '@/components/PageNav.vue'

const router = useRouter()
const store = useEventStore()
const toast = useToast()

const moods = [
  { level: 5, emoji: '😁', label: '很好' },
  { level: 4, emoji: '🙂', label: '还不错' },
  { level: 3, emoji: '😐', label: '一般' },
  { level: 2, emoji: '🙁', label: '不太好' },
  { level: 1, emoji: '😣', label: '很差' },
]

const CONTEXTS = ['工作', '家庭', '独处', '社交', '自然', '压力']

const level = ref<number | null>(null)
const note = ref('')
const tags = ref<Set<string>>(new Set())

const selectedMood = computed(() => moods.find(m => m.level === level.value) || null)

function selectMood(l: number) {
  level.value = level.value === l ? null : l
}

function toggleTag(t: string) {
  const next = new Set(tags.value)
  if (next.has(t)) next.delete(t)
  else next.add(t)
  tags.value = next
}

function buildNote(): string | undefined {
  const parts = [...tags.value]
  if (note.value.trim()) parts.push(note.value.trim())
  return parts.length ? parts.join('、') : undefined
}

function submit() {
  if (!level.value) return
  const ev = store.recordMood(level.value, buildNote())
  const text = `已记录 · 心情${selectedMood.value?.label ?? ''}`
  toast.show(text, { undoAction: () => store.removeEvent(ev.id) })
  router.back()
}
</script>

<template>
  <div class="page">
    <PageNav title="心情记录" :show-back="true" />

    <div class="body">
      <div class="hint">现在感觉如何？</div>

      <div class="mood-row">
        <button
          v-for="m in moods"
          :key="m.level"
          class="mood-btn"
          :class="{ active: level === m.level }"
          type="button"
          @click="selectMood(m.level)"
        >
          <span class="mood-emoji">{{ m.emoji }}</span>
          <span class="mood-text">{{ m.label }}</span>
        </button>
      </div>

      <div class="section">
        <div class="section-label">发生了什么？</div>
        <div class="ctx-grid">
          <button
            v-for="t in CONTEXTS"
            :key="t"
            class="ctx-tag"
            :class="{ active: tags.has(t) }"
            type="button"
            @click="toggleTag(t)"
          >
            {{ t }}
          </button>
        </div>
        <textarea
          v-model="note"
          class="note-input"
          rows="2"
          placeholder="一句话记录此刻（可选）"
        />
      </div>
    </div>

    <div class="done-wrap">
      <button class="done-btn" :class="{ disabled: !level }" type="button" :disabled="!level" @click="submit">
        记录心情
      </button>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100dvh; }
.body { padding: 4px 20px 24px; }

.hint { font-size: 26px; font-weight: 700; color: var(--text); letter-spacing: -0.3px; margin: 8px 0 20px; padding-left: 4px; }

.mood-row { display: flex; justify-content: space-between; gap: 8px; }
.mood-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 16px 4px; border-radius: 16px; border: 1.5px solid var(--sep);
  background: var(--card); cursor: pointer; transition: all 0.2s var(--spring);
}
.mood-btn:active { transform: scale(0.94); }
.mood-btn.active { border-color: var(--blue); background: rgba(0, 122, 255, 0.06); }
.mood-emoji { font-size: 30px; line-height: 1; }
.mood-text { font-size: 12px; font-weight: 500; color: var(--text2); }
.mood-btn.active .mood-text { color: var(--blue); }

.section { margin-top: 28px; }
.section-label { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 14px; padding-left: 4px; }

.ctx-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
.ctx-tag {
  padding: 13px 8px; border-radius: 12px; background: var(--card);
  border: 1.5px solid var(--sep); font-size: 14px; font-weight: 500; color: var(--text);
  cursor: pointer; transition: all 0.2s var(--spring);
}
.ctx-tag:active { transform: scale(0.95); }
.ctx-tag.active { border-color: var(--blue); background: rgba(0, 122, 255, 0.08); color: var(--blue); }

.note-input {
  width: 100%; padding: 14px 16px; border-radius: 16px;
  border: 1.5px solid var(--sep); background: var(--card);
  font-size: 15px; font-family: inherit; color: var(--text);
  resize: none; outline: none; line-height: 1.5;
  transition: border-color 0.25s var(--spring), box-shadow 0.25s var(--spring);
}
.note-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.12); }
.note-input::placeholder { color: var(--text3); }

.done-wrap { padding: 16px 20px calc(var(--safe-bottom) + 16px); }
.done-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; height: 54px; border-radius: 16px; border: none;
  background: var(--blue); color: #fff; font-size: 17px; font-weight: 600;
  font-family: inherit; cursor: pointer; transition: all 0.2s var(--spring);
}
.done-btn:active { transform: scale(0.97); opacity: 0.9; }
.done-btn.disabled { background: rgba(142, 142, 147, 0.12); color: var(--text3); cursor: default; pointer-events: none; }
</style>
