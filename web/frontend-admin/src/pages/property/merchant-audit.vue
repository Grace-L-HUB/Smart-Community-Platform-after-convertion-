<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">商户审核</h1>
      <v-chip color="warning" class="ml-3" size="small">
        {{ pendingApplications.length }} 条待处理
      </v-chip>
    </div>

    <!-- 筛选器 -->
    <v-card rounded="lg" class="mb-6">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              label="审核状态"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="loadApplications"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="categoryFilter"
              :items="categoryOptions"
              label="店铺分类"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="loadApplications"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchKeyword"
              label="搜索店铺名称或申请人"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="loadApplications"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn
              color="primary"
              variant="flat"
              block
              @click="loadApplications"
            >
              <v-icon start icon="mdi-refresh" />
              刷新
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 申请列表 -->
    <v-card rounded="lg">
      <v-data-table
        :headers="headers"
        :items="applications"
        :loading="loading"
        :items-per-page="10"
        class="elevation-0"
      >
        <template #item.shopCategory="{ item }">
          <v-chip
            :color="getCategoryColor(item.shopCategory)"
            size="small"
            variant="tonal"
          >
            {{ getCategoryLabel(item.shopCategory) }}
          </v-chip>
        </template>

        <template #item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
            variant="tonal"
          >
            {{ getStatusLabel(item.status) }}
          </v-chip>
        </template>

        <template #item.createdAt="{ item }">
          {{ formatTime(item.createdAt) }}
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-2">
            <v-btn
              color="info"
              size="small"
              variant="tonal"
              @click="viewApplication(item)"
            >
              <v-icon start icon="mdi-eye" />
              查看
            </v-btn>
            <v-btn
              v-if="item.status === 'pending'"
              color="success"
              size="small"
              variant="tonal"
              @click="approveApplication(item)"
            >
              <v-icon start icon="mdi-check" />
              通过
            </v-btn>
            <v-btn
              v-if="item.status === 'pending'"
              color="error"
              size="small"
              variant="tonal"
              @click="openRejectDialog(item)"
            >
              <v-icon start icon="mdi-close" />
              拒绝
            </v-btn>
          </div>
        </template>
      </v-data-table>

      <v-alert
        v-if="applications.length === 0 && !loading"
        type="info"
        variant="tonal"
        class="ma-4"
      >
        暂无商户申请记录
      </v-alert>
    </v-card>

    <!-- 申请详情弹窗 -->
    <v-dialog v-model="detailDialog" max-width="800" scrollable>
      <v-card v-if="selectedApplication">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-store" class="mr-2" />
          商户申请详情
          <v-spacer />
          <v-btn icon variant="text" @click="detailDialog = false">
            <v-icon icon="mdi-close" />
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-row>
            <!-- 基本信息 -->
            <v-col cols="12">
              <div class="text-h6 mb-4">基本信息</div>
              <v-card variant="outlined">
                <v-card-text>
                  <v-row dense>
                    <v-col cols="6">
                      <strong>申请人：</strong>{{ selectedApplication.userInfo?.displayName }}
                    </v-col>
                    <v-col cols="6">
                      <strong>手机号：</strong>{{ selectedApplication.userInfo?.phone }}
                    </v-col>
                    <v-col cols="6">
                      <strong>申请时间：</strong>{{ formatTime(selectedApplication.createdAt) }}
                    </v-col>
                    <v-col cols="6">
                      <strong>审核状态：</strong>
                      <v-chip
                        :color="getStatusColor(selectedApplication.status)"
                        size="small"
                        variant="tonal"
                      >
                        {{ getStatusLabel(selectedApplication.status) }}
                      </v-chip>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- 店铺信息 -->
            <v-col cols="12">
              <div class="text-h6 mb-4">店铺信息</div>
              <v-card variant="outlined">
                <v-card-text>
                  <v-row dense>
                    <v-col cols="6">
                      <strong>店铺名称：</strong>{{ selectedApplication.shopName }}
                    </v-col>
                    <v-col cols="6">
                      <strong>店铺分类：</strong>{{ getCategoryLabel(selectedApplication.shopCategory) }}
                    </v-col>
                    <v-col cols="6">
                      <strong>联系电话：</strong>{{ selectedApplication.shopPhone }}
                    </v-col>
                    <v-col cols="6">
                      <strong>营业时间：</strong>{{ selectedApplication.businessHoursStart }} - {{ selectedApplication.businessHoursEnd }}
                    </v-col>
                    <v-col cols="12">
                      <strong>店铺地址：</strong>{{ selectedApplication.shopAddress }}
                    </v-col>
                    <v-col cols="12">
                      <strong>店铺介绍：</strong>{{ selectedApplication.shopDescription }}
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- 法人信息 -->
            <v-col cols="12">
              <div class="text-h6 mb-4">法人信息</div>
              <v-card variant="outlined">
                <v-card-text>
                  <v-row dense>
                    <v-col cols="4">
                      <strong>法人姓名：</strong>{{ selectedApplication.legalName }}
                    </v-col>
                    <v-col cols="4">
                      <strong>身份证号：</strong>{{ maskIdCard(selectedApplication.legalIdCard) }}
                    </v-col>
                    <v-col cols="4">
                      <strong>手机号：</strong>{{ selectedApplication.legalPhone }}
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- 证照信息 -->
            <v-col cols="12">
              <div class="text-h6 mb-4">证照信息</div>
              <v-card variant="outlined">
                <v-card-text>
                  <v-row>
                    <v-col cols="4" class="text-center">
                      <div class="text-subtitle-2 mb-2">营业执照</div>
                      <v-img
                        :src="selectedApplication.businessLicense"
                        height="150"
                        class="border rounded cursor-pointer"
                        @click="previewImage(selectedApplication.businessLicense)"
                      />
                    </v-col>
                    <v-col cols="4" class="text-center">
                      <div class="text-subtitle-2 mb-2">身份证正面</div>
                      <v-img
                        :src="selectedApplication.identityCardFront"
                        height="150"
                        class="border rounded cursor-pointer"
                        @click="previewImage(selectedApplication.identityCardFront)"
                      />
                    </v-col>
                    <v-col cols="4" class="text-center">
                      <div class="text-subtitle-2 mb-2">身份证背面</div>
                      <v-img
                        :src="selectedApplication.identityCardBack"
                        height="150"
                        class="border rounded cursor-pointer"
                        @click="previewImage(selectedApplication.identityCardBack)"
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- 审核记录 -->
            <v-col v-if="selectedApplication.status !== 'pending'" cols="12">
              <div class="text-h6 mb-4">审核记录</div>
              <v-card variant="outlined">
                <v-card-text>
                  <v-row dense>
                    <v-col cols="6">
                      <strong>审核员：</strong>{{ selectedApplication.reviewerName || '-' }}
                    </v-col>
                    <v-col cols="6">
                      <strong>审核时间：</strong>{{ formatTime(selectedApplication.reviewedAt) }}
                    </v-col>
                    <v-col cols="12">
                      <strong>审核意见：</strong>{{ selectedApplication.reviewComment || '-' }}
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="detailDialog = false">
            关闭
          </v-btn>
          <v-btn
            v-if="selectedApplication.status === 'pending'"
            color="success"
            variant="flat"
            @click="approveApplication(selectedApplication)"
          >
            <v-icon start icon="mdi-check" />
            通过
          </v-btn>
          <v-btn
            v-if="selectedApplication.status === 'pending'"
            color="error"
            variant="flat"
            @click="openRejectDialog(selectedApplication)"
          >
            <v-icon start icon="mdi-close" />
            拒绝
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 拒绝原因弹窗 -->
    <v-dialog v-model="rejectDialog" max-width="500">
      <v-card>
        <v-card-title class="text-error">
          <v-icon icon="mdi-alert-circle" class="mr-2" />
          拒绝申请
        </v-card-title>
        <v-card-text>
          <p class="mb-4">
            确定要拒绝 <strong>{{ rejectingApplication?.shopName }}</strong> 的入驻申请吗？
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

    <!-- 图片预览弹窗 -->
    <v-dialog v-model="imagePreviewDialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center">
          证照预览
          <v-spacer />
          <v-btn icon variant="text" @click="imagePreviewDialog = false">
            <v-icon icon="mdi-close" />
          </v-btn>
        </v-card-title>
        <v-card-text class="text-center">
          <v-img :src="previewImageUrl" max-height="500" />
        </v-card-text>
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
import dayjs from 'dayjs'
import { merchantApplicationApi, type MerchantApplication } from '@/services/merchant'

// 数据状态
const loading = ref(false)
const applications = ref([])
const selectedApplication = ref(null)
const rejectingApplication = ref(null)

// 筛选状态
const statusFilter = ref('')
const categoryFilter = ref('')
const searchKeyword = ref('')

// 弹窗状态
const detailDialog = ref(false)
const rejectDialog = ref(false)
const imagePreviewDialog = ref(false)
const previewImageUrl = ref('')
const rejectReason = ref('')

// 表格配置
const headers = [
  { title: '店铺名称', key: 'shopName' },
  { title: '申请人', key: 'userInfo.displayName' },
  { title: '手机号', key: 'userInfo.phone' },
  { title: '店铺分类', key: 'shopCategory' },
  { title: '申请时间', key: 'createdAt' },
  { title: '状态', key: 'status' },
  { title: '操作', key: 'actions', sortable: false, align: 'center' as const },
] as const

// 选项数据
const statusOptions = [
  { title: '待审核', value: 'pending' },
  { title: '已通过', value: 'approved' },
  { title: '已拒绝', value: 'rejected' },
]

const categoryOptions = [
  { title: '便利店', value: 'convenience' },
  { title: '餐饮', value: 'catering' },
  { title: '美容美发', value: 'beauty' },
  { title: '家政服务', value: 'housekeeping' },
  { title: '维修服务', value: 'repair' },
  { title: '烘焙', value: 'bakery' },
  { title: '其他', value: 'other' },
]

// 计算属性
const pendingApplications = computed(() => 
  applications.value.filter(app => app.status === 'pending')
)

// 方法
function getCategoryLabel(value: string) {
  const option = categoryOptions.find(opt => opt.value === value)
  return option?.title || value
}

function getCategoryColor(category: string) {
  const colors = {
    convenience: 'blue',
    catering: 'orange',
    beauty: 'pink',
    housekeeping: 'green',
    repair: 'purple',
    bakery: 'brown',
    other: 'grey',
  }
  return colors[category] || 'grey'
}

function getStatusLabel(status: string) {
  const labels = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  }
  return labels[status] || status
}

function getStatusColor(status: string) {
  const colors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
  }
  return colors[status] || 'grey'
}

function formatTime(time: string) {
  return dayjs(time).format('MM-DD HH:mm')
}

function maskIdCard(idCard: string) {
  if (!idCard || idCard.length < 8) return idCard
  return idCard.substring(0, 4) + '****' + idCard.substring(idCard.length - 4)
}

async function loadApplications() {
  loading.value = true
  try {
    // 构建查询参数
    const params: any = {}
    if (statusFilter.value) {
      params.status = statusFilter.value
    }
    
    // 调用后端API
    const response = await merchantApplicationApi.getApplicationList(params)
    
    if (response.success && response.data) {
      let filteredApplications = response.data.items || []
      
      // 前端额外筛选（分类和关键词）
      if (categoryFilter.value) {
        filteredApplications = filteredApplications.filter(app => 
          app.shop_category === categoryFilter.value
        )
      }
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase()
        filteredApplications = filteredApplications.filter(app => 
          app.shop_name.toLowerCase().includes(keyword) ||
          (app.user_info?.display_name || '').toLowerCase().includes(keyword)
        )
      }
      
      // 转换数据格式以适配模板
      applications.value = filteredApplications.map(app => ({
        id: app.id,
        userInfo: {
          displayName: app.user_info?.display_name || app.user_info?.username || '未知用户',
          phone: app.user_info?.phone || '未知'
        },
        shopName: app.shop_name,
        shopCategory: app.shop_category,
        shopPhone: app.shop_phone,
        shopAddress: app.shop_address,
        shopDescription: app.shop_description,
        businessHoursStart: app.business_hours_start,
        businessHoursEnd: app.business_hours_end,
        legalName: app.legal_name,
        legalIdCard: app.legal_id_card,
        legalPhone: app.legal_phone,
        businessLicense: app.business_license,
        identityCardFront: app.identity_card_front,
        identityCardBack: app.identity_card_back,
        status: app.status,
        reviewerName: app.reviewer_name,
        reviewComment: app.review_comment,
        reviewedAt: app.reviewed_at,
        createdAt: app.created_at,
      }))
    } else {
      showSnackbar('error', response.message || '获取申请列表失败')
    }
    
  } catch (error) {
    console.error('加载申请列表失败:', error)
    showSnackbar('error', '加载申请列表失败')
  } finally {
    loading.value = false
  }
}

function viewApplication(application) {
  selectedApplication.value = application
  detailDialog.value = true
}

async function approveApplication(application) {
  try {
    // 调用后端API审核通过
    const response = await merchantApplicationApi.reviewApplication(application.id, {
      status: 'approved',
      review_comment: '审核通过'
    })
    
    if (response.success) {
      // 更新本地状态
      application.status = 'approved'
      application.reviewerName = '物业管理员'
      application.reviewComment = '审核通过'
      application.reviewedAt = new Date().toISOString().replace('T', ' ').slice(0, 19)
      
      showSnackbar('success', `商户 ${application.shopName} 审核通过`)
      detailDialog.value = false
      
      // 重新加载列表
      loadApplications()
    } else {
      showSnackbar('error', response.message || '审核失败')
    }
    
  } catch (error) {
    console.error('审核失败:', error)
    showSnackbar('error', '审核失败，请重试')
  }
}

function openRejectDialog(application) {
  rejectingApplication.value = application
  rejectReason.value = ''
  rejectDialog.value = true
  detailDialog.value = false
}

async function confirmReject() {
  if (!rejectReason.value) return

  try {
    // 调用后端API审核拒绝
    const response = await merchantApplicationApi.reviewApplication(rejectingApplication.value.id, {
      status: 'rejected',
      review_comment: rejectReason.value
    })
    
    if (response.success) {
      // 更新本地状态
      rejectingApplication.value.status = 'rejected'
      rejectingApplication.value.reviewerName = '物业管理员'
      rejectingApplication.value.reviewComment = rejectReason.value
      rejectingApplication.value.reviewedAt = new Date().toISOString().replace('T', ' ').slice(0, 19)
      
      showSnackbar('error', `商户 ${rejectingApplication.value.shopName} 审核被拒绝`)
      rejectDialog.value = false
      
      // 重新加载列表
      loadApplications()
    } else {
      showSnackbar('error', response.message || '操作失败')
    }
    
  } catch (error) {
    console.error('拒绝失败:', error)
    showSnackbar('error', '操作失败，请重试')
  }
}

function previewImage(imageUrl: string) {
  previewImageUrl.value = imageUrl
  imagePreviewDialog.value = true
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
  loadApplications()
})

defineOptions({
  layout: 'admin',
})
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.border {
  border: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
