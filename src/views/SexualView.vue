<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '@/stores/eventStore'
import { useToast } from '@/composables/useToast'
import PageNav from '@/components/PageNav.vue'

const router = useRouter()
const store = useEventStore()
const toast = useToast()

type SexType = 'normal' | 'urge' | 'control'
type SexResult = 'controlled' | 'uncontrolled'

const selected = ref<SexType | null>(null)
const result = ref<SexResult | null>(null)

function choose(type: SexType) {
  selected.value = selected.value === type ? null : type
  if (selected.value !== 'urge') result.value = null
}

function chooseResult(r: SexResult) {
  result.value = r
}

const canSubmit = computed(() => {
  if (!selected.value) return false
  if (selected.value === 'urge') return result.value !== null
  return true
})

function submit() {
  if (!canSubmit.value || !selected.value) return
  let ev
  let text = '已记录'
  if (selected.value === 'normal') {
    ev = store.recordSexual('normal')
    text = '已记录 · 正常生活'
  } else if (selected.value === 'urge') {
    const controlled = result.value === 'controlled'
    ev = store.recordSexual('urge', controlled)
    text = controlled ? '已记录 · 成功控制' : '已记录 · 没关系，继续加油'
  } else {
    ev = store.recordSexual('control')
    text = '已记录 · 自控'
  }
  toast.show(text, { undoAction: () => store.removeEvent(ev.id) })
  router.back()
}
</script>

<template>
  <div class="page">
    <PageNav title="自控" :show-back="true" />

    <div class="body">
      <div class="hint">记录冲动，掌控自己</div>

      <div class="option-cards">
        <button
          class="option-card"
          :class="{ 'sel-normal': selected === 'normal' }"
          type="button"
          @click="choose('normal')"
        >
          <div class="card-icon" style="background: rgba(255,45,85,0.12); color: var(--pink)">
            <i class="i-ph-heart" />
          </div>
          <div class="card-text">
            <div class="card-title">正常生活</div>
            <div class="card-desc">正常的亲密关系</div>
          </div>
          <div class="card-check"><i class="i-ph-check" /></div>
        </button>

        <button
          class="option-card"
          :class="{ 'sel-urge': selected === 'urge' }"
          type="button"
          @click="choose('urge')"
        >
          <div class="card-icon" style="background: rgba(255,149,0,0.12); color: var(--orange)">
            <i class="i-ph-flame" />
          </div>
          <div class="card-text">
            <div class="card-title">冲动</div>
            <div class="card-desc">出现了冲动</div>
          </div>
          <div class="card-check"><i class="i-ph-check" /></div>
        </button>

        <button
          class="option-card"
          :class="{ 'sel-control': selected === 'control' }"
          type="button"
          @click="choose('control')"
        >
          <div class="card-icon" style="background: rgba(52,199,89,0.12); color: var(--green)">
            <i class="i-ph-shield" />
          </div>
          <div class="card-text">
            <div class="card-title">自控</div>
            <div class="card-desc">成功控制了冲动</div>
          </div>
          <div class="card-check"><i class="i-ph-check" /></div>
        </button>
      </div>

      <div v-if="selected === 'urge'" class="result">
        <div class="result-question">结果如何？</div>
        <div class="result-buttons">
          <button
            class="result-btn"
            :class="result === 'controlled' && 'btn-controlled'"
            type="button"
            @click="chooseResult('controlled')"
          >
            <i class="i-ph-check-fat" /> 控制住
          </button>
          <button
            class="result-btn"
            :class="result === 'uncontrolled' && 'btn-uncontrolled'"
            type="button"
            @click="chooseResult('uncontrolled')"
          >
            <i class="i-ph-x" /> 没控制
          </button>
        </div>
      </div>
    </div>

    <div class="done-wrap">
      <button class="done-btn" :class="{ disabled: !canSubmit }" type="button" :disabled="!canSubmit" @click="submit">
        完成
      </button>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100dvh; }
.body { padding: 4px 20px 24px; }

.hint { font-size: 24px; font-weight: 700; color: var(--text); letter-spacing: -0.3px; margin: 8px 0 20px; padding-left: 4px; }

.option-cards { display: flex; flex-direction: column; gap: 12px; }
.option-card {
  display: flex; align-items: center; gap: 16px;
  padding: 18px 20px; border-radius: 16px; background: var(--card);
  border: 2px solid transparent; cursor: pointer;
  transition: all 0.25s var(--spring); box-shadow: var(--shadow); text-align: left;
}
.option-card:active { transform: scale(0.98); }
.sel-normal { border-color: var(--pink); box-shadow: 0 0 0 1px var(--pink), var(--shadow); }
.sel-urge { border-color: var(--orange); box-shadow: 0 0 0 1px var(--orange), var(--shadow); }
.sel-control { border-color: var(--green); box-shadow: 0 0 0 1px var(--green), var(--shadow); }

.card-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.card-text { flex: 1; min-width: 0; }
.card-title { font-size: 17px; font-weight: 600; color: var(--text); line-height: 1.3; }
.card-desc { font-size: 13px; color: var(--text2); margin-top: 2px; }

.card-check {
  width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--sep);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; color: #fff; flex-shrink: 0;
  opacity: 0; transform: scale(0.3); transition: all 0.25s var(--spring);
}
.sel-normal .card-check,
.sel-urge .card-check,
.sel-control .card-check { opacity: 1; transform: scale(1); border-color: transparent; }
.sel-normal .card-check { background: var(--pink); }
.sel-urge .card-check { background: var(--orange); }
.sel-control .card-check { background: var(--green); }

.result { margin-top: 16px; }
.result-question { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 14px; text-align: center; }
.result-buttons { display: flex; gap: 12px; }
.result-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 16px 12px; border-radius: 14px; border: 2px solid var(--sep);
  cursor: pointer; font-size: 15px; font-weight: 600; background: var(--card);
  font-family: inherit; color: var(--text); transition: all 0.2s var(--spring);
}
.result-btn:active { transform: scale(0.96); }
.result-btn i { font-size: 24px; }
.btn-controlled { background: rgba(52, 199, 89, 0.12); border-color: var(--green); color: var(--green); }
.btn-uncontrolled { background: rgba(142, 142, 147, 0.08); border-color: transparent; color: var(--text2); }

.done-wrap { padding: 24px 20px calc(var(--safe-bottom) + 16px); }
.done-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; height: 54px; border-radius: 16px; border: none;
  background: var(--green); color: #fff; font-size: 17px; font-weight: 600;
  font-family: inherit; cursor: pointer; transition: all 0.2s var(--spring);
  box-shadow: 0 4px 16px rgba(52, 199, 89, 0.25);
}
.done-btn:active { transform: scale(0.97); opacity: 0.9; }
.done-btn.disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
.done-btn.disabled:active { transform: none; }
</style>
