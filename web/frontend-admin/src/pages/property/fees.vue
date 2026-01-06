<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">缴费管理</h1>
      <v-spacer />
      <v-btn 
        color="info" 
        variant="outlined" 
        prepend-icon="mdi-download" 
        @click="loadAllBills" 
        :loading="loading"
        class="mr-3"
      >
        加载全部数据
      </v-btn>
      <v-btn 
        color="secondary" 
        variant="outlined" 
        prepend-icon="mdi-refresh" 
        @click="refreshData" 
        :loading="loading"
        class="mr-3"
      >
        刷新
      </v-btn>
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
              :items="feeTypeOptions"
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
          <v-col cols="12" sm="3" class="d-flex align-center gap-3">
            <v-btn 
              variant="outlined" 
              prepend-icon="mdi-filter-off" 
              @click="clearFilters"
              :disabled="!hasActiveFilters"
            >
              清除筛选
            </v-btn>
            <v-chip 
              v-if="pagination.total > 0" 
              size="small" 
              color="info" 
              variant="tonal"
            >
              数据库共{{ pagination.total }}条
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 账单列表 -->
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center">
        <span>账单列表</span>
        <v-spacer />
        <div class="d-flex gap-2">
          <v-chip 
            size="small" 
            variant="outlined"
            :color="bills.length < pagination.total ? 'warning' : 'success'"
          >
            显示 {{ bills.length }} / {{ pagination.total || 0 }} 条
          </v-chip>
          <v-btn
            v-if="bills.length < pagination.total"
            size="small"
            variant="outlined"
            color="primary"
            @click="loadMore"
            :disabled="loading"
          >
            加载更多
          </v-btn>
        </div>
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="filteredBills"
        :items-per-page="10"
        class="elevation-0"
        :loading="loading"
        loading-text="加载账单数据中..."
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

    <!-- 账单详情弹窗 -->
    <v-dialog v-model="detailDialog" max-width="800">
      <v-card v-if="selectedBill">
        <v-card-title class="d-flex align-center bg-grey-lighten-4">
          <v-icon start icon="mdi-receipt" />
          账单详情
          <v-spacer />
          <v-chip :color="selectedBill.status === 'paid' ? 'success' : (selectedBill.is_overdue ? 'error' : 'warning')" size="small">
            {{ selectedBill.status_display }}
          </v-chip>
        </v-card-title>

        <v-card-text class="pt-4">
          <v-row>
            <!-- 左侧：账单信息 -->
            <v-col cols="12" md="7">
              <div class="text-subtitle-2 font-weight-bold mb-3 d-flex align-center">
                <v-icon icon="mdi-file-document-outline" size="small" class="mr-2" />
                账单信息
              </div>

              <v-table density="compact" class="mb-4">
                <tbody>
                  <tr>
                    <td class="text-right font-weight-medium" style="width: 120px;">账单编号</td>
                    <td><v-chip size="small" color="info" variant="tonal">{{ selectedBill.bill_no }}</v-chip></td>
                  </tr>
                  <tr>
                    <td class="text-right font-weight-medium">账单标题</td>
                    <td>{{ selectedBill.title }}</td>
                  </tr>
                  <tr>
                    <td class="text-right font-weight-medium">收费类型</td>
                    <td>
                      <v-chip size="small" :color="getTypeColor(selectedBill.fee_type)" variant="tonal">
                        {{ selectedBill.fee_type_display }}
                      </v-chip>
                    </td>
                  </tr>
                  <tr>
                    <td class="text-right font-weight-medium">计费周期</td>
                    <td>{{ selectedBill.period_display }}</td>
                  </tr>
                  <tr>
                    <td class="text-right font-weight-medium">账单金额</td>
                    <td class="text-h6 font-weight-bold success--text">¥{{ Number(selectedBill.amount).toFixed(2) }}</td>
                  </tr>
                  <tr>
                    <td class="text-right font-weight-medium">应付金额</td>
                    <td class="text-h6 font-weight-bold success--text">
                      ¥{{ selectedBill.paid_amount ? Number(selectedBill.paid_amount).toFixed(2) : Number(selectedBill.amount).toFixed(2) }}
                    </td>
                  </tr>
                  <tr>
                    <td class="text-right font-weight-medium">到期日期</td>
                    <td>
                      <v-chip :color="selectedBill.is_overdue ? 'error' : 'default'" size="small" variant="outlined">
                        {{ selectedBill.due_date ? dayjs(selectedBill.due_date).format('YYYY-MM-DD') : '-' }}
                      </v-chip>
                      <v-icon v-if="selectedBill.is_overdue" icon="mdi-alert" color="error" size="small" class="ml-1" />
                    </td>
                  </tr>
                  <tr v-if="selectedBill.status === 'paid'">
                    <td class="text-right font-weight-medium">缴费时间</td>
                    <td>{{ selectedBill.paid_at ? dayjs(selectedBill.paid_at).format('YYYY-MM-DD HH:mm:ss') : '-' }}</td>
                  </tr>
                  <tr v-if="selectedBill.status === 'paid'">
                    <td class="text-right font-weight-medium">支付方式</td>
                    <td>
                      <v-chip size="small" variant="tonal">
                        <v-icon start icon="mdi-wechat" />{{ selectedBill.payment_method_display || '-' }}
                      </v-chip>
                    </td>
                  </tr>
                  <tr v-if="selectedBill.payment_reference">
                    <td class="text-right font-weight-medium">流水号</td>
                    <td class="text-caption text-grey">{{ selectedBill.payment_reference }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-col>

            <!-- 右侧：房屋和业主信息 -->
            <v-col cols="12" md="5">
              <!-- 房屋信息 -->
              <div class="text-subtitle-2 font-weight-bold mb-3 d-flex align-center">
                <v-icon icon="mdi-home-outline" size="small" class="mr-2" />
                房屋信息
              </div>

              <v-card variant="outlined" class="mb-4">
                <v-card-text class="pa-3">
                  <div class="mb-2">
                    <v-icon icon="mdi-map-marker" size="small" color="primary" class="mr-1" />
                    <span class="font-weight-medium">{{ selectedBill.house_info?.address || '-' }}</span>
                  </div>
                  <div v-if="selectedBill.house_info?.area" class="text-caption text-grey">
                    建筑面积：{{ selectedBill.house_info.area }} ㎡
                  </div>
                </v-card-text>
              </v-card>

              <!-- 业主信息 -->
              <div class="text-subtitle-2 font-weight-bold mb-3 d-flex align-center">
                <v-icon icon="mdi-account-outline" size="small" class="mr-2" />
                业主信息
              </div>

              <v-card variant="outlined" class="mb-4">
                <v-card-text class="pa-3">
                  <div class="mb-2">
                    <v-icon icon="mdi-account" size="small" color="primary" class="mr-1" />
                    <span class="font-weight-medium">{{ selectedBill.user_info?.name || '-' }}</span>
                  </div>
                  <div v-if="selectedBill.user_info?.phone" class="text-caption text-grey">
                    <v-icon icon="mdi-phone" size="small" class="mr-1" />
                    {{ selectedBill.user_info.phone }}
                  </div>
                </v-card-text>
              </v-card>

              <!-- 状态提醒 -->
              <v-alert
                v-if="selectedBill.status === 'unpaid'"
                :type="selectedBill.is_overdue ? 'error' : 'warning'"
                variant="tonal"
                density="compact"
                class="mb-2"
              >
<<<<<<< HEAD
                <template v-slot:prepend>
                  <v-icon icon="mdi-information" />
                </template>
                <template v-slot:default>
                  <span class="text-caption">
                    {{ selectedBill.is_overdue ? '此账单已逾期，请尽快催缴' : '此账单待缴费' }}
                  </span>
                </template>
=======
                {{ selectedBill.is_overdue ? '此账单已逾期，请尽快催缴' : '此账单待缴费' }}
>>>>>>> fbcf98eb0b0900e1349a6f07b9533f06e27ff260
              </v-alert>

              <v-alert
                v-if="selectedBill.status === 'paid'"
                type="success"
                variant="tonal"
                density="compact"
              >
<<<<<<< HEAD
                <template v-slot:prepend>
                  <v-icon icon="mdi-check-circle" />
                </template>
                <template v-slot:default>
                  <span class="text-caption">此账单已完成缴费</span>
                </template>
=======
                此账单已完成缴费
>>>>>>> fbcf98eb0b0900e1349a6f07b9533f06e27ff260
              </v-alert>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="bg-grey-lighten-5">
          <v-spacer />
          <v-btn variant="text" @click="detailDialog = false">关闭</v-btn>
          <v-btn
            v-if="selectedBill.status === 'unpaid'"
            color="warning"
            variant="tonal"
            prepend-icon="mdi-message-alert"
            @click="sendReminder(selectedBill); detailDialog = false"
          >
            催缴
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="top">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import dayjs from 'dayjs'

// 定义数据接口
interface Bill {
  id: number;
  bill_no: string;
  title: string;
  fee_type: string;
  fee_type_display: string;
  amount: number;
  paid_amount?: number;
  status: string;
  status_display: string;
  due_date: string;
  paid_at?: string;
  payment_method?: string;
  payment_method_display?: string;
  payment_reference?: string;
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

const buildingOptions = ref<string[]>([])
const yearOptions = (() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
})()
const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)

// 加载楼栋选项
async function loadBuildingOptions() {
  try {
    const response = await fetch('http://139.224.17.154:8000/api/property/house/options/buildings')
    const result = await response.json()

    if (result.code === 200 && result.data) {
      // result.data 可能是字符串数组或对象数组
      if (Array.isArray(result.data)) {
        buildingOptions.value = result.data.map((item: any) =>
          typeof item === 'string' ? item : item.name || item.value
        )
      }
      console.log('✅ 楼栋选项加载成功:', buildingOptions.value)
    }
  } catch (error) {
    console.error('❌ 加载楼栋选项失败:', error)
    // 失败时使用默认值
    buildingOptions.value = ['1栋', '2栋', '3栋', '4栋']
  }
}

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

// 筛选后的账单（现在直接使用后端筛选的结果）
const filteredBills = computed(() => {
  return bills.value
})

// 监听筛选条件变化，重新加载数据
watch([filterType, filterStatus, filterPeriod], () => {
  // 如果有筛选条件，使用分页加载，否则加载所有数据
  if (hasActiveFilters.value) {
    loadBills(false) // 重新加载，不是加载更多
  } else {
    loadAllBills() // 没有筛选条件时加载所有数据
  }
}, { deep: true })

// 检查是否有激活的筛选条件
const hasActiveFilters = computed(() => {
  return !!(filterType.value || filterStatus.value || filterPeriod.value)
})

// 清除所有筛选条件
function clearFilters() {
  filterType.value = null
  filterStatus.value = null
  filterPeriod.value = ''
  // 清除筛选后直接加载所有数据
  loadAllBills()
}

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

// 分页相关状态
const pagination = ref({
  page: 1,
  pageSize: 50,  // 增大页面大小
  total: 0,
  totalPages: 0
})

// 加载账单列表
async function loadBills(loadMore = false) {
  try {
    if (!loadMore) {
      loading.value = true
      pagination.value.page = 1  // 重置页码
    }
    
    // 构建查询参数
    const params = new URLSearchParams()
    if (filterType.value) params.append('fee_type', filterType.value)
    if (filterStatus.value) params.append('status', filterStatus.value)
    if (filterPeriod.value) params.append('period', filterPeriod.value)
    
    // 添加分页参数
    params.append('page', pagination.value.page.toString())
    params.append('page_size', pagination.value.pageSize.toString())
    
    const url = `http://139.224.17.154:8000/api/property/bills?${params.toString()}`
    
    // 添加详细的调试日志
    console.log('=== 账单API调用详情 ===')
    console.log('请求URL:', url)
    console.log('筛选条件:', {
      fee_type: filterType.value,
      status: filterStatus.value,
      period: filterPeriod.value
    })
    
    const response = await fetch(url)
    const result = await response.json()
    
    console.log('API响应:', result)
    
    if (result.code === 200) {
      if (loadMore && pagination.value.page > 1) {
        // 加载更多时合并数据
        bills.value = [...bills.value, ...result.data.list]
      } else {
        // 首次加载或刷新时替换数据
        bills.value = result.data.list
      }
      
      // 更新分页信息
      pagination.value.total = result.data.total
      pagination.value.totalPages = result.data.total_pages
      
      console.log(`✅ 加载账单成功: 当前${bills.value.length}条，总共${result.data.total}条`)
      
      // 如果筛选后没有数据，给出提示
      if (result.data.total === 0 && (filterType.value || filterStatus.value || filterPeriod.value)) {
        showSnackbar('warning', '当前筛选条件下没有找到账单')
      }
    } else {
      console.error('❌ API响应错误:', result)
      showSnackbar('error', result.message || '获取账单失败')
    }
  } catch (error) {
    console.error('❌ 加载账单失败:', error)
    showSnackbar('error', '网络错误')
  } finally {
    loading.value = false
  }
}

// 加载更多数据
async function loadMore() {
  if (pagination.value.page < pagination.value.totalPages) {
    pagination.value.page++
    await loadBills(true)
  }
}

// 加载所有数据
async function loadAllBills() {
  try {
    loading.value = true
    
    // 构建查询参数
    const params = new URLSearchParams()
    if (filterType.value) params.append('fee_type', filterType.value)
    if (filterStatus.value) params.append('status', filterStatus.value)
    if (filterPeriod.value) params.append('period', filterPeriod.value)
    
    // 设置一个很大的page_size来获取所有数据
    params.append('page_size', '1000')
    
    const url = `http://139.224.17.154:8000/api/property/bills?${params.toString()}`
    
    // 添加详细的调试日志
    console.log('=== 加载所有账单 ===')
    console.log('请求URL:', url)
    console.log('筛选条件:', {
      fee_type: filterType.value,
      status: filterStatus.value,
      period: filterPeriod.value
    })
    
    const response = await fetch(url)
    const result = await response.json()
    
    console.log('API响应:', result)
    
    if (result.code === 200) {
      bills.value = result.data.list
      pagination.value.total = result.data.total
      console.log(`✅ 加载所有账单成功: ${result.data.total}条`)
      
      // 显示账单状态统计（调试用）
      const statusCount = bills.value.reduce((acc, bill) => {
        acc[bill.status] = (acc[bill.status] || 0) + 1
        return acc
      }, {})
      console.log('账单状态统计:', statusCount)
      
      showSnackbar('success', `已加载全部${result.data.total}条账单`)
    } else {
      console.error('❌ API响应错误:', result)
      showSnackbar('error', result.message || '获取账单失败')
    }
  } catch (error) {
    console.error('❌ 加载所有账单失败:', error)
    showSnackbar('error', '网络错误')
  } finally {
    loading.value = false
  }
}

// 加载统计数据
async function loadStats() {
  try {
    const response = await fetch('http://139.224.17.154:8000/api/property/bills/stats')
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
    const response = await fetch('http://139.224.17.154:8000/api/property/fee-standards')
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
    const response = await fetch('http://139.224.17.154:8000/api/property/bills/reminder', {
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
      // 催缴成功后刷新数据，保持当前视图（所有数据或筛选后的数据）
      await loadAllBills()
      await loadStats()
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

// 详情弹窗
const detailDialog = ref(false)
const selectedBill = ref<Bill | null>(null)

async function handleGenerate() {
  if (!newBill.fee_standard_id) {
    showSnackbar('error', '请选择收费标准')
    return
  }

  try {
    generating.value = true
    
    const response = await fetch('http://139.224.17.154:8000/api/property/bills/generate', {
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
      // 重新加载数据，包括新生成的账单
      await loadAllBills()
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

// 刷新所有数据
async function refreshData() {
  await Promise.all([
    loadAllBills(), // 刷新时加载所有数据
    loadStats(),
    loadFeeStandards(),
    loadBuildingOptions()
  ])
  showSnackbar('success', '数据刷新成功')
}

// 查看账单详情
function viewBillDetail(bill: Bill) {
  selectedBill.value = bill
  detailDialog.value = true
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
  // 初始加载时直接加载所有数据，确保用户能看到完整的数据
  await Promise.all([
    loadAllBills(),
    loadStats(),
    loadFeeStandards(),
    loadBuildingOptions()
  ])
})

defineOptions({
  layout: 'admin',
})
</script>
