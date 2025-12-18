<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">门禁日志</h1>
      <v-chip color="info" class="ml-3" size="small">
        今日 {{ todayCount }} 条记录
      </v-chip>
    </div>

    <!-- 筛选 -->
    <v-card rounded="lg" class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="3">
            <v-select
              v-model="filterMethod"
              :items="methodOptions"
              label="开门方式"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filterLocation"
              :items="locationOptions"
              label="位置"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="filterKeyword"
              label="搜索"
              placeholder="姓名"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 日志列表 -->
    <v-card rounded="lg">
      <v-data-table
        :headers="headers"
        :items="filteredLogs"
        :items-per-page="15"
        class="elevation-0"
      >
        <template #item.personName="{ item }">
          <div class="d-flex align-center">
            <v-avatar color="primary" size="32" class="mr-2">
              <span class="text-body-2">{{ item.personName.charAt(0) }}</span>
            </v-avatar>
            {{ item.personName }}
          </div>
        </template>

        <template #item.method="{ item }">
          <v-chip
            size="small"
            :color="getMethodColor(item.method)"
            variant="tonal"
          >
            <v-icon start :icon="getMethodIcon(item.method)" size="14" />
            {{ getMethodText(item.method) }}
          </v-chip>
        </template>

        <template #item.direction="{ item }">
          <v-chip
            size="small"
            :color="item.direction === 'in' ? 'success' : 'warning'"
            variant="flat"
          >
            <v-icon start :icon="item.direction === 'in' ? 'mdi-arrow-down' : 'mdi-arrow-up'" size="14" />
            {{ item.direction === 'in' ? '进入' : '离开' }}
          </v-chip>
        </template>

        <template #item.timestamp="{ item }">
          {{ formatTime(item.timestamp) }}
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { usePropertyStore } from '@/stores'
import dayjs from 'dayjs'

const propertyStore = usePropertyStore()

// 筛选
const filterMethod = ref<string | null>(null)
const filterLocation = ref<string | null>(null)
const filterKeyword = ref('')

const methodOptions = [
  { title: '人脸识别', value: 'face' },
  { title: '二维码', value: 'qrcode' },
  { title: '刷卡', value: 'card' },
  { title: '密码', value: 'password' },
]

const locationOptions = ['1栋东门', '2栋西门', '南大门', '北大门']

// 表格
const headers = [
  { title: '人员', key: 'personName' },
  { title: '开门方式', key: 'method' },
  { title: '位置', key: 'location' },
  { title: '方向', key: 'direction' },
  { title: '时间', key: 'timestamp' },
]

// 今日记录数
const todayCount = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  return propertyStore.accessLogs.filter(log =>
    log.timestamp.startsWith(today)
  ).length
})

// 筛选后的日志
const filteredLogs = computed(() => {
  return propertyStore.accessLogs.filter(log => {
    if (filterMethod.value && log.method !== filterMethod.value) return false
    if (filterLocation.value && log.location !== filterLocation.value) return false
    if (filterKeyword.value && !log.personName.includes(filterKeyword.value)) return false
    return true
  })
})

function getMethodColor(method: string) {
  const colors: Record<string, string> = {
    face: 'primary',
    qrcode: 'success',
    card: 'info',
    password: 'warning',
  }
  return colors[method] || 'grey'
}

function getMethodIcon(method: string) {
  const icons: Record<string, string> = {
    face: 'mdi-face-recognition',
    qrcode: 'mdi-qrcode-scan',
    card: 'mdi-card-account-details',
    password: 'mdi-form-textbox-password',
  }
  return icons[method] || 'mdi-door'
}

function getMethodText(method: string) {
  const texts: Record<string, string> = {
    face: '人脸',
    qrcode: '二维码',
    card: '刷卡',
    password: '密码',
  }
  return texts[method] || method
}

function formatTime(time: string) {
  return dayjs(time).format('HH:mm:ss')
}

onMounted(() => {
  propertyStore.loadAll()
})

defineOptions({
  layout: 'admin',
})
</script>
