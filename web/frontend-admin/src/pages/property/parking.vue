<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">车位管理</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus">新增车位</v-btn>
    </div>

    <!-- 筛选栏 -->
    <v-card rounded="lg" class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="4" md="3">
            <v-select
              v-model="filters.area"
              :items="areaOptions"
              label="停车区域"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-select
              v-model="filters.type"
              :items="typeOptions"
              label="车位类型"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="使用状态"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="auto">
            <v-btn color="primary" variant="tonal" @click="handleSearch">
              <v-icon start icon="mdi-magnify" />
              查询
            </v-btn>
            <v-btn variant="text" class="ml-2" @click="resetFilters">重置</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 车位表格 -->
    <v-card rounded="lg">
      <v-data-table
        :headers="headers"
        :items="filteredParkings"
        :items-per-page="10"
        class="elevation-0"
      >
        <template #item.parkingInfo="{ item }">
          <div class="d-flex align-center">
            <v-icon icon="mdi-parking" color="primary" class="mr-2" />
            <div>
              <div class="font-weight-bold">{{ item.parkingNo }}</div>
              <div class="text-caption text-grey">{{ item.area }}</div>
            </div>
          </div>
        </template>

        <template #item.type="{ item }">
          <v-chip size="small" variant="outlined" :color="item.type === 'owned' ? 'primary' : 'info'">
            {{ item.type === 'owned' ? '自有' : '租赁' }}
          </v-chip>
        </template>

        <template #item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
            variant="tonal"
          >
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>

        <template #item.carInfo="{ item }">
          <div v-if="item.carNo">
            <div class="font-weight-medium">{{ item.carNo }}</div>
            <div class="text-caption text-grey">{{ item.carBrand }} {{ item.carColor }}</div>
          </div>
          <span v-else class="text-grey">-</span>
        </template>

        <template #item.ownerInfo="{ item }">
          <div v-if="item.ownerName">
            <div class="font-weight-medium">{{ item.ownerName }}</div>
            <v-chip
              :color="getIdentityColor(item.identity)"
              size="x-small"
              variant="tonal"
              class="mt-1"
            >
              {{ getIdentityText(item.identity) }}
            </v-chip>
          </div>
          <span v-else class="text-grey">-</span>
        </template>

        <template #item.actions="{ item }">
          <v-btn icon size="small" variant="text" @click="viewDetail(item)">
            <v-icon icon="mdi-eye" />
            <v-tooltip activator="parent" location="top">查看详情</v-tooltip>
          </v-btn>
          <v-btn icon size="small" variant="text" color="primary">
            <v-icon icon="mdi-pencil" />
            <v-tooltip activator="parent" location="top">编辑</v-tooltip>
          </v-btn>
          <v-btn icon size="small" variant="text" color="error">
            <v-icon icon="mdi-delete" />
            <v-tooltip activator="parent" location="top">删除</v-tooltip>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- 详情弹窗 -->
    <v-dialog v-model="detailDialog" max-width="600">
      <v-card v-if="selectedParking">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-car" class="mr-2" />
          车位详情
          <v-spacer />
          <v-btn icon variant="text" @click="detailDialog = false">
            <v-icon icon="mdi-close" />
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="6">
              <div class="text-caption text-grey">车位号</div>
              <div class="text-body-1 font-weight-bold">{{ selectedParking.parkingNo }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">所在区域</div>
              <div class="text-body-1">{{ selectedParking.area }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">车位类型</div>
              <v-chip size="small" variant="outlined" :color="selectedParking.type === 'owned' ? 'primary' : 'info'">
                {{ selectedParking.type === 'owned' ? '自有' : '租赁' }}
              </v-chip>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">当前状态</div>
              <v-chip :color="getStatusColor(selectedParking.status)" size="small" variant="tonal">
                {{ getStatusText(selectedParking.status) }}
              </v-chip>
            </v-col>
            <v-divider class="mx-3 my-2" v-if="selectedParking.carNo" />
            <v-col cols="12" v-if="selectedParking.carNo">
              <div class="text-subtitle-2 mb-2">车辆信息</div>
              <v-row dense>
                <v-col cols="4">
                  <div class="text-caption text-grey">车牌号</div>
                  <div class="text-body-2">{{ selectedParking.carNo }}</div>
                </v-col>
                <v-col cols="4">
                  <div class="text-caption text-grey">品牌</div>
                  <div class="text-body-2">{{ selectedParking.carBrand }}</div>
                </v-col>
                <v-col cols="4">
                  <div class="text-caption text-grey">颜色</div>
                  <div class="text-body-2">{{ selectedParking.carColor }}</div>
                </v-col>
              </v-row>
            </v-col>
            <v-divider class="mx-3 my-2" />
            <v-col cols="6">
              <div class="text-caption text-grey">绑定人姓名</div>
              <div class="text-body-1">{{ selectedParking.ownerName || '-' }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">绑定身份</div>
              <v-chip
                v-if="selectedParking.ownerName"
                :color="getIdentityColor(selectedParking.identity)"
                size="small"
                variant="tonal"
              >
                {{ getIdentityText(selectedParking.identity) }}
              </v-chip>
              <span v-else class="text-body-1">-</span>
            </v-col>
            <v-col cols="12">
              <div class="text-caption text-grey">联系电话</div>
              <div class="text-body-1">{{ selectedParking.ownerPhone || '-' }}</div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="detailDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { usePropertyStore, type Parking } from '@/stores/property'

const propertyStore = usePropertyStore()

// 筛选条件
const filters = reactive({
  area: null as string | null,
  type: null as string | null,
  status: null as string | null,
})

const areaOptions = ['A区地下停车场', 'B区地下停车场', 'C区地面停车场', 'D区地面停车场']
const typeOptions = [
  { title: '自有', value: 'owned' },
  { title: '租赁', value: 'rented' },
]
const statusOptions = [
  { title: '正常', value: 'active' },
  { title: '到期', value: 'expired' },
  { title: '空闲', value: 'empty' },
]

// 表格配置
const headers = [
  { title: '车位信息', key: 'parkingInfo', sortable: true },
  { title: '类型', key: 'type', sortable: false },
  { title: '状态', key: 'status', sortable: false },
  { title: '车辆信息', key: 'carInfo', sortable: false },
  { title: '绑定人', key: 'ownerInfo', sortable: false },
  { title: '联系电话', key: 'ownerPhone', sortable: false },
  { title: '操作', key: 'actions', sortable: false, align: 'center' as const },
] as const

const filteredParkings = computed(() => {
  // 使用已绑定的车位数据，包含身份信息
  const parkings = propertyStore.approvedParkings.length > 0 
    ? propertyStore.approvedParkings 
    : propertyStore.parkings
  
  return parkings.filter(p => {
    if (filters.area && p.area !== filters.area) return false
    if (filters.type && p.type !== filters.type) return false
    if (filters.status && p.status !== filters.status) return false
    return true
  })
})

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    active: 'success',
    expired: 'error',
    empty: 'grey',
  }
  return colors[status] || 'grey'
}

function getStatusText(status: string) {
  const texts: Record<string, string> = {
    active: '正常',
    expired: '已到期',
    empty: '空闲',
  }
  return texts[status] || status
}

// 身份标签
function getIdentityColor(identity: string) {
  const colors: Record<string, string> = {
    owner: 'primary',
    tenant: 'secondary',
  }
  return colors[identity] || 'grey'
}

function getIdentityText(identity: string) {
  const texts: Record<string, string> = {
    owner: '业主',
    tenant: '租客',
  }
  return texts[identity] || identity
}

function handleSearch() {}

function resetFilters() {
  filters.area = null
  filters.type = null
  filters.status = null
}

const detailDialog = ref(false)
const selectedParking = ref<Parking | null>(null)

function viewDetail(parking: Parking) {
  selectedParking.value = parking
  detailDialog.value = true
}

onMounted(() => {
  propertyStore.loadAll()
})

defineOptions({
  layout: 'admin',
})
</script>
