<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '@/stores/eventStore'
import { useToast } from '@/composables/useToast'
import PageNav from '@/components/PageNav.vue'

const router = useRouter()
const store = useEventStore()
const toast = useToast()

type SmokeChoice = 'smoked' | 'urge' | 'none'

const selected = ref<SmokeChoice | null>(null)
const note = ref('')
const tags = ref<Set<string>>(new Set())

const TRIGGERS = ['饭后', '工作', '游戏', '夜间', '压力', '社交']

const reasonLabel = computed(() => {
  if (selected.value === 'smoked') return '为什么抽？'
  if (selected.value === 'urge') return '什么触发了烟瘾？'
  return ''
})

const showReason = computed(() => selected.value === 'smoked' || selected.value === 'urge')

function choose(type: SmokeChoice) {
  selected.value = selected.value === type ? null : type
  if (selected.value !== 'smoked' && selected.value !== 'urge') {
    tags.value = new Set()
  }
}

function toggleTag(tag: string) {
  const next = new Set(tags.value)
  if (next.has(tag)) next.delete(tag)
  else next.add(tag)
  tags.value = next
}

function buildTrigger(): string | undefined {
  const parts: string[] = [...tags.value]
  if (note.value.trim()) parts.push(note.value.trim())
  return parts.length ? parts.join('、') : undefined
}

const labels: Record<SmokeChoice, string> = {
  smoked: '抽了一根',
  urge: '特别想抽',
  none: '没抽',
}

function submit() {
  if (!selected.value) return
  const trigger = buildTrigger()
  let ev
  if (selected.value === 'smoked') {
    ev = store.recordSmoke(trigger)
  } else {
    // 特别想抽 / 没抽 均记为「已控制」冲动（记录欲望比结果重要）
    ev = store.recordUrge(true)
  }
  const text = `已记录 · ${labels[selected.value]}${trigger ? ' · ' + trigger : ''}`
  toast.show(text, { undoAction: () => store.removeEvent(ev.id) })
  router.back()
}
</script>

<template>
  <div class="page">
    <PageNav title="抽烟记录" :show-back="true" />

    <div class="body">
      <div class="action-cards">
        <button
          class="card"
          :class="{ selected: selected === 'smoked' }"
          type="button"
          @click="choose('smoked')"
        >
          <div class="card-icon" style="background: rgba(255,59,48,0.12); color: var(--red)">
            <i class="i-ph-cigarette" />
          </div>
          <div class="card-text">
            <div class="card-title">抽了一根</div>
            <div class="card-sub">记录这次吸烟</div>
          </div>
          <div class="card-check"><i class="i-ph-check" /></div>
        </button>

        <button
          class="card"
          :class="{ selected: selected === 'urge' }"
          type="button"
          @click="choose('urge')"
        >
          <div class="card-icon" style="background: rgba(255,149,0,0.12); color: var(--orange)">
            <i class="i-ph-flame" />
          </div>
          <div class="card-text">
            <div class="card-title">特别想抽</div>
            <div class="card-sub">记录烟瘾冲动</div>
          </div>
          <div class="card-check"><i class="i-ph-check" /></div>
        </button>

        <button
          class="card"
          :class="{ selected: selected === 'none' }"
          type="button"
          @click="choose('none')"
        >
          <div class="card-icon" style="background: rgba(142,142,147,0.12); color: var(--text2)">
            <i class="i-ph-check-circle" />
          </div>
          <div class="card-text">
            <div class="card-title">没抽</div>
            <div class="card-sub">成功避免了吸烟</div>
          </div>
          <div class="card-check"><i class="i-ph-check" /></div>
        </button>
      </div>

      <div v-if="showReason" class="reason">
        <div class="reason-label">{{ reasonLabel }}</div>
        <div class="reason-grid">
          <button
            v-for="t in TRIGGERS"
            :key="t"
            class="reason-tag"
            :class="{ active: tags.has(t) }"
            type="button"
            @click="toggleTag(t)"
          >
            {{ t }}
          </button>
        </div>
      </div>

      <div v-if="showReason" class="note">
        <div class="note-label">其他原因...</div>
        <textarea
          v-model="note"
          class="note-input"
          rows="2"
          placeholder="补充一些细节（可选）"
        />
      </div>
    </div>

    <div class="done-wrap">
      <button class="done-btn" :class="{ disabled: !selected }" type="button" :disabled="!selected" @click="submit">
        已记录
      </button>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100dvh; }
.body { padding: 8px 20px 24px; }

.action-cards { display: flex; flex-direction: column; gap: 12px; }

.card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 16px;
  background: var(--card);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.25s var(--spring);
  box-shadow: var(--shadow);
  text-align: left;
}
.card:active { transform: scale(0.985); }
.card.selected { border-color: var(--green); background: rgba(52, 199, 89, 0.08); }

.card-icon {
  width: 46px; height: 46px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; flex-shrink: 0;
}
.card-text { flex: 1; }
.card-title { font-size: 17px; font-weight: 600; color: var(--text); line-height: 1.3; }
.card-sub { font-size: 13px; color: var(--text2); margin-top: 3px; }

.card-check {
  width: 24px; height: 24px; border-radius: 50%;
  border: 2px solid var(--sep);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; color: #fff; flex-shrink: 0;
  opacity: 0; transform: scale(0.3); transition: all 0.3s var(--spring);
}
.card.selected .card-check { opacity: 1; transform: scale(1); background: var(--green); border-color: transparent; }

.reason { margin-top: 28px; }
.reason-label { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 14px; padding-left: 4px; }
.reason-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.reason-tag {
  padding: 13px 8px; border-radius: 12px;
  background: var(--card); border: 1.5px solid var(--sep);
  font-size: 14px; font-weight: 500; color: var(--text);
  cursor: pointer; transition: all 0.2s var(--spring);
  box-shadow: var(--shadow);
}
.reason-tag:active { transform: scale(0.95); }
.reason-tag.active { border-color: var(--green); background: rgba(52, 199, 89, 0.08); color: var(--green); }

.note { margin-top: 24px; }
.note-label { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 12px; padding-left: 4px; }
.note-input {
  width: 100%; padding: 14px 16px; border-radius: 16px;
  border: 1.5px solid var(--sep); background: var(--card);
  font-size: 15px; font-family: inherit; color: var(--text);
  resize: none; outline: none; line-height: 1.5;
  transition: border-color 0.25s var(--spring), box-shadow 0.25s var(--spring);
}
.note-input:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.12); }
.note-input::placeholder { color: var(--text3); }

.done-wrap { padding: 12px 20px calc(var(--safe-bottom) + 16px); }
.done-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; height: 54px; border-radius: 16px; border: none;
  background: var(--green); color: #fff; font-size: 17px; font-weight: 600;
  font-family: inherit; cursor: pointer; transition: all 0.2s var(--spring);
}
.done-btn:active { transform: scale(0.97); opacity: 0.9; }
.done-btn.disabled { background: rgba(142, 142, 147, 0.12); color: var(--text3); cursor: default; pointer-events: none; }
</style>
