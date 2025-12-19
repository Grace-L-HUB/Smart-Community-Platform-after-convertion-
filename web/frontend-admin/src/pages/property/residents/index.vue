<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">住户总表</h1>
      <v-chip color="success" class="ml-3" size="small">
        {{ approvedResidents.length }} 位住户
      </v-chip>
    </div>

    <!-- 搜索栏 -->
    <v-card rounded="lg" class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="searchKeyword"
              label="搜索住户"
              placeholder="姓名/手机号/房屋"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filterIdentity"
              :items="identityOptions"
              label="身份"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 住户表格 -->
    <v-card rounded="lg">
      <v-data-table
        :headers="headers"
        :items="filteredResidents"
        :items-per-page="10"
        class="elevation-0"
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center">
            <v-avatar color="primary" size="32" class="mr-2">
              <span class="text-body-2">{{ item.name.charAt(0) }}</span>
            </v-avatar>
            {{ item.name }}
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

        <template #item.status="{ item }">
          <v-chip
            :color="item.status === 1 ? 'success' : 'error'"
            size="small"
            variant="flat"
          >
            {{ item.status === 1 ? '已绑定' : '已拒绝' }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn
            icon
            size="small"
            variant="text"
            color="error"
            @click="confirmUnbind(item)"
          >
            <v-icon icon="mdi-link-variant-off" />
            <v-tooltip activator="parent" location="top">解除绑定</v-tooltip>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- 解绑确认弹窗 -->
    <v-dialog v-model="unbindDialog" max-width="400">
      <v-card>
        <v-card-title class="text-warning">
          <v-icon icon="mdi-alert" class="mr-2" />
          确认解绑
        </v-card-title>
        <v-card-text>
          确定要解除 <strong>{{ unbindingResident?.name }}</strong> 与
          <strong>{{ unbindingResident?.houseAddress }}</strong> 的绑定关系吗？
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="unbindDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" @click="executeUnbind">确认解绑</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="success" location="top">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { usePropertyStore, type Resident } from '@/stores/property'

const propertyStore = usePropertyStore()

// 只显示已通过的住户
const approvedResidents = computed(() => propertyStore.approvedResidents)

// 搜索和筛选
const searchKeyword = ref('')
const filterIdentity = ref<string | null>(null)

const identityOptions = [
  { title: '业主', value: 'owner' },
  { title: '租客', value: 'tenant' },
  { title: '家属', value: 'family' },
]

const filteredResidents = computed(() => {
  return approvedResidents.value.filter(resident => {
    // 关键词搜索
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      if (
        !resident.name.toLowerCase().includes(keyword) &&
        !resident.phone.includes(keyword) &&
        !resident.houseAddress.toLowerCase().includes(keyword)
      ) {
        return false
      }
    }
    // 身份筛选
    if (filterIdentity.value && resident.identity !== filterIdentity.value) {
      return false
    }
    return true
  })
})

// 表格配置
const headers = [
  { title: '姓名', key: 'name' },
  { title: '手机号', key: 'phone' },
  { title: '绑定房屋', key: 'houseAddress' },
  { title: '身份', key: 'identity' },
  { title: '状态', key: 'status' },
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

// 解绑操作
const unbindDialog = ref(false)
const unbindingResident = ref<Resident | null>(null)

function confirmUnbind(resident: Resident) {
  unbindingResident.value = resident
  unbindDialog.value = true
}

async function executeUnbind() {
  if (unbindingResident.value) {
    try {
      // 使用绑定ID而不是申请ID
      await propertyStore.unbindHouse(unbindingResident.value.id)
      showSnackbar(`已解除 ${unbindingResident.value.name} 的绑定`)
    } catch (error) {
      console.error('解绑失败:', error)
      showSnackbar('解绑失败，请重试')
    }
  }
  unbindDialog.value = false
}

// 提示
const snackbar = ref(false)
const snackbarText = ref('')

function showSnackbar(text: string) {
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
