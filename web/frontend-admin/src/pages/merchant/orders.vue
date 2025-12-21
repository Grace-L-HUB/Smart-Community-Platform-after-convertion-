<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">订单管理</h1>
      <v-spacer />
      <!-- 核销入口 -->
      <v-btn color="warning" prepend-icon="mdi-qrcode-scan" @click="verifyDialog = true">
        核销码验证
      </v-btn>
    </div>

    <!-- 状态 Tabs -->
    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab value="new">
        新订单
        <v-badge v-if="newOrders.length" :content="newOrders.length" color="error" inline />
      </v-tab>
      <v-tab value="processing">进行中</v-tab>
      <v-tab value="completed">已完成</v-tab>
      <v-tab value="cancelled">退款/取消</v-tab>
    </v-tabs>

    <!-- 订单列表 -->
    <v-row>
      <v-col
        v-for="order in currentOrders"
        :key="order.id"
        cols="12"
        sm="6"
        lg="4"
      >
        <v-card rounded="lg" class="order-card" :class="{ 'order-new': order.status === 'new' }">
          <v-card-title class="d-flex align-center pb-0">
            <span class="text-body-1 font-weight-medium">{{ order.orderNo }}</span>
            <v-spacer />
            <v-chip size="small" :color="getStatusColor(order.status)" variant="flat">
              {{ getStatusText(order.status) }}
            </v-chip>
          </v-card-title>

          <v-card-text>
            <!-- 商品列表 -->
            <div class="mb-3">
              <div
                v-for="(product, i) in order.products"
                :key="i"
                class="d-flex justify-space-between text-body-2"
              >
                <span>{{ product.name }} x{{ product.quantity }}</span>
                <span>¥{{ (product.price * product.quantity).toFixed(2) }}</span>
              </div>
            </div>

            <v-divider class="my-2" />

            <!-- 订单信息 -->
            <div class="text-body-2 mb-1">
              <v-icon icon="mdi-account" size="14" /> {{ order.customerName }}
            </div>
            <div v-if="order.pickupType === 'delivery'" class="text-body-2 mb-1">
              <v-icon icon="mdi-map-marker" size="14" /> {{ order.address }}
            </div>
            <div v-else class="text-body-2 mb-1">
              <v-icon icon="mdi-store" size="14" /> 到店自提
              <v-chip v-if="order.pickupCode" size="x-small" color="warning" class="ml-1">
                取餐码: {{ order.pickupCode }}
              </v-chip>
            </div>
            <div v-if="order.note" class="text-body-2 text-grey">
              <v-icon icon="mdi-note" size="14" /> {{ order.note }}
            </div>

            <v-divider class="my-2" />

            <div class="d-flex justify-space-between align-center">
              <span class="text-h6 font-weight-bold text-primary">¥{{ order.totalAmount.toFixed(2) }}</span>
              <span class="text-caption text-grey">{{ formatTime(order.createdAt) }}</span>
            </div>
          </v-card-text>

          <!-- 操作按钮 -->
          <v-card-actions v-if="order.status === 'new'">
            <v-btn color="error" variant="text" @click="rejectOrder(order)">拒单</v-btn>
            <v-spacer />
            <v-btn color="success" variant="flat" @click="acceptOrder(order)">接单</v-btn>
          </v-card-actions>

          <v-card-actions v-else-if="order.status === 'accepted'">
            <v-spacer />
            <v-btn color="primary" variant="flat" @click="updateStatus(order, 'preparing')">
              开始制作
            </v-btn>
          </v-card-actions>

          <v-card-actions v-else-if="order.status === 'preparing'">
            <v-spacer />
            <v-btn color="success" variant="flat" @click="updateStatus(order, 'ready')">
              制作完成
            </v-btn>
          </v-card-actions>

          <v-card-actions v-else-if="order.status === 'ready'">
            <v-spacer />
            <v-btn color="success" variant="flat" @click="updateStatus(order, 'completed')">
              确认完成
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-alert v-if="currentOrders.length === 0" type="info" variant="tonal" class="mt-4">
      暂无{{ tabTitles[activeTab] }}订单
    </v-alert>

    <!-- 核销弹窗 -->
    <v-dialog v-model="verifyDialog" max-width="400">
      <v-card>
        <v-card-title>
          <v-icon icon="mdi-qrcode-scan" class="mr-2" />
          核销码验证
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="pickupCode"
            label="请输入6位取餐码"
            variant="outlined"
            maxlength="6"
            counter
            autofocus
            @keyup.enter="verifyCode"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="verifyDialog = false">取消</v-btn>
          <v-btn color="success" variant="flat" @click="verifyCode">验证</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 拒单弹窗 -->
    <v-dialog v-model="rejectDialog" max-width="400">
      <v-card>
        <v-card-title class="text-error">拒绝订单</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="rejectReason"
            label="拒单原因"
            variant="outlined"
            rows="3"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="rejectDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" @click="confirmReject">确认拒单</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="top">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useMerchantStore, type Order } from '@/stores/merchant'
import dayjs from 'dayjs'

const merchantStore = useMerchantStore()

// Tabs
const activeTab = ref('new')
const tabTitles: Record<string, string> = {
  new: '新',
  processing: '进行中',
  completed: '已完成',
  cancelled: '退款/取消',
}

// 各状态订单
const newOrders = computed(() => merchantStore.newOrders)
const processingOrders = computed(() => merchantStore.processingOrders)
const completedOrders = computed(() => merchantStore.completedOrders)
const cancelledOrders = computed(() => merchantStore.cancelledOrders)

const currentOrders = computed(() => {
  switch (activeTab.value) {
    case 'new': return newOrders.value
    case 'processing': return processingOrders.value
    case 'completed': return completedOrders.value
    case 'cancelled': return cancelledOrders.value
    default: return []
  }
})

// 状态显示
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

function getStatusText(status: string) {
  const texts: Record<string, string> = {
    new: '新订单',
    accepted: '已接单',
    preparing: '制作中',
    ready: '待取餐',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款',
  }
  return texts[status] || status
}

function formatTime(time: string) {
  return dayjs(time).format('MM-DD HH:mm')
}

// 订单操作
async function acceptOrder(order: Order) {
  try {
    await merchantStore.acceptOrder(order.id)
    showSnackbar('success', '已接单')
  } catch (error) {
    console.error('接单失败:', error)
    showSnackbar('error', error instanceof Error ? error.message : '接单失败，请重试')
  }
}

async function updateStatus(order: Order, status: Order['status']) {
  try {
    await merchantStore.updateOrderStatus(order.id, status)
    showSnackbar('success', '状态已更新')
  } catch (error) {
    console.error('状态更新失败:', error)
    showSnackbar('error', error instanceof Error ? error.message : '状态更新失败，请重试')
  }
}

// 拒单
const rejectDialog = ref(false)
const rejectingOrder = ref<Order | null>(null)
const rejectReason = ref('')

function rejectOrder(order: Order) {
  rejectingOrder.value = order
  rejectReason.value = ''
  rejectDialog.value = true
}

async function confirmReject() {
  if (rejectingOrder.value) {
    try {
      await merchantStore.rejectOrder(rejectingOrder.value.id, rejectReason.value)
      showSnackbar('warning', '订单已拒绝')
      rejectDialog.value = false
    } catch (error) {
      console.error('拒单失败:', error)
      showSnackbar('error', error instanceof Error ? error.message : '拒单失败，请重试')
    }
  }
}

// 核销
const verifyDialog = ref(false)
const pickupCode = ref('')

async function verifyCode() {
  try {
    const result = await merchantStore.verifyPickupCode(pickupCode.value)
    if (result.success) {
      showSnackbar('success', result.message || '核销成功')
      verifyDialog.value = false
      pickupCode.value = ''
    } else {
      showSnackbar('error', result.message || '核销失败')
    }
  } catch (error) {
    console.error('核销失败:', error)
    showSnackbar('error', '核销失败，请重试')
  }
}

// 提示
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

function showSnackbar(color: string, text: string) {
  snackbarColor.value = color
  snackbarText.value = text
  snackbar.value = true
}

onMounted(() => {
  merchantStore.loadAll()
})

defineOptions({
  layout: 'admin',
})
</script>

<style scoped>
.order-card {
  transition: all 0.3s;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.order-new {
  border-left: 4px solid rgb(var(--v-theme-warning));
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(255, 152, 0, 0); }
}
</style>
