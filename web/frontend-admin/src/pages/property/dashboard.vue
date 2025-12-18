<template>
  <v-container fluid>
    <!-- 页面标题 -->
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">工作台</h1>
        <p class="text-body-2 text-grey mt-1">欢迎回来，{{ userName }}</p>
      </div>
      <v-spacer />
      <v-chip color="primary" variant="tonal" size="small">
        <v-icon start icon="mdi-clock-outline" />
        {{ currentTime }}
      </v-chip>
    </div>

    <!-- 统计卡片 -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" lg="3">
        <stat-card
          title="待处理工单"
          :value="stats.pendingWorkOrders"
          icon="mdi-clipboard-alert"
          color="warning"
          :trend="{ value: 12, type: 'up' }"
          @click="$router.push('/property/work-orders?status=pending')"
        />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <stat-card
          title="今日报修"
          :value="stats.todayRepairs"
          icon="mdi-wrench"
          color="info"
          :trend="{ value: 5, type: 'down' }"
        />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <stat-card
          title="小区住户"
          :value="stats.totalResidents"
          suffix="户"
          icon="mdi-account-group"
          color="success"
        />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <stat-card
          title="物业费收缴率"
          :value="(stats.feeCollectionRate * 100).toFixed(1)"
          suffix="%"
          icon="mdi-cash-check"
          color="primary"
          :trend="{ value: 3.2, type: 'up' }"
        />
      </v-col>
    </v-row>

    <!-- 图表区 -->
    <v-row>
      <!-- 工单趋势图 -->
      <v-col cols="12" lg="8">
        <v-card rounded="lg">
          <v-card-title class="d-flex align-center">
            <span>工单趋势</span>
            <v-spacer />
            <v-chip size="small" variant="tonal">近7天</v-chip>
          </v-card-title>
          <v-card-text>
            <v-chart class="chart" :option="lineChartOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 报修类型分布 -->
      <v-col cols="12" lg="4">
        <v-card rounded="lg" height="100%">
          <v-card-title>报修类型分布</v-card-title>
          <v-card-text>
            <v-chart class="chart" :option="pieChartOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 快捷操作 & 待办 -->
    <v-row class="mt-4">
      <!-- 快捷操作 -->
      <v-col cols="12" md="6">
        <v-card rounded="lg">
          <v-card-title>快捷操作</v-card-title>
          <v-card-text>
            <v-row>
              <v-col v-for="action in quickActions" :key="action.title" cols="6" sm="4">
                <v-btn
                  :to="action.to"
                  variant="tonal"
                  :color="action.color"
                  block
                  height="80"
                  rounded="lg"
                  class="d-flex flex-column"
                >
                  <v-icon :icon="action.icon" size="28" class="mb-1" />
                  <span class="text-caption">{{ action.title }}</span>
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 待审核住户 -->
      <v-col cols="12" md="6">
        <v-card rounded="lg">
          <v-card-title class="d-flex align-center">
            <span>待审核住户</span>
            <v-spacer />
            <v-btn
              variant="text"
              color="primary"
              size="small"
              to="/property/residents/audit"
            >
              查看全部
            </v-btn>
          </v-card-title>
          <v-list density="compact">
            <v-list-item
              v-for="resident in pendingResidents.slice(0, 4)"
              :key="resident.id"
              :subtitle="resident.houseAddress"
            >
              <template #prepend>
                <v-avatar color="primary" size="36">
                  <span class="text-body-2">{{ resident.name.charAt(0) }}</span>
                </v-avatar>
              </template>
              <template #title>
                <span>{{ resident.name }}</span>
                <v-chip
                  size="x-small"
                  :color="resident.identity === 'owner' ? 'primary' : 'secondary'"
                  class="ml-2"
                >
                  {{ resident.identity === 'owner' ? '业主' : resident.identity === 'tenant' ? '租客' : '家属' }}
                </v-chip>
              </template>
              <template #append>
                <v-btn size="small" color="success" variant="tonal" class="mr-1">通过</v-btn>
                <v-btn size="small" color="error" variant="tonal">拒绝</v-btn>
              </template>
            </v-list-item>
            <v-list-item v-if="pendingResidents.length === 0">
              <v-list-item-title class="text-center text-grey">
                暂无待审核住户
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { usePropertyStore, useAuthStore } from '@/stores'
import StatCard from '@/components/StatCard.vue'

// 注册 ECharts 组件
use([CanvasRenderer, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent])

const propertyStore = usePropertyStore()
const authStore = useAuthStore()

const userName = computed(() => authStore.userName)
const stats = computed(() => propertyStore.stats)
const pendingResidents = computed(() => propertyStore.pendingResidents)

// 当前时间
const currentTime = ref('')
function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}
updateTime()

// 快捷操作
const quickActions = [
  { title: '发布公告', icon: 'mdi-bullhorn', color: 'primary', to: '/property/announcements' },
  { title: '生成账单', icon: 'mdi-receipt-text', color: 'success', to: '/property/fees' },
  { title: '住户审核', icon: 'mdi-account-check', color: 'warning', to: '/property/residents/audit' },
  { title: '工单处理', icon: 'mdi-clipboard-list', color: 'info', to: '/property/work-orders' },
  { title: '门禁日志', icon: 'mdi-door', color: 'secondary', to: '/property/access-logs' },
  { title: '员工管理', icon: 'mdi-account-tie', color: 'error', to: '/property/employees' },
]

// 工单趋势折线图配置
const lineChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: stats.value.workOrderTrend.map(item => item.date),
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: '工单数',
      type: 'line',
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(25, 118, 210, 0.3)' },
            { offset: 1, color: 'rgba(25, 118, 210, 0.05)' },
          ],
        },
      },
      lineStyle: {
        color: '#1976D2',
        width: 3,
      },
      itemStyle: {
        color: '#1976D2',
      },
      data: stats.value.workOrderTrend.map(item => item.count),
    },
  ],
}))

// 报修类型饼图配置
const pieChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)',
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    top: 'center',
  },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['65%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: false,
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      data: stats.value.repairTypeDistribution.map(item => ({
        name: item.type,
        value: item.value,
      })),
    },
  ],
}))

onMounted(() => {
  propertyStore.loadAll()
})

defineOptions({
  layout: 'admin',
})
</script>

<style scoped>
.chart {
  height: 300px;
}
</style>
