<template>
  <section class="timeline-wrapper">

    <!-- 标题 -->
    <div class="section-header">
      <h2>今天发生了什么</h2>
      <button
        class="lock-toggle"
        :class="{ locked: settings.timelineLocked }"
        type="button"
        @click="settings.toggleTimelineLock()"
      >
        {{ settings.timelineLocked ? '解锁轨迹' : '锁定轨迹' }}
      </button>
    </div>


    <!-- 时间线卡片 -->
    <div v-if="groups.length" class="journey-card" :class="{ locked: settings.timelineLocked }">


      <template v-for="(group, gi) in groups" :key="gi">

        <!-- 日期 -->
        <div class="date-label" >
          {{ group.dateLabel == '今天' ? '' : group.dateLabel }}
        </div>

        <div v-for="(item, index) in group.items" :key="item.id" class="event" :class="{ locked: settings.timelineLocked }" @click="!settings.timelineLocked && $emit('select', item)">


          <!-- 时间 -->
          <div class="time">
            {{ item.time }}
          </div>



          <!-- icon轨迹 -->
          <div class="track">


            <div class="icon-box" :style="{
              background: item.color + '18',
              color: item.color
            }">
              <i :class="item.iconClass" />
            </div>



            <div v-if="
              index !== group.items.length - 1
            " class="connector" />

          </div>



          <!-- 内容 -->
          <div class="content">


            <div class="title-row">


              <h3>
                {{ item.title }}
              </h3>



              <span v-if="item.badge" class="badge" :class="item.badgeType">

                <i v-if="item.badgeType === 'success'" class="i-ph-check-fat" />

                {{ item.badge }}

              </span>


            </div>



            <p v-if="item.desc">
              {{ item.desc }}
            </p>



          </div>


        </div>


      </template>



    </div>



    <!-- 空状态 -->
    <div v-else class="empty">

      <div class="empty-icon">
        🌱
      </div>

      <h3>
        今天开始恢复
      </h3>

      <p>
        记录你的第一个改变
      </p>


      <button @click="$emit('start')">
        开始记录
      </button>


    </div>


  </section>

  <!-- 回到顶部按钮 -->
  <Transition name="backtop">
    <button v-if="showBackTop" class="back-top" @click="scrollToTop">
      <i class="i-ph-caret-up" />
    </button>
  </Transition>
</template>




<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import type { EventType, EventAction } from '@/types/event'

const settings = useSettingsStore()

interface TimelineItem {

  id: string

  time: string

  timestamp: number

  type: EventType

  action: EventAction

  color: string

  iconClass: string

  title: string

  desc?: string

  badge?: string

  badgeType?:
  'success'
  |
  'neutral'
  |
  'warn'

  detail: Record<string, string>

}



interface TimelineGroup {

  dateLabel: string

  items: TimelineItem[]

}



defineProps<{
  groups: TimelineGroup[]
}>()



defineEmits<{

  select: [item: TimelineItem]

  start: []

}>()


/* ===== 回到顶部 ===== */
const showBackTop = ref(false)

function onScroll() {
  showBackTop.value = window.scrollY > window.innerHeight * 0.8
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

</script>




<style scoped>
.timeline-wrapper {


  margin:

    0 24px 140px;


}

.date-label { 
      color: var(--text2);
      
}

/* 标题区域 */

.section-header {


  display: flex;


  align-items: flex-end;


  justify-content: space-between;


  margin-bottom:

    16px;


}



.section-header h2 {


  margin: 0;


  font-size:

    20px;


  font-weight:

    750;


  letter-spacing:

    -0.4px;


}



.lock-toggle {
  font-size: 13px;
  color: var(--green);
  background: transparent;
  border: none;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s var(--spring);
  -webkit-tap-highlight-color: transparent;
}
.lock-toggle.locked {
  color: var(--red);
  background: rgba(255, 59, 48, 0.08);
}
.lock-toggle:active {
  transform: scale(0.95);
  opacity: 0.7;
}

/* 锁定后事件不可点击 */
.event.locked {
  cursor: not-allowed;
  opacity: 0.85;
}
.event.locked:active {
  transform: none;
}





/* 主卡片 */

.journey-card {


  padding:

    22px;


  border-radius:

    30px;


  background:

    var(--card);


  backdrop-filter:

    blur(25px);


  -webkit-backdrop-filter:

    blur(25px);


  box-shadow:

    0 10px 35px rgba(0, 0, 0, .06);


  border:

    1px solid var(--sep);


}



/* 单个事件 */

.event {


  display: flex;


  position: relative;


  cursor: pointer;


}



.event:last-child .content {


  padding-bottom:

    0;


}



/* 时间 */


.time {


  width:

    45px;


  padding-top:

    10px;


  font-size:

    13px;


  font-weight:

    500;


  color:

    #8E8E93;


  font-variant-numeric:

    tabular-nums;


}




/* 中间轨迹 */


.track {


  width:

    48px;


  display: flex;


  flex-direction: column;


  align-items: center;


}



.icon-box {


  width:

    42px;


  height:

    42px;


  border-radius:

    16px;


  display: flex;


  align-items: center;


  justify-content: center;


  font-size:

    19px;


  flex-shrink: 0;


}



/* 连接线 */


.connector {


  width:

    2px;


  flex:

    1;


  min-height:

    35px;


  background:

    var(--sep);


  margin:

    8px 0;


}





/* 内容 */


.content {


  flex:

    1;


  padding:

    8px 0 28px 14px;


}




.title-row {


  display: flex;


  align-items: center;


  gap:

    8px;


  flex-wrap: wrap;


}



h3 {


  margin:

    0;


  font-size:

    17px;


  font-weight:

    700;


  letter-spacing:

    -0.2px;


  color:

    var(--text);


}



.content p {


  margin:

    7px 0 0;


  font-size:

    14px;


  line-height:

    1.45;


  color:

    var(--text2);


}





.badge {


  display: inline-flex;


  align-items: center;


  gap:

    3px;


  padding:

    4px 10px;


  border-radius:

    20px;


  font-size:

    12px;


  font-weight:

    600;


}



.success {


  background:

    rgba(52, 199, 89, .12);


  color:

    #34C759;


}



.neutral {


  background:

    rgba(142, 142, 147, .12);


  color:

    #8E8E93;


}



.warn {


  background:

    rgba(255, 149, 0, .12);


  color:

    #FF9500;


}



/* 空状态 */


.empty {


  height:

    280px;


  border-radius:

    30px;


  background:

    var(--card);


  display: flex;


  flex-direction: column;


  align-items: center;


  justify-content: center;


}



.empty-icon {


  font-size:

    40px;


}



.empty h3 {


  margin:

    12px 0 4px;


}



.empty p {


  margin:

    0;


  color:

    #8E8E93;


  font-size:

    14px;


}



.empty button {


  margin-top:

    20px;


  padding:

    10px 28px;


  border:

    0;


  border-radius:

    24px;


  background:

    #34C759;


  color: white;


  font-weight:

    600;


}


/* 回到顶部 */
.back-top {
  position: fixed;
  right: 20px;
  bottom: calc(var(--safe-bottom) + 120px);
  z-index: 90;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 0.5px solid var(--dock-border);
  background: var(--dock-glass);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  box-shadow: var(--dock-shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  color: var(--text);
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s var(--spring);
}

.back-top:active {
  transform: scale(0.88);
}

.backtop-enter-active {
  transition: all 0.3s var(--spring);
}

.backtop-leave-active {
  transition: all 0.2s ease-in;
}

.backtop-enter-from,
.backtop-leave-to {
  opacity: 0;
  transform: scale(0.6) translateY(12px);
}
</style>