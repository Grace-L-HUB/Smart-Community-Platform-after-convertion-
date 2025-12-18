<template>
  <v-container fluid>
    <!-- 页面标题 -->
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">经营概览</h1>
        <p class="text-body-2 text-grey mt-1">{{ shopSettings.name }}</p>
      </div>
      <v-spacer />
      <v-chip color="success" variant="tonal" size="small">
        <v-icon start icon="mdi-clock-outline" />
        营业中 {{ shopSettings.businessHours.start }} - {{ shopSettings.businessHours.end }}
      </v-chip>
    </div>

    <!-- 统计卡片 -->
    <v-row class="mb-6">
      <v-col cols="12" sm="4">
        <stat-card
          title="今日订单"
          :value="stats.todayOrders"
          suffix="单"
          icon="mdi-receipt"
          color="primary"
          :trend="{ value: 15, type: 'up' }"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <stat-card
          title="今日营业额"
          :value="'¥' + stats.todayRevenue.toFixed(0)"
          icon="mdi-cash"
          color="success"
          :trend="{ value: 8.5, type: 'up' }"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <stat-card
          title="待处理订单"
          :value="stats.pendingOrders"
          icon="mdi-clipboard-alert"
          color="warning"
          @click="$router.push('/merchant/orders?status=new')"
        />
      </v-col>
    </v-row>

    <!-- 销售趋势 -->
    <v-row>
      <v-col cols="12" lg="8">
        <v-card rounded="lg">
          <v-card-title class="d-flex align-center">
            <span>销售趋势</span>
            <v-spacer />
            <v-chip size="small" variant="tonal">近7天</v-chip>
          </v-card-title>
          <v-card-text>
            <v-chart class="chart" :option="lineChartOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 快捷操作 -->
      <v-col cols="12" lg="4">
        <v-card rounded="lg" height="100%">
          <v-card-title>快捷操作</v-card-title>
          <v-card-text>
            <v-row>
              <v-col v-for="action in quickActions" :key="action.title" cols="6">
                <v-btn
                  :to="action.to"
                  variant="tonal"
                  :color="action.color"
                  block
                  height="70"
                  rounded="lg"
                  class="d-flex flex-column"
                >
                  <v-icon :icon="action.icon" size="24" class="mb-1" />
                  <span class="text-caption">{{ action.title }}</span>
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 最新订单 -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card rounded="lg">
          <v-card-title class="d-flex align-center">
            <span>最新订单</span>
            <v-spacer />
            <v-btn variant="text" color="primary" size="small" to="/merchant/orders">
              查看全部
            </v-btn>
          </v-card-title>
          <v-list density="compact">
            <v-list-item
              v-for="order in recentOrders"
              :key="order.id"
              :subtitle="`${order.products.map(p => p.name).join(', ')} · ¥${order.totalAmount}`"
            >
              <template #prepend>
                <v-avatar :color="getStatusColor(order.status)" size="36">
                  <v-icon :icon="getStatusIcon(order.status)" size="20" color="white" />
                </v-avatar>
              </template>
              <template #title>
                <span class="font-weight-medium">{{ order.orderNo }}</span>
                <v-chip size="x-small" :color="getStatusColor(order.status)" class="ml-2" variant="tonal">
                  {{ getStatusText(order.status) }}
                </v-chip>
              </template>
              <template #append>
                <span class="text-caption text-grey">{{ formatTime(order.createdAt) }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { useMerchantStore } from '@/stores'
import StatCard from '@/components/StatCard.vue'
import dayjs from 'dayjs'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

const merchantStore = useMerchantStore()

const stats = computed(() => merchantStore.stats)
const shopSettings = computed(() => merchantStore.shopSettings)
const recentOrders = computed(() => merchantStore.orders.slice(0, 5))

// 快捷操作
const quickActions = [
  { title: '处理订单', icon: 'mdi-receipt', color: 'primary', to: '/merchant/orders' },
  { title: '商品管理', icon: 'mdi-package-variant', color: 'success', to: '/merchant/products' },
  { title: '店铺设置', icon: 'mdi-store-cog', color: 'info', to: '/merchant/settings' },
  { title: '核销订单', icon: 'mdi-qrcode-scan', color: 'warning', to: '/merchant/orders' },
]

// 订单状态
function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    new: 'warning',
    accepted: 'info',
    preparing: 'primary',
    ready: 'success',
    completed: 'success',
    cancelled: 'error',
    refunded: 'error',
  }
  return colors[status] || 'grey'
}

function getStatusIcon(status: string) {
  const icons: Record<string, string> = {
    new: 'mdi-bell',
    accepted: 'mdi-check',
    preparing: 'mdi-chef-hat',
    ready: 'mdi-package-check',
    completed: 'mdi-check-all',
    cancelled: 'mdi-close',
    refunded: 'mdi-cash-refund',
  }
  return icons[status] || 'mdi-help'
}

function getStatusText(status: string) {
  const texts: Record<string, string> = {
    new: '新订单',
    accepted: '已接单',
    preparing: '准备中',
    ready: '待取餐',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款',
  }
  return texts[status] || status
}

function formatTime(time: string) {
  return dayjs(time).format('HH:mm')
}

// 销售趋势图
const lineChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    formatter: '{b}<br/>销售额: ¥{c}',
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
    data: stats.value.salesTrend.map(item => item.date),
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '¥{value}',
    },
  },
  series: [
    {
      name: '销售额',
      type: 'line',
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(76, 175, 80, 0.3)' },
            { offset: 1, color: 'rgba(76, 175, 80, 0.05)' },
          ],
        },
      },
      lineStyle: { color: '#4CAF50', width: 3 },
      itemStyle: { color: '#4CAF50' },
      data: stats.value.salesTrend.map(item => item.amount),
    },
  ],
}))

onMounted(() => {
  merchantStore.loadAll()
})

defineOptions({
  layout: 'admin',
})
</script>

<style scoped>
.chart {
  height: 280px;
}
</style>
