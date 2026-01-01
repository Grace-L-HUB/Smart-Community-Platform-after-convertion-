<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">房产列表</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">新增房产</v-btn>
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

    <!-- 新增房产弹窗 -->
    <v-dialog v-model="createDialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-home-plus" class="mr-2" />
          新增房产
          <v-spacer />
          <v-btn icon variant="text" @click="createDialog = false">
            <v-icon icon="mdi-close" />
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-form ref="createFormRef" v-model="createValid">
            <v-row>
              <v-col cols="6">
                <v-select
                  v-model="createFormData.building"
                  :items="buildingIdOptions"
                  item-title="title"
                  item-value="value"
                  label="楼栋"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="createFormData.unit"
                  :items="unitOptions"
                  label="单元"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="createFormData.floor"
                  type="number"
                  label="楼层"
                  variant="outlined"
                  :rules="[rules.required, rules.positiveNumber]"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="createFormData.room_number"
                  label="门牌号"
                  variant="outlined"
                  placeholder="如: 101"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="createFormData.area"
                  type="number"
                  label="面积 (㎡)"
                  variant="outlined"
                  :rules="[rules.required, rules.positiveNumber]"
                />
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="createFormData.status"
                  :items="statusCreateOptions"
                  item-title="title"
                  item-value="value"
                  label="房屋状态"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="createDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="createLoading" @click="submitCreate">确定</v-btn>
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

// 新增房产相关
const createDialog = ref(false)
const createValid = ref(false)
const createLoading = ref(false)
const createFormRef = ref<any>(null)

// 楼栋选项（带ID）
const buildingIdOptions = [
  { title: '1栋', value: 1 },
  { title: '2栋', value: 2 },
  { title: '3栋', value: 3 },
  { title: '4栋', value: 4 },
]

// 创建表单状态
const createFormData = reactive({
  building: null as number | null,
  unit: '',
  floor: 1,
  room_number: '',
  area: 0,
  status: 1,
})

// 状态选项（创建时使用）
const statusCreateOptions = [
  { title: '自住', value: 1 },
  { title: '出租', value: 2 },
  { title: '空置', value: 3 },
]

// 表单验证规则
const rules = {
  required: (v: any) => !!v || '此字段必填',
  positiveNumber: (v: any) => v > 0 || '必须大于0',
}

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

// 新增房产方法
function openCreateDialog() {
  // 重置表单
  createFormData.building = null
  createFormData.unit = '1单元'
  createFormData.floor = 1
  createFormData.room_number = ''
  createFormData.area = 0
  createFormData.status = 1
  createDialog.value = true
}

async function submitCreate() {
  const { valid } = await createFormRef.value.validate()
  if (!valid) return

  createLoading.value = true
  try {
    await propertyStore.createHouse({
      building: createFormData.building!,
      unit: createFormData.unit,
      floor: createFormData.floor,
      room_number: createFormData.room_number,
      area: createFormData.area,
      status: createFormData.status,
    })
    createDialog.value = false
  } catch (error: any) {
    console.error('创建房产失败:', error)
    // 这里可以添加错误提示
  } finally {
    createLoading.value = false
  }
}

onMounted(() => {
  propertyStore.loadAll()
})

defineOptions({
  layout: 'admin',
})
</script>
