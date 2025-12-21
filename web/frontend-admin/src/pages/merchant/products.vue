<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">商品管理</h1>
      <v-spacer />
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
            :src="product.image"
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
              <span v-if="product.originalPrice" class="text-caption text-grey text-decoration-line-through ml-2">
                ¥{{ product.originalPrice }}
              </span>
            </div>

            <div class="d-flex justify-space-between text-caption text-grey">
              <span>库存: {{ product.stock }}</span>
              <span>已售: {{ product.salesCount }}</span>
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

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="top">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useMerchantStore, type Product } from '@/stores/merchant'

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
  editingProduct.value = product
  if (product) {
    form.name = product.name
    form.description = product.description
    form.image = product.image
    form.price = product.price
    form.originalPrice = product.originalPrice
    form.stock = product.stock
    form.category = product.category
    form.serviceTimeSlots = product.serviceTimeSlots || []
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
  editorDialog.value = true
}

async function saveProduct() {
  try {
    const productData = {
      name: form.name,
      description: form.description,
      image: form.image || `https://picsum.photos/seed/${Date.now()}/200/200`,
      price: form.price,
      originalPrice: form.originalPrice,
      stock: form.stock,
      category: form.category,
      status: 'online' as const,
      serviceTimeSlots: isServiceCategory.value ? form.serviceTimeSlots : undefined,
    }

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

onMounted(() => {
  merchantStore.loadAll()
})

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
