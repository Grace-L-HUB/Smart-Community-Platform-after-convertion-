<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">住户审核</h1>
      <v-chip color="warning" class="ml-3" size="small">
        {{ pendingResidents.length }} 条待处理
      </v-chip>
    </div>

    <!-- 待审核列表 -->
    <v-card rounded="lg">
      <v-data-table
        :headers="headers"
        :items="pendingResidents"
        :items-per-page="10"
        class="elevation-0"
      >
        <template #item.identity="{ item }">
          <v-chip
            :color="getIdentityColor(item.identity)"
            size="small"
            variant="tonal"
          >
            {{ getIdentityText(item.identity) }}
          </v-chip>
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
            @click="approveResident(item)"
          >
            <v-icon start icon="mdi-check" />
            通过
          </v-btn>
          <v-btn
            color="error"
            size="small"
            variant="tonal"
            @click="openRejectDialog(item)"
          >
            <v-icon start icon="mdi-close" />
            拒绝
          </v-btn>
        </template>
      </v-data-table>

      <v-alert
        v-if="pendingResidents.length === 0"
        type="info"
        variant="tonal"
        class="ma-4"
      >
        暂无待审核的住户申请
      </v-alert>
    </v-card>

    <!-- 拒绝原因弹窗 -->
    <v-dialog v-model="rejectDialog" max-width="500">
      <v-card>
        <v-card-title class="text-error">
          <v-icon icon="mdi-alert-circle" class="mr-2" />
          拒绝申请
        </v-card-title>
        <v-card-text>
          <p class="mb-4">
            确定要拒绝 <strong>{{ rejectingResident?.name }}</strong> 的住户绑定申请吗？
          </p>
          <v-textarea
            v-model="rejectReason"
            label="拒绝原因"
            placeholder="请输入拒绝原因（将发送给申请人）"
            variant="outlined"
            rows="3"
            :rules="[v => !!v || '请输入拒绝原因']"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="rejectDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" @click="confirmReject">确认拒绝</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 成功提示 -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" location="top">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { usePropertyStore, type Resident } from '@/stores/property'
import dayjs from 'dayjs'

const propertyStore = usePropertyStore()

const pendingResidents = computed(() => propertyStore.pendingResidents)

// 表格配置
const headers = [
  { title: '申请人', key: 'name' },
  { title: '手机号', key: 'phone' },
  { title: '申请房屋', key: 'houseAddress' },
  { title: '身份', key: 'identity' },
  { title: '申请时间', key: 'applyTime' },
  { title: '操作', key: 'actions', sortable: false, align: 'center' },
]

// 身份标签
function getIdentityColor(identity: string) {
  const colors: Record<string, string> = {
    owner: 'primary',
    tenant: 'secondary',
    family: 'info',
  }
  return colors[identity] || 'grey'
}

function getIdentityText(identity: string) {
  const texts: Record<string, string> = {
    owner: '业主',
    tenant: '租客',
    family: '家属',
  }
  return texts[identity] || identity
}

// 时间格式化
function formatTime(time: string) {
  return dayjs(time).format('MM-DD HH:mm')
}

// 通过审核
function approveResident(resident: Resident) {
  propertyStore.approveResident(resident.id)
  showSnackbar('success', `已通过 ${resident.name} 的绑定申请`)
}

// 拒绝审核
const rejectDialog = ref(false)
const rejectingResident = ref<Resident | null>(null)
const rejectReason = ref('')

function openRejectDialog(resident: Resident) {
  rejectingResident.value = resident
  rejectReason.value = ''
  rejectDialog.value = true
}

function confirmReject() {
  if (!rejectReason.value || !rejectingResident.value) return

  propertyStore.rejectResident(rejectingResident.value.id, rejectReason.value)
  showSnackbar('error', `已拒绝 ${rejectingResident.value.name} 的绑定申请`)
  rejectDialog.value = false
}

// 提示消息
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
