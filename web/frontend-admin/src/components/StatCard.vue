<template>
  <v-card
    class="stat-card"
    :style="{ '--accent-color': colorValue }"
    rounded="lg"
    hover
    @click="$emit('click')"
  >
    <v-card-text class="d-flex align-center pa-4">
      <div class="flex-grow-1">
        <div class="text-body-2 text-grey-darken-1 mb-1">{{ title }}</div>
        <div class="d-flex align-end">
          <span class="text-h4 font-weight-bold">{{ value }}</span>
          <span v-if="suffix" class="text-body-1 text-grey ml-1">{{ suffix }}</span>
        </div>
        <div v-if="trend" class="d-flex align-center mt-1">
          <v-icon
            :icon="trend.type === 'up' ? 'mdi-trending-up' : 'mdi-trending-down'"
            :color="trend.type === 'up' ? 'success' : 'error'"
            size="16"
          />
          <span
            class="text-caption ml-1"
            :class="trend.type === 'up' ? 'text-success' : 'text-error'"
          >
            {{ trend.value }}%
          </span>
          <span class="text-caption text-grey ml-1">较昨日</span>
        </div>
      </div>
      <v-avatar :color="color" size="56" class="stat-icon">
        <v-icon :icon="icon" size="28" color="white" />
      </v-avatar>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'

interface Props {
  title: string
  value: number | string
  suffix?: string
  icon: string
  color: string
  trend?: {
    value: number
    type: 'up' | 'down'
  }
}

defineProps<Props>()
defineEmits(['click'])

const theme = useTheme()

const colorValue = computed(() => {
  // 获取颜色值用于 CSS 变量
  return theme.current.value.colors.primary
})
</script>

<style scoped>
.stat-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid var(--accent-color, #1976d2);
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
}
</style>
