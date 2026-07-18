<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { RecoveryPart } from '@/composables/useRecovery'
import { renderShareCard, shareCardAsImage, saveCardImage } from '@/composables/useShareCard'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  modelValue: boolean
  score: number
  parts: RecoveryPart[]
  band: string
}>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const toast = useToast()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const busy = ref(false)

function dateLabel(): string {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}
function filename(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `正是修行时-恢复卡片-${d.getFullYear()}${m}${day}.png`
}

async function draw() {
  await nextTick()
  const c = canvasRef.value
  if (!c) return
  renderShareCard(c, { score: props.score, parts: props.parts, band: props.band, dateLabel: dateLabel() })
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) draw()
  },
)

function close() {
  emit('update:modelValue', false)
}

async function onShare() {
  const c = canvasRef.value
  if (!c || busy.value) return
  busy.value = true
  try {
    const r = await shareCardAsImage(c, filename(), '我的本周恢复指数 · 正是修行时')
    if (r === 'shared') toast.show('已打开分享面板')
    else if (r === 'saved') toast.show('已保存图片')
    else toast.show('生成图片失败')
  } catch {
    toast.show('生成图片失败')
  } finally {
    busy.value = false
  }
}

async function onSave() {
  const c = canvasRef.value
  if (!c || busy.value) return
  busy.value = true
  try {
    const ok = await saveCardImage(c, filename())
    toast.show(ok ? '已保存图片' : '保存失败')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <transition name="share-sheet">
    <div v-if="modelValue" class="share-mask" @click.self="close">
      <div class="share-sheet">
        <div class="grab" />
        <h3 class="sh-title">分享卡片</h3>

        <div class="preview">
          <canvas ref="canvasRef" class="card-canvas" />
        </div>

        <p class="tip">截图可分享到社交平台，或存到相册。iOS 点「分享」后选「存储图像」即可保存到照片。</p>

        <div class="acts">
          <button class="btn save" type="button" :disabled="busy" @click="onSave">
            <i class="i-ph-download-simple" /> 保存图片
          </button>
          <button class="btn share" type="button" :disabled="busy" @click="onShare">
            <i class="i-ph-share-network" /> 分享
          </button>
        </div>
        <button class="cancel" type="button" @click="close">取消</button>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.share-mask {
  position: fixed;
  inset: 0;
  z-index: 160;
  background: var(--overlay);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.share-sheet {
  width: 100%;
  max-width: 520px;
  padding: 8px 20px calc(var(--safe-bottom) + 18px);
  background: var(--sheet-bg);
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  border-top: 0.5px solid var(--sheet-border);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  box-shadow: var(--sheet-shadow);
}
.grab {
  width: 38px; height: 5px; border-radius: 3px; background: var(--text3);
  opacity: 0.5; margin: 6px auto 12px;
}
.sh-title { margin: 0 0 14px; font-size: 18px; font-weight: 700; color: var(--text); text-align: center; }

.preview { display: flex; justify-content: center; }
.card-canvas {
  max-width: 100%;
  max-height: 56vh;
  width: auto;
  height: auto;
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  display: block;
}
.tip { font-size: 12px; color: var(--text2); text-align: center; line-height: 1.5; margin: 14px 4px 4px; }

.acts { display: flex; gap: 12px; margin-top: 14px; }
.btn {
  flex: 1; padding: 14px; border: none; border-radius: 16px;
  font-size: 16px; font-weight: 600; cursor: pointer; font-family: inherit;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: transform 0.2s var(--spring);
}
.btn:active { transform: scale(0.97); }
.btn:disabled { opacity: 0.6; }
.btn.save { background: color-mix(in srgb, var(--blue) 14%, transparent); color: var(--blue); }
.btn.share { background: var(--green); color: #fff; }
.btn i { font-size: 18px; }

.cancel {
  margin-top: 12px; width: 100%; height: 48px; border-radius: 16px; border: none;
  background: rgba(142, 142, 147, 0.1); color: var(--text2); font-size: 16px; font-weight: 600;
  font-family: inherit; cursor: pointer;
}
.cancel:active { opacity: 0.8; }

.share-sheet-enter-active, .share-sheet-leave-active { transition: opacity 0.28s ease; }
.share-sheet-enter-active .share-sheet, .share-sheet-leave-active .share-sheet { transition: transform 0.32s var(--spring); }
.share-sheet-enter-from, .share-sheet-leave-to { opacity: 0; }
.share-sheet-enter-from .share-sheet, .share-sheet-leave-to .share-sheet { transform: translateY(100%); }
</style>
