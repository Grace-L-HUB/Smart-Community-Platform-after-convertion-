<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">工单中心</h1>
      <v-spacer />
      <v-btn-toggle v-model="viewMode" mandatory density="compact" class="mr-2">
        <v-btn value="list" icon="mdi-format-list-bulleted" />
        <v-btn value="kanban" icon="mdi-view-column" />
      </v-btn-toggle>
    </div>

    <!-- 筛选栏 -->
    <v-card rounded="lg" class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="状态"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filters.type"
              :items="typeOptions"
              label="类型"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="filters.keyword"
              label="搜索"
              placeholder="工单号/报修人/位置"
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

    <!-- 列表视图 -->
    <v-card v-if="viewMode === 'list'" rounded="lg">
      <v-data-table
        :headers="headers"
        :items="filteredOrders"
        :items-per-page="10"
        class="elevation-0"
      >
        <template #item.orderNo="{ item }">
          <span class="font-weight-medium text-primary">{{ item.orderNo }}</span>
        </template>

        <template #item.type="{ item }">
          <v-chip size="small" :color="getTypeColor(item.type)" variant="tonal">
            {{ getTypeText(item.type) }}
          </v-chip>
        </template>

        <template #item.status="{ item }">
          <v-chip size="small" :color="getStatusColor(item.status)" variant="flat">
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>

        <template #item.createdAt="{ item }">
          {{ formatTime(item.createdAt) }}
        </template>

        <template #item.actions="{ item }">
          <v-btn icon size="small" variant="text" @click="openDetail(item)">
            <v-icon icon="mdi-eye" />
          </v-btn>
          <v-btn
            v-if="item.status === 'pending'"
            icon
            size="small"
            variant="text"
            color="primary"
            @click="openAssignDialog(item)"
          >
            <v-icon icon="mdi-account-plus" />
            <v-tooltip activator="parent" location="top">派单</v-tooltip>
          </v-btn>
          <v-btn
            v-if="item.status === 'processing'"
            icon
            size="small"
            variant="text"
            color="success"
            @click="openCompleteDialog(item)"
          >
            <v-icon icon="mdi-check-circle" />
            <v-tooltip activator="parent" location="top">完成</v-tooltip>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- 看板视图 -->
    <v-row v-else>
      <v-col v-for="column in kanbanColumns" :key="column.status" cols="12" md="4">
        <v-card rounded="lg" class="kanban-column">
          <v-card-title class="d-flex align-center">
            <v-icon :icon="column.icon" :color="column.color" class="mr-2" />
            {{ column.title }}
            <v-chip size="x-small" class="ml-2">{{ getOrdersByStatus(column.status).length }}</v-chip>
          </v-card-title>
          <v-card-text class="pa-2">
            <div class="kanban-items">
              <v-card
                v-for="order in getOrdersByStatus(column.status)"
                :key="order.id"
                class="mb-2 kanban-item"
                variant="outlined"
                rounded="lg"
                @click="openDetail(order)"
              >
                <v-card-text class="pa-3">
                  <div class="d-flex align-center mb-2">
                    <v-chip size="x-small" :color="getTypeColor(order.type)" variant="tonal">
                      {{ getTypeText(order.type) }}
                    </v-chip>
                    <v-spacer />
                    <span class="text-caption text-grey">{{ formatTime(order.createdAt) }}</span>
                  </div>
                  <div class="text-body-2 font-weight-medium mb-1">{{ order.summary }}</div>
                  <div class="text-caption text-grey">
                    <v-icon icon="mdi-map-marker" size="12" /> {{ order.location }}
                  </div>
                  <div class="text-caption text-grey">
                    <v-icon icon="mdi-account" size="12" /> {{ order.reporterName }}
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 详情弹窗 -->
    <v-dialog v-model="detailDialog" max-width="700">
      <v-card v-if="selectedOrder">
        <v-card-title class="d-flex align-center">
          <span>工单详情</span>
          <v-chip size="small" :color="getStatusColor(selectedOrder.status)" class="ml-3" variant="flat">
            {{ getStatusText(selectedOrder.status) }}
          </v-chip>
          <v-spacer />
          <v-btn icon variant="text" @click="detailDialog = false">
            <v-icon icon="mdi-close" />
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-row>
            <v-col cols="6">
              <div class="text-caption text-grey">工单号</div>
              <div class="text-body-1 font-weight-medium">{{ selectedOrder.orderNo }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">报修类型</div>
              <v-chip size="small" :color="getTypeColor(selectedOrder.type)" variant="tonal">
                {{ getTypeText(selectedOrder.type) }}
              </v-chip>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">报修人</div>
              <div class="text-body-1">{{ selectedOrder.reporterName }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">联系电话</div>
              <div class="text-body-1">{{ selectedOrder.reporterPhone }}</div>
            </v-col>
            <v-col cols="12">
              <div class="text-caption text-grey">报修位置</div>
              <div class="text-body-1">{{ selectedOrder.location }}</div>
            </v-col>
            <v-col cols="12">
              <div class="text-caption text-grey">问题摘要</div>
              <div class="text-body-1 font-weight-medium">{{ selectedOrder.summary }}</div>
            </v-col>
            <v-col cols="12">
              <div class="text-caption text-grey">详细描述</div>
              <div class="text-body-2">{{ selectedOrder.description }}</div>
            </v-col>
            <v-col v-if="selectedOrder.assignee" cols="6">
              <div class="text-caption text-grey">派单给</div>
              <div class="text-body-1">{{ selectedOrder.assignee }}</div>
            </v-col>
            <v-col v-if="selectedOrder.result" cols="12">
              <div class="text-caption text-grey">处理结果</div>
              <div class="text-body-1">{{ selectedOrder.result }}</div>
            </v-col>
            <v-col v-if="selectedOrder.cost" cols="6">
              <div class="text-caption text-grey">维修费用</div>
              <div class="text-body-1 text-success font-weight-bold">¥{{ selectedOrder.cost }}</div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions v-if="selectedOrder.status === 'pending'">
          <v-spacer />
          <v-btn color="error" variant="text" @click="rejectOrder">驳回</v-btn>
          <v-btn color="primary" variant="flat" @click="openAssignDialog(selectedOrder)">派单</v-btn>
        </v-card-actions>
        <v-card-actions v-else-if="selectedOrder.status === 'processing'">
          <v-spacer />
          <v-btn color="success" variant="flat" @click="openCompleteDialog(selectedOrder)">完成</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 派单弹窗 -->
    <v-dialog v-model="assignDialog" max-width="400">
      <v-card>
        <v-card-title>派单</v-card-title>
        <v-card-text>
          <v-select
            v-model="assignee"
            :items="repairEmployees"
            item-title="name"
            item-value="name"
            label="选择维修人员"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="assignDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="confirmAssign">确认派单</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 完成弹窗 -->
    <v-dialog v-model="completeDialog" max-width="500">
      <v-card>
        <v-card-title>完成工单</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="completeResult"
            label="处理结果"
            variant="outlined"
            rows="3"
          />
          <v-text-field
            v-model.number="completeCost"
            label="维修费用"
            type="number"
            prefix="¥"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="completeDialog = false">取消</v-btn>
          <v-btn color="success" variant="flat" @click="confirmComplete">确认完成</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="top">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { usePropertyStore, type WorkOrder } from '@/stores/property'
import dayjs from 'dayjs'

const propertyStore = usePropertyStore()

// 视图模式
const viewMode = ref<'list' | 'kanban'>('list')

// 筛选
const filters = reactive({
  status: null as string | null,
  type: null as string | null,
  keyword: '',
})

const statusOptions = [
  { title: '待受理', value: 'pending' },
  { title: '处理中', value: 'processing' },
  { title: '已完成', value: 'completed' },
  { title: '已驳回', value: 'rejected' },
]

const typeOptions = [
  { title: '水电', value: 'water' },
  { title: '电气', value: 'electric' },
  { title: '门窗', value: 'door' },
  { title: '公区', value: 'public' },
  { title: '其他', value: 'other' },
]

// 看板列配置
const kanbanColumns = [
  { status: 'pending', title: '待受理', icon: 'mdi-clock-outline', color: 'warning' },
  { status: 'processing', title: '处理中', icon: 'mdi-progress-wrench', color: 'info' },
  { status: 'completed', title: '已完成', icon: 'mdi-check-circle', color: 'success' },
]

// 表格配置
const headers = [
  { title: '工单号', key: 'orderNo' },
  { title: '报修人', key: 'reporterName' },
  { title: '位置', key: 'location' },
  { title: '类型', key: 'type' },
  { title: '摘要', key: 'summary' },
  { title: '状态', key: 'status' },
  { title: '提交时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false, align: 'center' },
]

// 筛选后的工单
const filteredOrders = computed(() => {
  return propertyStore.workOrders.filter(order => {
    if (filters.status && order.status !== filters.status) return false
    if (filters.type && order.type !== filters.type) return false
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      if (
        !order.orderNo.toLowerCase().includes(keyword) &&
        !order.reporterName.toLowerCase().includes(keyword) &&
        !order.location.toLowerCase().includes(keyword)
      ) {
        return false
      }
    }
    return true
  })
})

function getOrdersByStatus(status: string) {
  return filteredOrders.value.filter(o => o.status === status)
}

// 维修人员列表
const repairEmployees = computed(() => propertyStore.repairEmployees)

// 辅助函数
function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    water: 'blue',
    electric: 'amber',
    door: 'brown',
    public: 'green',
    other: 'grey',
  }
  return colors[type] || 'grey'
}

function getTypeText(type: string) {
  const texts: Record<string, string> = {
    water: '水电',
    electric: '电气',
    door: '门窗',
    public: '公区',
    other: '其他',
  }
  return texts[type] || type
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'warning',
    processing: 'info',
    completed: 'success',
    rejected: 'error',
  }
  return colors[status] || 'grey'
}

function getStatusText(status: string) {
  const texts: Record<string, string> = {
    pending: '待受理',
    processing: '处理中',
    completed: '已完成',
    rejected: '已驳回',
  }
  return texts[status] || status
}

function formatTime(time: string) {
  return dayjs(time).format('MM-DD HH:mm')
}

// 详情弹窗
const detailDialog = ref(false)
const selectedOrder = ref<WorkOrder | null>(null)

function openDetail(order: WorkOrder) {
  selectedOrder.value = order
  detailDialog.value = true
}

// 派单
const assignDialog = ref(false)
const assignee = ref('')

function openAssignDialog(order: WorkOrder) {
  selectedOrder.value = order
  assignee.value = ''
  assignDialog.value = true
  detailDialog.value = false
}

function confirmAssign() {
  if (selectedOrder.value && assignee.value) {
    propertyStore.assignWorkOrder(selectedOrder.value.id, assignee.value)
    showSnackbar('success', '派单成功')
    assignDialog.value = false
  }
}

// 完成
const completeDialog = ref(false)
const completeResult = ref('')
const completeCost = ref(0)

function openCompleteDialog(order: WorkOrder) {
  selectedOrder.value = order
  completeResult.value = ''
  completeCost.value = 0
  completeDialog.value = true
  detailDialog.value = false
}

function confirmComplete() {
  if (selectedOrder.value) {
    propertyStore.completeWorkOrder(selectedOrder.value.id, completeResult.value, completeCost.value)
    showSnackbar('success', '工单已完成')
    completeDialog.value = false
  }
}

// 驳回
function rejectOrder() {
  if (selectedOrder.value) {
    propertyStore.rejectWorkOrder(selectedOrder.value.id)
    showSnackbar('warning', '工单已驳回')
    detailDialog.value = false
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
  propertyStore.loadAll()
})

defineOptions({
  layout: 'admin',
})
</script>

<style scoped>
.kanban-column {
  min-height: 500px;
}

.kanban-items {
  max-height: 400px;
  overflow-y: auto;
}

.kanban-item {
  cursor: pointer;
  transition: all 0.2s;
}

.kanban-item:hover {
  border-color: rgb(var(--v-theme-primary)) !important;
}
</style>
