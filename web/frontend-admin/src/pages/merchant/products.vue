<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">商品管理</h1>
      <v-spacer />
      <v-btn color="success" prepend-icon="mdi-ticket-percent" class="mr-2" @click="openCouponEditor">
        创建优惠券
      </v-btn>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openEditor(null)">
        添加商品
      </v-btn>
    </div>

    <!-- 筛选 -->
    <v-card rounded="lg" class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="searchKeyword"
              label="搜索商品"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filterCategory"
              :items="categories"
              label="分类"
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

    <!-- 商品列表 -->
    <v-row>
      <v-col
        v-for="product in filteredProducts"
        :key="product.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card rounded="lg" class="product-card">
          <v-img
            :src="product.image_url || getImageUrl(product.image)"
            height="160"
            cover
            class="position-relative"
          >
            <v-chip
              :color="product.status === 'online' ? 'success' : 'grey'"
              size="small"
              class="position-absolute ma-2"
              style="top: 0; right: 0;"
            >
              {{ product.status === 'online' ? '上架中' : '已下架' }}
            </v-chip>
          </v-img>

          <v-card-title class="pb-0 text-body-1">{{ product.name }}</v-card-title>

          <v-card-text class="pb-2">
            <div class="text-caption text-grey mb-2 text-truncate">{{ product.description }}</div>

            <div class="d-flex align-center mb-2">
              <span class="text-h6 font-weight-bold text-primary">¥{{ product.price }}</span>
              <span v-if="product.original_price" class="text-caption text-grey text-decoration-line-through ml-2">
                ¥{{ product.original_price }}
              </span>
            </div>

            <div class="d-flex justify-space-between text-caption text-grey">
              <span>库存: {{ product.stock }}</span>
              <span>已售: {{ product.sales_count || 0 }}</span>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn size="small" variant="text" @click="openEditor(product)">
              <v-icon start icon="mdi-pencil" />
              编辑
            </v-btn>
            <v-spacer />
            <v-btn
              size="small"
              :color="product.status === 'online' ? 'warning' : 'success'"
              variant="text"
              @click="toggleStatus(product)"
            >
              {{ product.status === 'online' ? '下架' : '上架' }}
            </v-btn>
            <v-btn size="small" color="error" variant="text" @click="confirmDelete(product)">
              删除
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- 编辑弹窗 -->
    <v-dialog v-model="editorDialog" max-width="600" persistent>
      <v-card>
        <v-card-title>{{ editingProduct ? '编辑商品' : '添加商品' }}</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-file-input
                v-model="form.imageFile"
                label="商品图片"
                variant="outlined"
                prepend-icon=""
                prepend-inner-icon="mdi-camera"
                accept="image/*"
                show-size
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="form.name"
                label="商品名称"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="form.description"
                label="商品描述"
                variant="outlined"
                rows="2"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="form.price"
                label="售价"
                type="number"
                prefix="¥"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="form.originalPrice"
                label="原价（可选）"
                type="number"
                prefix="¥"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="form.stock"
                label="库存"
                type="number"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="form.category"
                :items="categories"
                label="分类"
                variant="outlined"
              />
            </v-col>

            <!-- 服务时段（如果是服务类商品） -->
            <v-col v-if="isServiceCategory" cols="12">
              <v-combobox
                v-model="form.serviceTimeSlots"
                label="服务时段"
                variant="outlined"
                chips
                multiple
                closable-chips
                hint="输入可预约时段，如 09:00-11:00"
                persistent-hint
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editorDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="saveProduct">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-error">确认删除</v-card-title>
        <v-card-text>
          确定要删除商品 <strong>{{ deletingProduct?.name }}</strong> 吗？
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" @click="executeDelete">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 创建优惠券对话框 -->
    <v-dialog v-model="couponDialog" max-width="600" persistent>
      <v-card>
        <v-card-title>创建优惠券</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="couponForm.name"
                label="优惠券名称"
                variant="outlined"
                :rules="[v => !!v || '请输入优惠券名称']"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="couponForm.description"
                label="使用说明"
                variant="outlined"
                rows="2"
                :rules="[v => !!v || '请输入使用说明']"
              />
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="couponForm.coupon_type"
                :items="couponTypeOptions"
                label="优惠券类型"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="couponForm.amount"
                label="优惠金额"
                type="number"
                prefix="¥"
                variant="outlined"
                :rules="[v => v > 0 || '优惠金额必须大于0']"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="couponForm.min_amount"
                label="最低消费金额"
                type="number"
                prefix="¥"
                variant="outlined"
                hint="0表示无门槛"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="couponForm.total_count"
                label="发行数量"
                type="number"
                variant="outlined"
                :rules="[v => v > 0 || '发行数量必须大于0']"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="couponForm.per_user_limit"
                label="每人限领数量"
                type="number"
                variant="outlined"
                :rules="[v => v > 0 || '限领数量必须大于0']"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="couponForm.start_date"
                label="开始时间"
                type="datetime-local"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="couponForm.end_date"
                label="结束时间"
                type="datetime-local"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="couponDialog = false">取消</v-btn>
          <v-btn color="success" variant="flat" @click="createCoupon" :loading="creatingCoupon">创建</v-btn>
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
import { useMerchantStore, type Product } from '@/stores/merchant'
import { API_BASE_URL } from '@/services/api'

const merchantStore = useMerchantStore()

// 筛选
const searchKeyword = ref('')
const filterCategory = ref<string | null>(null)
const filterStatus = ref<string | null>(null)

const categories = ['饮品', '甜品', '烘焙', '家政服务', '便民服务']
const statusOptions = [
  { title: '上架中', value: 'online' },
  { title: '已下架', value: 'offline' },
]

const filteredProducts = computed(() => {
  return merchantStore.products.filter(p => {
    if (searchKeyword.value && !p.name.includes(searchKeyword.value)) return false
    if (filterCategory.value && p.category !== filterCategory.value) return false
    if (filterStatus.value && p.status !== filterStatus.value) return false
    return true
  })
})

// 编辑器
const editorDialog = ref(false)
const editingProduct = ref<Product | null>(null)
const form = reactive({
  name: '',
  description: '',
  image: '',
  imageFile: null as File[] | null,
  price: 0,
  originalPrice: undefined as number | undefined,
  stock: 100,
  category: '饮品',
  serviceTimeSlots: [] as string[],
})

const isServiceCategory = computed(() =>
  ['家政服务', '便民服务'].includes(form.category)
)

function openEditor(product: Product | null) {
  console.log('=== 打开编辑器 ===')
  console.log('商品数据:', product)
  console.log('商品的image字段:', product?.image)
  console.log('商品的image_url字段:', product?.image_url)

  editingProduct.value = product
  if (product) {
    form.name = product.name
    form.description = product.description
    form.image = product.image || ''
    form.price = product.price
    form.originalPrice = product.original_price
    form.stock = product.stock
    form.category = product.category
    form.serviceTimeSlots = product.service_time_slots || []
  } else {
    form.name = ''
    form.description = ''
    form.image = ''
    form.imageFile = null
    form.price = 0
    form.originalPrice = undefined
    form.stock = 100
    form.category = '饮品'
    form.serviceTimeSlots = []
  }

  console.log('设置后的form.image:', form.image)
  console.log('设置后的form.imageFile:', form.imageFile)

  editorDialog.value = true
}

async function saveProduct() {
  try {
    // 获取文件（如果有）
    // form.imageFile 可能是 File 对象或 File 数组
    let file = null
    if (form.imageFile) {
      if (Array.isArray(form.imageFile)) {
        file = form.imageFile.length > 0 ? form.imageFile[0] : null
      } else {
        file = form.imageFile
      }
    }

    let imageUrl = form.image

    console.log('=== 保存商品开始 ===')
    console.log('form.imageFile 类型:', Array.isArray(form.imageFile) ? '数组' : typeof form.imageFile)
    console.log('form.imageFile 值:', form.imageFile)
    console.log('提取的 file:', file)
    console.log('是否有新文件:', !!file)
    console.log('当前图片URL:', form.image)
    console.log('编辑中的商品:', editingProduct.value)

    // 如果有新文件，先上传图片
    if (file) {
      console.log('开始上传新图片...')
      const uploadedUrl = await uploadProductImage(file)
      console.log('上传返回的URL:', uploadedUrl)
      if (uploadedUrl) {
        imageUrl = uploadedUrl
      }
    }

    const productData = {
      name: form.name,
      description: form.description,
      price: form.price,
      original_price: form.originalPrice,  // API 使用 snake_case
      stock: form.stock,
      category: form.category,
      status: 'online' as const,
      service_time_slots: isServiceCategory.value ? form.serviceTimeSlots : undefined,  // API 使用 snake_case
      image: imageUrl,  // 使用上传后的URL
    }

    console.log('准备保存的商品数据:', productData)
    console.log('图片字段值:', productData.image)

    if (editingProduct.value) {
      await merchantStore.updateProduct(editingProduct.value.id, productData)
      showSnackbar('success', '商品已更新')
    } else {
      await merchantStore.addProduct(productData)
      showSnackbar('success', '商品已添加')
    }
    editorDialog.value = false
  } catch (error) {
    console.error('保存商品失败:', error)
    showSnackbar('error', error instanceof Error ? error.message : '保存失败，请重试')
  }
}

// 上传商品图片
async function uploadProductImage(file: File): Promise<string | null> {
  try {
    console.log('=== 开始上传图片 ===')
    console.log('文件名:', file.name)
    console.log('文件大小:', file.size)
    console.log('文件类型:', file.type)

    const formData = new FormData()
    formData.append('image', file)

    console.log('上传URL:', `${API_BASE_URL}/merchant/upload/product-image/`)

    const response = await fetch(`${API_BASE_URL}/merchant/upload/product-image/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    })

    console.log('上传响应状态:', response.status)
    const result = await response.json()
    console.log('上传响应数据:', result)

    if ((result.code === 200 || result.success === true) && result.data?.image_url) {
      console.log('✅ 上传成功，图片URL:', result.data.image_url)
      return result.data.image_url
    } else {
      console.error('❌ 上传失败:', result)
      showSnackbar('error', result.message || '图片上传失败')
      return null
    }
  } catch (error) {
    console.error('❌ 图片上传异常:', error)
    showSnackbar('error', '图片上传失败，请重试')
    return null
  }
}

async function toggleStatus(product: Product) {
  try {
    await merchantStore.toggleProductStatus(product.id)
    showSnackbar('success', product.status === 'online' ? '商品已下架' : '商品已上架')
  } catch (error) {
    console.error('切换状态失败:', error)
    showSnackbar('error', error instanceof Error ? error.message : '操作失败，请重试')
  }
}

// 删除
const deleteDialog = ref(false)
const deletingProduct = ref<Product | null>(null)

function confirmDelete(product: Product) {
  deletingProduct.value = product
  deleteDialog.value = true
}

async function executeDelete() {
  if (deletingProduct.value) {
    try {
      await merchantStore.deleteProduct(deletingProduct.value.id)
      showSnackbar('success', '商品已删除')
      deleteDialog.value = false
    } catch (error) {
      console.error('删除商品失败:', error)
      showSnackbar('error', error instanceof Error ? error.message : '删除失败，请重试')
    }
  }
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

// 优惠券相关
const couponDialog = ref(false)
const creatingCoupon = ref(false)

const couponTypeOptions = [
  { title: '满减券', value: 'deduction' },
  { title: '减价券', value: 'discount' },
  { title: '赠品券', value: 'gift' },
]

const couponForm = reactive({
  name: '',
  description: '',
  coupon_type: 'deduction',
  amount: 10,
  min_amount: 0,
  total_count: 100,
  per_user_limit: 1,
  start_date: '',
  end_date: '',
})

function openCouponEditor() {
  // 设置默认时间：开始时间为当前时间，结束时间为30天后
  const now = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 30)

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  couponForm.name = ''
  couponForm.description = ''
  couponForm.coupon_type = 'deduction'
  couponForm.amount = 10
  couponForm.min_amount = 0
  couponForm.total_count = 100
  couponForm.per_user_limit = 1
  couponForm.start_date = formatDateTime(now)
  couponForm.end_date = formatDateTime(endDate)

  couponDialog.value = true
}

async function createCoupon() {
  // 验证必填字段
  if (!couponForm.name || !couponForm.description || !couponForm.start_date || !couponForm.end_date) {
    showSnackbar('error', '请填写所有必填字段')
    return
  }

  if (couponForm.amount <= 0) {
    showSnackbar('error', '优惠金额必须大于0')
    return
  }

  if (couponForm.total_count <= 0) {
    showSnackbar('error', '发行数量必须大于0')
    return
  }

  if (new Date(couponForm.end_date) <= new Date(couponForm.start_date)) {
    showSnackbar('error', '结束时间必须晚于开始时间')
    return
  }

  creatingCoupon.value = true
  try {
    const { merchantCouponApi } = await import('@/services/merchant')
    const couponData = {
      name: couponForm.name,
      description: couponForm.description,
      coupon_type: couponForm.coupon_type,
      amount: couponForm.amount,
      min_amount: couponForm.min_amount,
      total_count: couponForm.total_count,
      per_user_limit: couponForm.per_user_limit,
      start_date: new Date(couponForm.start_date).toISOString(),
      end_date: new Date(couponForm.end_date).toISOString(),
    }

    const result = await merchantCouponApi.createCoupon(couponData)
    if (result.success) {
      showSnackbar('success', '优惠券创建成功')
      couponDialog.value = false
    } else {
      showSnackbar('error', result.message || '优惠券创建失败')
    }
  } catch (error) {
    console.error('创建优惠券失败:', error)
    showSnackbar('error', '创建优惠券失败，请重试')
  } finally {
    creatingCoupon.value = false
  }
}

// 将相对路径转换为完整URL
function getImageUrl(path: string | undefined): string {
  if (!path) return 'https://picsum.photos/seed/product/200/200'
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  // API_BASE_URL 包含 /api，需要去掉来获取基础 URL
  const baseUrl = API_BASE_URL.replace('/api', '')
  // 拼接后端地址
  return `${baseUrl}${path}`
}

onMounted(() => {
  merchantStore.loadAll()
})

// 监听文件选择变化
watch(() => form.imageFile, (newVal) => {
  console.log('=== form.imageFile 变化 ===')
  console.log('新值:', newVal)
  if (newVal && Array.isArray(newVal) && newVal.length > 0) {
    console.log('文件详情:', newVal[0])
    console.log('文件名:', newVal[0].name)
    console.log('文件大小:', newVal[0].size)
    console.log('文件类型:', newVal[0].type)
  }
}, { deep: true })

defineOptions({
  layout: 'admin',
})
</script>

<style scoped>
.product-card {
  transition: all 0.3s;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
</style>
