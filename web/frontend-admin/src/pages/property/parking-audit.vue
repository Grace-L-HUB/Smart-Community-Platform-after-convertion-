<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">车位绑定审核</h1>
      <v-chip color="warning" class="ml-3" size="small">
        {{ pendingApplies.length }} 条待审核
      </v-chip>
    </div>

    <!-- 待审核列表 -->
    <v-card rounded="lg">
      <v-data-table
        :headers="headers"
        :items="pendingApplies"
        :items-per-page="10"
        class="elevation-0"
      >
        <template #item.parkingInfo="{ item }">
          <div class="font-weight-medium text-primary">{{ item.parkingNo }}</div>
          <div class="text-caption text-grey">{{ item.parkingArea }}</div>
        </template>

        <template #item.carInfo="{ item }">
          <div><v-chip size="x-small" variant="flat" class="mr-1">{{ item.carNo }}</v-chip></div>
          <div class="text-caption text-grey">{{ item.carBrand }} · {{ item.carColor }}</div>
        </template>

        <template #item.applyType="{ item }">
          <v-chip size="small" :color="item.parkingType === 'owned' ? 'primary' : 'info'" variant="tonal">
            {{ item.parkingType === 'owned' ? '自有车位' : '租赁车位' }}
          </v-chip>
        </template>

        <template #item.applicant="{ item }">
          <div class="font-weight-medium">{{ item.ownerName }}</div>
          <div class="text-caption text-grey">{{ item.ownerPhone }}</div>
        </template>

        <template #item.idCard="{ item }">
          <div class="d-flex align-center">
            <span :class="{ 'text-monospace': true }">
              {{ getDisplayIdCard(item.id) }}
            </span>
            <v-btn
              icon
              size="x-small"
              variant="text"
              class="ml-2"
              @click="toggleIdCardVisibility(item.id)"
            >
              <v-icon :icon="isIdCardVisible(item.id) ? 'mdi-eye-off' : 'mdi-eye'" />
              <v-tooltip activator="parent" location="top">
                {{ isIdCardVisible(item.id) ? '隐藏' : '显示' }}身份证号
              </v-tooltip>
            </v-btn>
          </div>
        </template>

        <template #item.applyTime="{ item }">
          {{ formatTime(item.applyTime) }}
        </template>

        <template #item.actions="{ item }">
          <v-btn
            color="success"
            size="small"
            variant="tonal"
            class="mr-2"
            @click="approve(item)"
          >
            通过
          </v-btn>
          <v-btn
            color="error"
            size="small"
            variant="tonal"
            @click="openRejectDialog(item)"
          >
            拒绝
          </v-btn>
        </template>
      </v-data-table>

      <v-alert
        v-if="pendingApplies.length === 0"
        type="info"
        variant="tonal"
        class="ma-4"
      >
        暂无待处理的车位申请
      </v-alert>
    </v-card>

    <!-- 拒绝原因弹窗 -->
    <v-dialog v-model="rejectDialog" max-width="500">
      <v-card>
        <v-card-title class="text-error">拒绝申请</v-card-title>
        <v-card-text>
          <p class="mb-4">确定要拒绝 <strong>{{ rejectingApply?.ownerName }}</strong> 的车位 <strong>{{ rejectingApply?.parkingNo }}</strong> 绑定申请吗？</p>
          <v-textarea
            v-model="rejectReason"
            label="拒绝原因"
            variant="outlined"
            rows="3"
            :rules="[v => !!v || '请输入原因']"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="rejectDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" @click="confirmReject">确认拒绝</v-btn>
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
import { usePropertyStore, type ParkingApply } from '@/stores/property'
import dayjs from 'dayjs'

const propertyStore = usePropertyStore()
const pendingApplies = computed(() => propertyStore.pendingParkingApplies)

const headers = [
  { title: '车位信息', key: 'parkingInfo' },
  { title: '车辆信息', key: 'carInfo' },
  { title: '类型', key: 'applyType' },
  { title: '申请人', key: 'applicant' },
  { title: '身份证号', key: 'idCard' },
  { title: '申请时间', key: 'applyTime' },
  { title: '操作', key: 'actions', sortable: false, align: 'center' as const },
] as const

function formatTime(time: string) {
  return dayjs(time).format('MM-DD HH:mm')
}

async function approve(apply: ParkingApply) {
  try {
    await propertyStore.approveParking(apply.id)
    showSnackbar('success', '已通过审核')
  } catch (error) {
    console.error('审核失败:', error)
    showSnackbar('error', '审核失败，请重试')
  }
}

const rejectDialog = ref(false)
const rejectingApply = ref<ParkingApply | null>(null)
const rejectReason = ref('')

function openRejectDialog(apply: ParkingApply) {
  rejectingApply.value = apply
  rejectReason.value = ''
  rejectDialog.value = true
}

async function confirmReject() {
  if (!rejectReason.value || !rejectingApply.value) return
  
  try {
    await propertyStore.rejectParking(rejectingApply.value.id, rejectReason.value)
    showSnackbar('error', '已拒绝申请')
    rejectDialog.value = false
  } catch (error) {
    console.error('拒绝失败:', error)
    showSnackbar('error', '操作失败，请重试')
  }
}

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// 身份证号可见性管理
const visibleIdCards = ref(new Set<number>())

function showSnackbar(color: string, text: string) {
  snackbarColor.value = color
  snackbarText.value = text
  snackbar.value = true
}

// 身份证号显示控制
function toggleIdCardVisibility(id: number) {
  if (visibleIdCards.value.has(id)) {
    visibleIdCards.value.delete(id)
  } else {
    visibleIdCards.value.add(id)
  }
}

function isIdCardVisible(id: number): boolean {
  return visibleIdCards.value.has(id)
}

function getDisplayIdCard(id: number): string {
  const apply = pendingApplies.value.find(a => a.id === id)
  if (!apply) return ''
  
  const idCard = apply.idCard || ''
  if (!idCard) return '无'
  
  // 如果可见，显示完整身份证号；否则只显示前4位和后4位，中间用*遮盖
  if (isIdCardVisible(id)) {
    return idCard
  } else {
    if (idCard.length <= 8) return '*'.repeat(idCard.length)
    const start = idCard.substring(0, 4)
    const end = idCard.substring(idCard.length - 4)
    const middle = '*'.repeat(idCard.length - 8)
    return `${start}${middle}${end}`
  }
}

onMounted(() => {
  propertyStore.loadAll()
})

defineOptions({
  layout: 'admin',
})
</script>
