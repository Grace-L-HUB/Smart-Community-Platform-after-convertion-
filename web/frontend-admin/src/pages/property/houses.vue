<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">房产列表</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus">新增房产</v-btn>
    </div>

    <!-- 筛选栏 -->
    <v-card rounded="lg" class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="4" md="3">
            <v-select
              v-model="filters.building"
              :items="buildingOptions"
              label="楼栋"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-select
              v-model="filters.unit"
              :items="unitOptions"
              label="单元"
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
              label="状态"
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

    <!-- 房产表格 -->
    <v-card rounded="lg">
      <v-data-table
        :headers="headers"
        :items="filteredHouses"
        :items-per-page="10"
        class="elevation-0"
      >
        <template #item.address="{ item }">
          <span class="font-weight-medium">{{ item.building }}{{ item.unit }}{{ item.room }}</span>
        </template>

        <template #item.area="{ item }">
          {{ item.area }} ㎡
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

        <template #item.actions="{ item }">
          <v-btn icon size="small" variant="text" @click="viewDetail(item)">
            <v-icon icon="mdi-eye" />
            <v-tooltip activator="parent" location="top">查看详情</v-tooltip>
          </v-btn>
          <v-btn icon size="small" variant="text" color="primary" @click="editHouse(item)">
            <v-icon icon="mdi-pencil" />
            <v-tooltip activator="parent" location="top">编辑</v-tooltip>
          </v-btn>
          <v-btn icon size="small" variant="text" color="error" @click="deleteHouse(item)">
            <v-icon icon="mdi-delete" />
            <v-tooltip activator="parent" location="top">删除</v-tooltip>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- 详情弹窗 -->
    <v-dialog v-model="detailDialog" max-width="600">
      <v-card v-if="selectedHouse">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-home" class="mr-2" />
          房产详情
          <v-spacer />
          <v-btn icon variant="text" @click="detailDialog = false">
            <v-icon icon="mdi-close" />
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="6">
              <div class="text-caption text-grey">房屋地址</div>
              <div class="text-body-1 font-weight-medium">
                {{ selectedHouse.building }}{{ selectedHouse.unit }}{{ selectedHouse.room }}
              </div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">建筑面积</div>
              <div class="text-body-1">{{ selectedHouse.area }} ㎡</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">房屋状态</div>
              <v-chip :color="getStatusColor(selectedHouse.status)" size="small" variant="tonal">
                {{ getStatusText(selectedHouse.status) }}
              </v-chip>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">业主姓名</div>
              <div class="text-body-1">{{ selectedHouse.ownerName }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">联系电话</div>
              <div class="text-body-1">{{ selectedHouse.ownerPhone }}</div>
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
import { usePropertyStore, type House } from '@/stores/property'

const propertyStore = usePropertyStore()

// 筛选条件
const filters = reactive({
  building: null as string | null,
  unit: null as string | null,
  status: null as string | null,
})

const buildingOptions = ['1栋', '2栋', '3栋', '4栋']
const unitOptions = ['1单元', '2单元']
const statusOptions = [
  { title: '自住', value: 'self' },
  { title: '出租', value: 'rent' },
  { title: '空置', value: 'empty' },
]

// 表格配置
const headers = [
  { title: '房屋地址', key: 'address', sortable: false },
  { title: '面积', key: 'area', sortable: true },
  { title: '状态', key: 'status', sortable: false },
  { title: '业主', key: 'ownerName', sortable: false },
  { title: '联系电话', key: 'ownerPhone', sortable: false },
  { title: '操作', key: 'actions', sortable: false, align: 'center' },
]

// 筛选后的房产列表
const filteredHouses = computed(() => {
  return propertyStore.houses.filter(house => {
    if (filters.building && house.building !== filters.building) return false
    if (filters.unit && house.unit !== filters.unit) return false
    if (filters.status && house.status !== filters.status) return false
    return true
  })
})

// 状态显示
function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    self: 'success',
    rent: 'info',
    empty: 'warning',
  }
  return colors[status] || 'grey'
}

function getStatusText(status: string) {
  const texts: Record<string, string> = {
    self: '自住',
    rent: '出租',
    empty: '空置',
  }
  return texts[status] || status
}

// 操作方法
function handleSearch() {
  // 筛选已经是响应式的，这里可以做额外处理
}

function resetFilters() {
  filters.building = null
  filters.unit = null
  filters.status = null
}

// 详情弹窗
const detailDialog = ref(false)
const selectedHouse = ref<House | null>(null)

function viewDetail(house: House) {
  selectedHouse.value = house
  detailDialog.value = true
}

function editHouse(house: House) {
  console.log('编辑房产:', house)
}

function deleteHouse(house: House) {
  console.log('删除房产:', house)
}

onMounted(() => {
  propertyStore.loadAll()
})

defineOptions({
  layout: 'admin',
})
</script>
