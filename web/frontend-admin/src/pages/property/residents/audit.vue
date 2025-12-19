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
  { title: '身份证号', key: 'idCard' },
  { title: '申请房屋', key: 'houseAddress' },
  { title: '身份', key: 'identity' },
  { title: '申请时间', key: 'applyTime' },
  { title: '操作', key: 'actions', sortable: false, align: 'center' as const },
] as const

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
async function approveResident(resident: Resident) {
  try {
    await propertyStore.approveResident(resident.id)
    showSnackbar('success', `已通过 ${resident.name} 的绑定申请`)
  } catch (error) {
    console.error('审核失败:', error)
    showSnackbar('error', '审核失败，请重试')
  }
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

async function confirmReject() {
  if (!rejectReason.value || !rejectingResident.value) return

  try {
    await propertyStore.rejectResident(rejectingResident.value.id, rejectReason.value)
    showSnackbar('error', `已拒绝 ${rejectingResident.value.name} 的绑定申请`)
    rejectDialog.value = false
  } catch (error) {
    console.error('拒绝失败:', error)
    showSnackbar('error', '操作失败，请重试')
  }
}

// 提示消息
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
  const resident = pendingResidents.value.find(r => r.id === id)
  if (!resident) return ''
  
  const idCard = resident.idCard || ''
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
