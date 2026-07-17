<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'ghost'
  loading?: boolean
}>()
</script>

<template>
  <button
    :class="[
      variant === 'ghost' 
        ? 'px-4 py-2 text-calm-600 hover:bg-calm-100 rounded-gentle transition-colors' 
        : 'btn-primary',
      loading && 'opacity-70 cursor-not-allowed pointer-events-none'
    ]"
    :disabled="loading"
    :aria-busy="loading"
  >
    <span v-if="loading" class="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
    <slot />
  </button>
</template>