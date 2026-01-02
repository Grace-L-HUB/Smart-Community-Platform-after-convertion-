<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">优惠券管理</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openEditor(null)">
        添加优惠券
      </v-btn>
    </div>

    <v-card rounded="lg" class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="searchKeyword"
              label="搜索优惠券"
              prepend-inner-icon="mdi-magnify"
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
              label="状态"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card rounded="lg">
      <v-table>
        <thead>
          <tr>
            <th class="text-left">优惠券名称</th>
            <th class="text-left">类型</th>
            <th class="text-left">优惠金额</th>
            <th class="text-left">最低消费</th>
            <th class="text-left">发行数量</th>
            <th class="text-left">已领取</th>
            <th class="text-left">有效期</th>
            <th class="text-left">状态</th>
            <th class="text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="coupon in filteredCoupons" :key="coupon.id">
            <td>{{ coupon.name }}</td>
            <td>
              <v-chip size="small" :color="getTypeColor(coupon.coupon_type)">
                {{ getTypeText(coupon.coupon_type) }}
              </v-chip>
            </td>
            <td>¥{{ coupon.amount }}</td>
            <td>¥{{ coupon.min_amount }}</td>
            <td>{{ coupon.total_count }}</td>
            <td>{{ coupon.used_count }}</td>
            <td>{{ formatDateRange(coupon.start_date, coupon.end_date) }}</td>
            <td>
              <v-chip size="small" :color="getStatusColor(coupon.status)">
                {{ getStatusText(coupon.status) }}
              </v-chip>
            </td>
            <td>
              <v-btn size="small" variant="text" @click="openEditor(coupon)">
                <v-icon start icon="mdi-pencil" />
                编辑
              </v-btn>
              <v-btn size="small" color="error" variant="text" @click="confirmDelete(coupon)">
                删除
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="editorDialog" max-width="600" persistent>
      <v-card>
        <v-card-title>{{ editingCoupon ? '编辑优惠券' : '添加优惠券' }}</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="form.name"
                label="优惠券名称"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="form.description"
                label="使用说明"
                variant="outlined"
                rows="2"
              />
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="form.coupon_type"
                :items="typeOptions"
                label="优惠券类型"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="form.amount"
                label="优惠金额"
                type="number"
                prefix="¥"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="form.min_amount"
                label="最低消费"
                type="number"
                prefix="¥"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="form.total_count"
                label="发行数量"
                type="number"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="form.per_user_limit"
                label="每用户限领"
                type="number"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.start_date"
                label="开始时间"
                type="datetime-local"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.end_date"
                label="结束时间"
                type="datetime-local"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editorDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="saveCoupon">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-error">确认删除</v-card-title>
        <v-card-text>
          确定要删除优惠券 <strong>{{ deletingCoupon?.name }}</strong> 吗？
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" @click="executeDelete">删除</v-btn>
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
import { useMerchantStore } from '@/stores/merchant'

const merchantStore = useMerchantStore()

const searchKeyword = ref('')
const filterStatus = ref<string | null>(null)

const statusOptions = [
  { title: '生效中', value: 'active' },
  { title: '已停用', value: 'inactive' },
  { title: '已过期', value: 'expired' },
]

const typeOptions = [
  { title: '减价券', value: 'discount' },
  { title: '满减券', value: 'deduction' },
  { title: '赠品券', value: 'gift' },
]

const filteredCoupons = computed(() => {
  return merchantStore.coupons.filter(c => {
    if (searchKeyword.value && !c.name.includes(searchKeyword.value)) return false
    if (filterStatus.value && c.status !== filterStatus.value) return false
    return true
  })
})

const editorDialog = ref(false)
const editingCoupon = ref<any>(null)
const form = reactive({
  name: '',
  description: '',
  coupon_type: 'discount',
  amount: 0,
  min_amount: 0,
  total_count: 100,
  per_user_limit: 1,
  start_date: '',
  end_date: '',
})

function openEditor(coupon: any) {
  editingCoupon.value = coupon
  if (coupon) {
    form.name = coupon.name
    form.description = coupon.description
    form.coupon_type = coupon.coupon_type
    form.amount = coupon.amount
    form.min_amount = coupon.min_amount
    form.total_count = coupon.total_count
    form.per_user_limit = coupon.per_user_limit
    form.start_date = coupon.start_date
    form.end_date = coupon.end_date
  } else {
    form.name = ''
    form.description = ''
    form.coupon_type = 'discount'
    form.amount = 0
    form.min_amount = 0
    form.total_count = 100
    form.per_user_limit = 1
    form.start_date = new Date().toISOString().slice(0, 16)
    form.end_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  }
  editorDialog.value = true
}

async function saveCoupon() {
  try {
    const couponData = {
      name: form.name,
      description: form.description,
      coupon_type: form.coupon_type,
      amount: form.amount,
      min_amount: form.min_amount,
      total_count: form.total_count,
      per_user_limit: form.per_user_limit,
      start_date: form.start_date,
      end_date: form.end_date,
      status: 'active' as const,
    }

    if (editingCoupon.value) {
      await merchantStore.updateCoupon(editingCoupon.value.id, couponData)
      showSnackbar('success', '优惠券已更新')
    } else {
      await merchantStore.addCoupon(couponData)
      showSnackbar('success', '优惠券已添加')
    }
    editorDialog.value = false
  } catch (error) {
    console.error('保存优惠券失败:', error)
    showSnackbar('error', error instanceof Error ? error.message : '保存失败，请重试')
  }
}

const deleteDialog = ref(false)
const deletingCoupon = ref<any>(null)

function confirmDelete(coupon: any) {
  deletingCoupon.value = coupon
  deleteDialog.value = true
}

async function executeDelete() {
  if (deletingCoupon.value) {
    try {
      await merchantStore.deleteCoupon(deletingCoupon.value.id)
      showSnackbar('success', '优惠券已删除')
      deleteDialog.value = false
    } catch (error) {
      console.error('删除优惠券失败:', error)
      showSnackbar('error', error instanceof Error ? error.message : '删除失败，请重试')
    }
  }
}

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

function showSnackbar(color: string, text: string) {
  snackbarColor.value = color
  snackbarText.value = text
  snackbar.value = true
}

function getTypeText(type: string) {
  const typeMap: Record<string, string> = {
    discount: '减价券',
    deduction: '满减券',
    gift: '赠品券',
  }
  return typeMap[type] || type
}

function getTypeColor(type: string) {
  const colorMap: Record<string, string> = {
    discount: 'primary',
    deduction: 'success',
    gift: 'warning',
  }
  return colorMap[type] || 'default'
}

function getStatusText(status: string) {
  const statusMap: Record<string, string> = {
    active: '生效中',
    inactive: '已停用',
    expired: '已过期',
  }
  return statusMap[status] || status
}

function getStatusColor(status: string) {
  const colorMap: Record<string, string> = {
    active: 'success',
    inactive: 'grey',
    expired: 'error',
  }
  return colorMap[status] || 'default'
}

function formatDateRange(start: string, end: string) {
  const startDate = new Date(start).toLocaleDateString('zh-CN')
  const endDate = new Date(end).toLocaleDateString('zh-CN')
  return `${startDate} - ${endDate}`
}

onMounted(() => {
  merchantStore.loadCoupons()
})

defineOptions({
  layout: 'admin',
})
</script>
