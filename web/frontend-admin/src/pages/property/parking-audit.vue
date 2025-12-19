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
  { title: '申请时间', key: 'applyTime' },
  { title: '操作', key: 'actions', sortable: false, align: 'center' as const },
] as const

function formatTime(time: string) {
  return dayjs(time).format('MM-DD HH:mm')
}

function approve(apply: ParkingApply) {
  propertyStore.approveParking(apply.id)
  showSnackbar('success', '已通过审核')
}

const rejectDialog = ref(false)
const rejectingApply = ref<ParkingApply | null>(null)
const rejectReason = ref('')

function openRejectDialog(apply: ParkingApply) {
  rejectingApply.value = apply
  rejectReason.value = ''
  rejectDialog.value = true
}

function confirmReject() {
  if (!rejectReason.value || !rejectingApply.value) return
  propertyStore.rejectParking(rejectingApply.value.id, rejectReason.value)
  showSnackbar('error', '已拒绝申请')
  rejectDialog.value = false
}

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
