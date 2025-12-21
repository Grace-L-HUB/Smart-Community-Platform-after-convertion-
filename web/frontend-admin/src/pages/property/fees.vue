<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">缴费管理</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="generateDialog = true">
        生成账单
      </v-btn>
    </div>

    <!-- 统计卡片 -->
    <v-row class="mb-4">
      <v-col cols="6" md="3">
        <v-card rounded="lg" color="success" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ paidCount }}</div>
            <div class="text-body-2">已缴费</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card rounded="lg" color="warning" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ unpaidCount }}</div>
            <div class="text-body-2">待缴费</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card rounded="lg" color="primary" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">¥{{ totalPaid.toFixed(0) }}</div>
            <div class="text-body-2">已收金额</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card rounded="lg" color="error" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">¥{{ totalUnpaid.toFixed(0) }}</div>
            <div class="text-body-2">待收金额</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 筛选 -->
    <v-card rounded="lg" class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="3">
            <v-select
              v-model="filterType"
              :items="typeOptions"
              label="收费类型"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filterStatus"
              :items="statusOptions"
              label="缴费状态"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="filterPeriod"
              label="计费周期"
              placeholder="如：2024-12"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 账单列表 -->
    <v-card rounded="lg">
      <v-data-table
        :headers="headers"
        :items="filteredBills"
        :items-per-page="10"
        class="elevation-0"
      >
        <template #item.house_info.address="{ item }">
          {{ item.house_info?.address || '-' }}
        </template>

        <template #item.user_info.name="{ item }">
          {{ item.user_info?.name || '-' }}
        </template>

        <template #item.fee_type_display="{ item }">
          <v-chip size="small" :color="getTypeColor(item.fee_type)" variant="tonal">
            {{ item.fee_type_display }}
          </v-chip>
        </template>

        <template #item.amount="{ item }">
          <span class="font-weight-bold">¥{{ Number(item.amount).toFixed(2) }}</span>
        </template>

        <template #item.status="{ item }">
          <v-chip
            size="small"
            :color="item.status === 'paid' ? 'success' : (item.is_overdue ? 'error' : 'warning')"
            variant="flat"
          >
            {{ item.status_display }}
          </v-chip>
        </template>

        <template #item.paid_at="{ item }">
          {{ formatTime(item.paid_at) }}
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <v-btn
              v-if="item.status === 'unpaid'"
              size="small"
              color="warning"
              variant="tonal"
              @click="sendReminder(item)"
            >
              <v-icon start icon="mdi-message-alert" />
              催缴
            </v-btn>
            <v-btn
              size="small"
              color="primary"
              variant="outlined"
              @click="viewBillDetail(item)"
            >
              <v-icon start icon="mdi-eye" />
              详情
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- 生成账单弹窗 -->
    <v-dialog v-model="generateDialog" max-width="600">
      <v-card>
        <v-card-title>生成账单</v-card-title>
        <v-card-text>
          <v-select
            v-model="newBill.fee_type"
            :items="feeTypeOptions"
            label="收费项目"
            variant="outlined"
            class="mb-4"
            @update:model-value="loadFeeStandards"
          />
          <v-select
            v-model="newBill.fee_standard_id"
            :items="feeStandards"
            item-title="name"
            item-value="id"
            label="收费标准"
            variant="outlined"
            class="mb-4"
          />
          <v-row>
            <v-col cols="6">
              <v-select
                v-model="newBill.billing_year"
                :items="yearOptions"
                label="计费年份"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="newBill.billing_month"
                :items="monthOptions"
                label="计费月份"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-select
            v-model="newBill.target_buildings"
            :items="buildingOptions"
            label="选择楼栋"
            variant="outlined"
            multiple
            chips
            clearable
            hint="不选择则为全小区生成账单"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="generateDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="handleGenerate" :loading="generating">生成</v-btn>
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
import dayjs from 'dayjs'

// 定义数据接口
interface Bill {
  id: number;
  bill_no: string;
  title: string;
  fee_type: string;
  fee_type_display: string;
  amount: number;
  status: string;
  status_display: string;
  due_date: string;
  paid_at?: string;
  house_info?: {
    address: string;
    area: string;
  };
  user_info?: {
    name: string;
    phone: string;
  };
  period_display: string;
  is_overdue: boolean;
}

interface FeeStandard {
  id: number;
  name: string;
  fee_type: string;
  fee_type_display: string;
  unit_price: number;
  is_active: boolean;
}

// 数据状态
const bills = ref<Bill[]>([])
const feeStandards = ref<FeeStandard[]>([])
const stats = ref({
  total_bills: 0,
  paid_bills: 0,
  unpaid_bills: 0,
  overdue_bills: 0,
  total_amount: 0,
  paid_amount: 0,
  unpaid_amount: 0,
  collection_rate: 0
})
const loading = ref(false)
const generating = ref(false)

// 筛选
const filterType = ref<string | null>(null)
const filterStatus = ref<string | null>(null)
const filterPeriod = ref('')

const feeTypeOptions = [
  { title: '物业费', value: 'property' },
  { title: '水费', value: 'water' },
  { title: '电费', value: 'electric' },
  { title: '停车费', value: 'parking' },
  { title: '燃气费', value: 'gas' },
  { title: '供暖费', value: 'heating' },
]

const statusOptions = [
  { title: '已缴费', value: 'paid' },
  { title: '待缴费', value: 'unpaid' },
  { title: '已逾期', value: 'overdue' },
]

const buildingOptions = ref(['1栋', '2栋', '3栋', '4栋'])
const yearOptions = (() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
})()
const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)

// 表格
const headers = [
  { title: '账单编号', key: 'bill_no', width: '120px' },
  { title: '房屋', key: 'house_info.address' },
  { title: '业主', key: 'user_info.name' },
  { title: '类型', key: 'fee_type_display' },
  { title: '周期', key: 'period_display' },
  { title: '金额', key: 'amount' },
  { title: '状态', key: 'status' },
  { title: '缴费时间', key: 'paid_at' },
  { title: '操作', key: 'actions', sortable: false, align: 'center' },
]

// 统计
const paidCount = computed(() => stats.value.paid_bills)
const unpaidCount = computed(() => stats.value.unpaid_bills)
const totalPaid = computed(() => stats.value.paid_amount)
const totalUnpaid = computed(() => stats.value.unpaid_amount)

// 筛选后的账单
const filteredBills = computed(() => {
  return bills.value.filter(bill => {
    if (filterType.value && bill.fee_type !== filterType.value) return false
    if (filterStatus.value && bill.status !== filterStatus.value) return false
    if (filterPeriod.value && !bill.period_display.includes(filterPeriod.value)) return false
    return true
  })
})

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    property: 'primary',
    water: 'blue',
    electric: 'amber',
    parking: 'grey',
    gas: 'orange',
    heating: 'red',
  }
  return colors[type] || 'grey'
}

function formatTime(time: string | null) {
  return time ? dayjs(time).format('MM-DD HH:mm') : '-'
}

// 加载账单列表
async function loadBills() {
  try {
    loading.value = true
    const response = await fetch('http://localhost:8000/api/property/bills')
    const result = await response.json()
    
    if (result.code === 200) {
      bills.value = result.data.list
    } else {
      showSnackbar('error', result.message || '获取账单失败')
    }
  } catch (error) {
    console.error('加载账单失败:', error)
    showSnackbar('error', '网络错误')
  } finally {
    loading.value = false
  }
}

// 加载统计数据
async function loadStats() {
  try {
    const response = await fetch('http://localhost:8000/api/property/bills/stats')
    const result = await response.json()
    
    if (result.code === 200) {
      stats.value = result.data
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载收费标准
async function loadFeeStandards() {
  if (!newBill.fee_type) return
  
  try {
    const response = await fetch('http://localhost:8000/api/property/fee-standards')
    const result = await response.json()
    
    if (result.code === 200) {
      feeStandards.value = result.data.filter((item: FeeStandard) => 
        item.fee_type === newBill.fee_type && item.is_active
      )
    }
  } catch (error) {
    console.error('加载收费标准失败:', error)
  }
}

// 催缴
async function sendReminder(bill: Bill) {
  try {
    const response = await fetch('http://localhost:8000/api/property/bills/reminder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bill_ids: [bill.id]
      })
    })
    
    const result = await response.json()
    if (result.code === 200) {
      showSnackbar('success', `已向 ${bill.user_info?.name} 发送催缴提醒`)
    } else {
      showSnackbar('error', result.message || '发送催缴失败')
    }
  } catch (error) {
    console.error('发送催缴失败:', error)
    showSnackbar('error', '网络错误')
  }
}

// 生成账单
const generateDialog = ref(false)
const newBill = reactive({
  fee_type: 'property',
  fee_standard_id: null as number | null,
  billing_year: new Date().getFullYear(),
  billing_month: new Date().getMonth() + 1,
  target_buildings: [] as string[],
})

async function handleGenerate() {
  if (!newBill.fee_standard_id) {
    showSnackbar('error', '请选择收费标准')
    return
  }

  try {
    generating.value = true
    
    const response = await fetch('http://localhost:8000/api/property/bills/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newBill)
    })

    const result = await response.json()
    
    if (result.code === 200) {
      showSnackbar('success', result.message)
      generateDialog.value = false
      // 重新加载数据
      await loadBills()
      await loadStats()
    } else {
      showSnackbar('error', result.message || '生成账单失败')
    }
  } catch (error) {
    console.error('生成账单失败:', error)
    showSnackbar('error', '网络错误')
  } finally {
    generating.value = false
  }
}

// 查看账单详情
function viewBillDetail(bill: Bill) {
  // 这里可以实现查看账单详情的功能
  // 可以跳转到详情页面或打开详情弹窗
  console.log('查看账单详情:', bill)
  showSnackbar('info', `账单详情：${bill.bill_no}`)
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

onMounted(async () => {
  await Promise.all([
    loadBills(),
    loadStats(),
    loadFeeStandards()
  ])
})

defineOptions({
  layout: 'admin',
})
</script>
