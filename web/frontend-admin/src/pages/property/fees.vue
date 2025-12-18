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
        <template #item.type="{ item }">
          <v-chip size="small" :color="getTypeColor(item.type)" variant="tonal">
            {{ getTypeText(item.type) }}
          </v-chip>
        </template>

        <template #item.amount="{ item }">
          <span class="font-weight-bold">¥{{ item.amount.toFixed(2) }}</span>
        </template>

        <template #item.status="{ item }">
          <v-chip
            size="small"
            :color="item.status === 'paid' ? 'success' : 'warning'"
            variant="flat"
          >
            {{ item.status === 'paid' ? '已缴费' : '待缴费' }}
          </v-chip>
        </template>

        <template #item.paidAt="{ item }">
          {{ item.paidAt ? formatTime(item.paidAt) : '-' }}
        </template>

        <template #item.actions="{ item }">
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
          <span v-else class="text-success">
            <v-icon icon="mdi-check" size="small" /> 已完成
          </span>
        </template>
      </v-data-table>
    </v-card>

    <!-- 生成账单弹窗 -->
    <v-dialog v-model="generateDialog" max-width="500">
      <v-card>
        <v-card-title>生成账单</v-card-title>
        <v-card-text>
          <v-select
            v-model="newBill.type"
            :items="typeOptions"
            label="收费项目"
            variant="outlined"
            class="mb-4"
          />
          <v-text-field
            v-model="newBill.period"
            label="计费周期"
            placeholder="如：2024-12"
            variant="outlined"
            class="mb-4"
          />
          <v-text-field
            v-model.number="newBill.unitPrice"
            label="单价（元/㎡）"
            type="number"
            variant="outlined"
            class="mb-4"
          />
          <v-select
            v-model="newBill.buildings"
            :items="['1栋', '2栋', '3栋', '4栋']"
            label="选择楼栋"
            variant="outlined"
            multiple
            chips
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="generateDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="handleGenerate">生成</v-btn>
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
import { usePropertyStore, type Bill } from '@/stores/property'
import dayjs from 'dayjs'

const propertyStore = usePropertyStore()

// 筛选
const filterType = ref<string | null>(null)
const filterStatus = ref<string | null>(null)
const filterPeriod = ref('')

const typeOptions = [
  { title: '物业费', value: 'property' },
  { title: '水费', value: 'water' },
  { title: '电费', value: 'electric' },
  { title: '停车费', value: 'parking' },
]

const statusOptions = [
  { title: '已缴费', value: 'paid' },
  { title: '待缴费', value: 'unpaid' },
]

// 表格
const headers = [
  { title: '房屋', key: 'houseAddress' },
  { title: '业主', key: 'ownerName' },
  { title: '类型', key: 'type' },
  { title: '周期', key: 'period' },
  { title: '金额', key: 'amount' },
  { title: '状态', key: 'status' },
  { title: '缴费时间', key: 'paidAt' },
  { title: '操作', key: 'actions', sortable: false, align: 'center' },
]

// 统计
const paidCount = computed(() => propertyStore.bills.filter(b => b.status === 'paid').length)
const unpaidCount = computed(() => propertyStore.bills.filter(b => b.status === 'unpaid').length)
const totalPaid = computed(() => propertyStore.bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0))
const totalUnpaid = computed(() => propertyStore.bills.filter(b => b.status === 'unpaid').reduce((sum, b) => sum + b.amount, 0))

// 筛选后的账单
const filteredBills = computed(() => {
  return propertyStore.bills.filter(bill => {
    if (filterType.value && bill.type !== filterType.value) return false
    if (filterStatus.value && bill.status !== filterStatus.value) return false
    if (filterPeriod.value && !bill.period.includes(filterPeriod.value)) return false
    return true
  })
})

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    property: 'primary',
    water: 'blue',
    electric: 'amber',
    parking: 'grey',
  }
  return colors[type] || 'grey'
}

function getTypeText(type: string) {
  const texts: Record<string, string> = {
    property: '物业费',
    water: '水费',
    electric: '电费',
    parking: '停车费',
  }
  return texts[type] || type
}

function formatTime(time: string) {
  return dayjs(time).format('MM-DD HH:mm')
}

// 催缴
function sendReminder(bill: Bill) {
  propertyStore.sendReminder(bill.id)
  showSnackbar('success', `已向 ${bill.ownerName} 发送催缴提醒`)
}

// 生成账单
const generateDialog = ref(false)
const newBill = reactive({
  type: 'property',
  period: '',
  unitPrice: 0,
  buildings: [] as string[],
})

function handleGenerate() {
  if (newBill.buildings.length === 0) {
    showSnackbar('error', '请选择楼栋')
    return
  }
  propertyStore.generateBills(newBill.type, newBill.period, newBill.buildings)
  showSnackbar('success', `已为 ${newBill.buildings.length} 栋楼生成账单`)
  generateDialog.value = false
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
