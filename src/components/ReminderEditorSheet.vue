<script setup lang="ts">
import { ref, watch } from 'vue'
import { useReminderStore, type Reminder } from '@/stores/reminderStore'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  open: boolean
  editing: Reminder | null
}>()
const emit = defineEmits<{
  'update:open': [boolean]
}>()

const store = useReminderStore()
const toast = useToast()

const title = ref('')
const body = ref('')
const time = ref('08:00')
const enabled = ref(true)
const sound = ref(true)

watch(
  () => props.open,
  (v) => {
    if (!v) return
    if (props.editing) {
      const r = props.editing
      title.value = r.title
      body.value = r.body
      time.value = `${String(r.hour).padStart(2, '0')}:${String(r.minute).padStart(2, '0')}`
      enabled.value = r.enabled
      sound.value = r.sound
    } else {
      title.value = ''
      body.value = ''
      time.value = '08:00'
      enabled.value = true
      sound.value = true
    }
  },
)

function close() {
  emit('update:open', false)
}

function save() {
  const t = title.value.trim()
  const b = body.value.trim()
  if (!t) {
    toast.show('请先填写提醒标题')
    return
  }
  if (!b) {
    toast.show('请先填写提醒内容')
    return
  }
  const [h, m] = time.value.split(':').map(Number)
  const data = {
    title: t,
    body: b,
    hour: h,
    minute: m,
    enabled: enabled.value,
    sound: sound.value,
  }
  if (props.editing) store.update(props.editing.id, data)
  else store.add(data)
  close()
}

function del() {
  if (props.editing) store.remove(props.editing.id)
  close()
}
</script>

<template>
  <transition name="rem-sheet">
    <div v-if="open" class="rem-mask" @click.self="close">
      <div class="rem-sheet">
        <div class="grab" />
        <h3 class="sh-title">{{ editing ? '编辑提醒' : '新增提醒' }}</h3>

        <label class="fld">
          <span>标题</span>
          <input v-model="title" class="inp" placeholder="如：称体重" maxlength="20" />
        </label>

        <label class="fld">
          <span>内容</span>
          <input v-model="body" class="inp" placeholder="如：该上秤啦 💪" maxlength="40" />
        </label>

        <label class="fld">
          <span>时间</span>
          <input v-model="time" type="time" class="inp time" />
        </label>

        <div class="row">
          <span>启用</span>
          <button class="sw" :class="{ on: enabled }" @click="enabled = !enabled">
            <i class="dot" />
          </button>
        </div>
        <div class="row">
          <span>提醒音</span>
          <button class="sw" :class="{ on: sound }" @click="sound = !sound">
            <i class="dot" />
          </button>
        </div>

        <div class="acts">
          <button v-if="editing" class="btn del" @click="del">删除</button>
          <button class="btn save" @click="save">保存</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.rem-mask {
  position: fixed;
  inset: 0;
  z-index: 150;
  background: var(--overlay);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.rem-sheet {
  width: 100%;
  max-width: 520px;
  padding: 8px 20px calc(var(--safe-bottom) + 20px);
  background: var(--sheet-bg);
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  border-top: 0.5px solid var(--sheet-border);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  box-shadow: var(--sheet-shadow);
}

.grab {
  width: 38px;
  height: 5px;
  border-radius: 3px;
  background: var(--text3);
  opacity: 0.5;
  margin: 6px auto 12px;
}
.sh-title {
  margin: 0 0 14px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.fld {
  display: block;
  margin-bottom: 14px;
}
.fld > span {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text2);
  margin-bottom: 6px;
}
.inp {
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 0.5px solid var(--sep);
  background: color-mix(in srgb, var(--bg) 60%, var(--card));
  color: var(--text);
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}
.inp:focus {
  border-color: var(--green);
}
.inp.time {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 1px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 2px;
  font-size: 16px;
  color: var(--text);
}
.sw {
  width: 51px;
  height: 31px;
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
  width: 27px;
  height: 27px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.25s var(--spring);
}
.sw.on .dot {
  transform: translateX(20px);
}

.acts {
  display: flex;
  gap: 12px;
  margin-top: 18px;
}
.btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s var(--spring);
}
.btn:active {
  transform: scale(0.97);
}
.btn.save {
  background: var(--green);
  color: #fff;
}
.btn.del {
  flex: 0 0 auto;
  padding: 14px 18px;
  background: color-mix(in srgb, var(--red) 14%, transparent);
  color: var(--red);
}

.rem-sheet-enter-active,
.rem-sheet-leave-active {
  transition: opacity 0.28s ease;
}
.rem-sheet-enter-active .rem-sheet,
.rem-sheet-leave-active .rem-sheet {
  transition: transform 0.32s var(--spring);
}
.rem-sheet-enter-from,
.rem-sheet-leave-to {
  opacity: 0;
}
.rem-sheet-enter-from .rem-sheet,
.rem-sheet-leave-to .rem-sheet {
  transform: translateY(100%);
}
</style>
