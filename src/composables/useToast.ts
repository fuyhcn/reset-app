/**
 * 全局轻提示 composable（单例）
 *
 * 所有快速记录页共用一个 Toast：提交后弹出「已记录」，并提供 5s 内撤销。
 * 撤销回调由调用方传入（通常是 store.removeEvent(id)）。
 */
import { reactive } from 'vue'

interface ToastState {
  visible: boolean
  message: string
  undoLabel: string
  undoAction: (() => void) | null
}

const state = reactive<ToastState>({
  visible: false,
  message: '',
  undoLabel: '撤销',
  undoAction: null,
})

let timer: ReturnType<typeof setTimeout> | null = null

export function useToast() {
  /** 弹出提示 */
  function show(
    message: string,
    opts?: { undoAction?: () => void; undoLabel?: string; duration?: number },
  ) {
    if (timer) clearTimeout(timer)
    state.message = message
    state.undoLabel = opts?.undoLabel ?? '撤销'
    state.undoAction = opts?.undoAction ?? null
    state.visible = true
    timer = setTimeout(() => hide(), opts?.duration ?? 5000)
  }

  /** 隐藏提示 */
  function hide() {
    state.visible = false
    state.undoAction = null
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  /** 执行撤销并隐藏 */
  function undo() {
    if (state.undoAction) state.undoAction()
    hide()
  }

  return { state, show, hide, undo }
}
