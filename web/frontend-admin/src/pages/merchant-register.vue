<template>
  <v-app>
    <v-main class="register-page">
      <!-- 背景 -->
      <div class="register-background" />

      <!-- 注册卡片 -->
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="10" md="8" lg="6" xl="5">
            <v-card class="register-card elevation-12" rounded="xl">
              <!-- Logo & Title -->
              <v-card-title class="text-center pt-6 pb-4">
                <v-icon icon="mdi-store-plus" size="48" color="primary" class="mb-2" />
                <div class="text-h5 font-weight-bold">商户入驻申请</div>
                <div class="text-body-2 text-grey mt-1">Merchant Registration</div>
              </v-card-title>

              <!-- 步骤指示器 -->
              <v-stepper v-model="currentStep" class="elevation-0">
                <v-stepper-header>
                  <v-stepper-item
                    :complete="currentStep > 1"
                    :value="1"
                    title="基本信息"
                  />
                  <v-divider />
                  <v-stepper-item
                    :complete="currentStep > 2"
                    :value="2"
                    title="店铺信息"
                  />
                  <v-divider />
                  <v-stepper-item
                    :complete="currentStep > 3"
                    :value="3"
                    title="证照上传"
                  />
                  <v-divider />
                  <v-stepper-item
                    :value="4"
                    title="提交审核"
                  />
                </v-stepper-header>

                <v-stepper-window>
                  <!-- 步骤1：基本信息 -->
                  <v-stepper-window-item :value="1">
                    <v-card-text class="px-6">
                      <v-form ref="step1FormRef" v-model="step1Valid">
                        <v-row>
                          <v-col cols="12">
                            <v-text-field
                              v-model="form.username"
                              :rules="[rules.required]"
                              label="用户名"
                              prepend-inner-icon="mdi-account"
                              variant="outlined"
                              density="comfortable"
                              hint="用于登录系统的用户名"
                              persistent-hint
                            />
                          </v-col>
                          <v-col cols="12">
                            <v-text-field
                              v-model="form.password"
                              :rules="[rules.required, rules.minLength(6)]"
                              :type="showPassword ? 'text' : 'password'"
                              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                              label="密码"
                              prepend-inner-icon="mdi-lock"
                              variant="outlined"
                              density="comfortable"
                              @click:append-inner="showPassword = !showPassword"
                            />
                          </v-col>
                          <v-col cols="12">
                            <v-text-field
                              v-model="form.confirmPassword"
                              :rules="[rules.required, rules.passwordMatch]"
                              :type="showConfirmPassword ? 'text' : 'password'"
                              :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                              label="确认密码"
                              prepend-inner-icon="mdi-lock-check"
                              variant="outlined"
                              density="comfortable"
                              @click:append-inner="showConfirmPassword = !showConfirmPassword"
                            />
                          </v-col>
                          <v-col cols="12">
                            <v-text-field
                              v-model="form.phone"
                              :rules="[rules.required, rules.phone]"
                              label="手机号"
                              prepend-inner-icon="mdi-phone"
                              variant="outlined"
                              density="comfortable"
                            />
                          </v-col>
                        </v-row>
                      </v-form>
                    </v-card-text>
                  </v-stepper-window-item>

                  <!-- 步骤2：店铺信息 -->
                  <v-stepper-window-item :value="2">
                    <v-card-text class="px-6">
                      <v-form ref="step2FormRef" v-model="step2Valid">
                        <v-row>
                          <v-col cols="12">
                            <v-text-field
                              v-model="form.shopName"
                              :rules="[rules.required]"
                              label="店铺名称"
                              prepend-inner-icon="mdi-store"
                              variant="outlined"
                              density="comfortable"
                            />
                          </v-col>
                          <v-col cols="12">
                            <v-select
                              v-model="form.shopCategory"
                              :items="categoryOptions"
                              :rules="[rules.required]"
                              label="店铺分类"
                              prepend-inner-icon="mdi-tag"
                              variant="outlined"
                              density="comfortable"
                            />
                          </v-col>
                          <v-col cols="12">
                            <v-text-field
                              v-model="form.shopPhone"
                              :rules="[rules.required, rules.phone]"
                              label="店铺电话"
                              prepend-inner-icon="mdi-phone-outline"
                              variant="outlined"
                              density="comfortable"
                            />
                          </v-col>
                          <v-col cols="12">
                            <v-text-field
                              v-model="form.shopAddress"
                              :rules="[rules.required]"
                              label="店铺地址"
                              prepend-inner-icon="mdi-map-marker"
                              variant="outlined"
                              density="comfortable"
                            />
                          </v-col>
                          <v-col cols="6">
                            <v-text-field
                              v-model="form.businessHoursStart"
                              :rules="[rules.required]"
                              label="营业开始时间"
                              type="time"
                              prepend-inner-icon="mdi-clock-start"
                              variant="outlined"
                              density="comfortable"
                            />
                          </v-col>
                          <v-col cols="6">
                            <v-text-field
                              v-model="form.businessHoursEnd"
                              :rules="[rules.required]"
                              label="营业结束时间"
                              type="time"
                              prepend-inner-icon="mdi-clock-end"
                              variant="outlined"
                              density="comfortable"
                            />
                          </v-col>
                          <v-col cols="12">
                            <v-textarea
                              v-model="form.shopDescription"
                              :rules="[rules.required]"
                              label="店铺介绍"
                              prepend-inner-icon="mdi-text"
                              variant="outlined"
                              rows="3"
                              hint="简要介绍您的店铺特色和服务"
                              persistent-hint
                            />
                          </v-col>
                        </v-row>
                      </v-form>
                    </v-card-text>
                  </v-stepper-window-item>

                  <!-- 步骤3：证照上传 -->
                  <v-stepper-window-item :value="3">
                    <v-card-text class="px-6">
                      <v-form ref="step3FormRef" v-model="step3Valid">
                        <v-row>
                          <!-- 法人信息 -->
                          <v-col cols="12">
                            <div class="text-h6 mb-4">法人信息</div>
                          </v-col>
                          <v-col cols="12">
                            <v-text-field
                              v-model="form.legalName"
                              :rules="[rules.required]"
                              label="法人姓名"
                              prepend-inner-icon="mdi-account-tie"
                              variant="outlined"
                              density="comfortable"
                            />
                          </v-col>
                          <v-col cols="12">
                            <v-text-field
                              v-model="form.legalIdCard"
                              :rules="[rules.required, rules.idCard]"
                              label="法人身份证号"
                              prepend-inner-icon="mdi-card-account-details"
                              variant="outlined"
                              density="comfortable"
                            />
                          </v-col>
                          <v-col cols="12">
                            <v-text-field
                              v-model="form.legalPhone"
                              :rules="[rules.required, rules.phone]"
                              label="法人手机号"
                              prepend-inner-icon="mdi-phone"
                              variant="outlined"
                              density="comfortable"
                            />
                          </v-col>

                          <!-- 证照上传 -->
                          <v-col cols="12">
                            <div class="text-h6 mb-4">证照上传</div>
                          </v-col>
                          <v-col cols="12">
                            <v-file-input
                              v-model="form.businessLicense"
                              :rules="[rules.fileRequired]"
                              label="营业执照"
                              prepend-icon="mdi-file-document"
                              variant="outlined"
                              density="comfortable"
                              accept="image/*"
                              show-size
                            />
                          </v-col>
                          <v-col cols="6">
                            <v-file-input
                              v-model="form.identityCardFront"
                              :rules="[rules.fileRequired]"
                              label="身份证正面"
                              prepend-icon="mdi-card-account-details"
                              variant="outlined"
                              density="comfortable"
                              accept="image/*"
                              show-size
                            />
                          </v-col>
                          <v-col cols="6">
                            <v-file-input
                              v-model="form.identityCardBack"
                              :rules="[rules.fileRequired]"
                              label="身份证背面"
                              prepend-icon="mdi-card-account-details-outline"
                              variant="outlined"
                              density="comfortable"
                              accept="image/*"
                              show-size
                            />
                          </v-col>
                        </v-row>
                      </v-form>
                    </v-card-text>
                  </v-stepper-window-item>

                  <!-- 步骤4：提交审核 -->
                  <v-stepper-window-item :value="4">
                    <v-card-text class="px-6">
                      <div class="text-center">
                        <v-icon icon="mdi-check-circle" size="64" color="success" class="mb-4" />
                        <div class="text-h6 mb-4">确认提交申请</div>
                        <div class="text-body-2 text-grey mb-6">
                          请确认您填写的信息无误，提交后将进入审核流程
                        </div>

                        <!-- 信息预览 -->
                        <v-card variant="outlined" class="text-left mb-6">
                          <v-card-text>
                            <v-row dense>
                              <v-col cols="6">
                                <strong>用户名：</strong>{{ form.username }}
                              </v-col>
                              <v-col cols="6">
                                <strong>手机号：</strong>{{ form.phone }}
                              </v-col>
                              <v-col cols="6">
                                <strong>店铺名称：</strong>{{ form.shopName }}
                              </v-col>
                              <v-col cols="6">
                                <strong>店铺分类：</strong>{{ getCategoryLabel(form.shopCategory) }}
                              </v-col>
                              <v-col cols="12">
                                <strong>店铺地址：</strong>{{ form.shopAddress }}
                              </v-col>
                              <v-col cols="6">
                                <strong>营业时间：</strong>{{ form.businessHoursStart }} - {{ form.businessHoursEnd }}
                              </v-col>
                              <v-col cols="6">
                                <strong>法人姓名：</strong>{{ form.legalName }}
                              </v-col>
                            </v-row>
                          </v-card-text>
                        </v-card>

                        <v-checkbox
                          v-model="agreeTerms"
                          :rules="[v => !!v || '请同意服务条款']"
                          color="primary"
                        >
                          <template #label>
                            我已阅读并同意
                            <a href="#" class="text-primary">《商户入驻协议》</a>
                          </template>
                        </v-checkbox>
                      </div>
                    </v-card-text>
                  </v-stepper-window-item>
                </v-stepper-window>

                <!-- 操作按钮 -->
                <v-card-actions class="px-6 pb-6">
                  <v-btn
                    v-if="currentStep > 1"
                    variant="outlined"
                    @click="previousStep"
                  >
                    上一步
                  </v-btn>
                  <v-spacer />
                  <v-btn
                    v-if="currentStep < 4"
                    color="primary"
                    variant="flat"
                    :disabled="!canProceed"
                    @click="nextStep"
                  >
                    下一步
                  </v-btn>
                  <v-btn
                    v-else
                    color="primary"
                    variant="flat"
                    :loading="submitting"
                    :disabled="!agreeTerms"
                    @click="submitApplication"
                  >
                    提交申请
                  </v-btn>
                </v-card-actions>
              </v-stepper>

              <!-- 返回登录 -->
              <v-card-actions class="justify-center pb-4">
                <v-btn variant="text" color="primary" @click="$router.push('/login')">
                  返回登录
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- 成功提示弹窗 -->
    <v-dialog v-model="successDialog" max-width="400" persistent>
      <v-card>
        <v-card-text class="text-center pa-6">
          <v-icon icon="mdi-check-circle" size="64" color="success" class="mb-4" />
          <div class="text-h6 mb-2">申请提交成功！</div>
          <div class="text-body-2 text-grey">
            您的入驻申请已提交，请耐心等待物业审核。审核结果将通过短信通知您。
          </div>
        </v-card-text>
        <v-card-actions class="justify-center pb-4">
          <v-btn color="primary" variant="flat" @click="goToLogin">
            返回登录
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 错误提示 -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" location="top">
      {{ snackbarText }}
    </v-snackbar>
  </v-app>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { merchantRegisterApi } from '@/services/merchant'

const router = useRouter()

// 表单状态
const currentStep = ref(1)
const step1FormRef = ref()
const step2FormRef = ref()
const step3FormRef = ref()
const step1Valid = ref(false)
const step2Valid = ref(false)
const step3Valid = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const agreeTerms = ref(false)
const submitting = ref(false)
const successDialog = ref(false)

// 表单数据
const form = reactive({
  // 基本信息
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  
  // 店铺信息
  shopName: '',
  shopCategory: '',
  shopPhone: '',
  shopAddress: '',
  businessHoursStart: '08:00',
  businessHoursEnd: '22:00',
  shopDescription: '',
  
  // 法人信息
  legalName: '',
  legalIdCard: '',
  legalPhone: '',
  
  // 证照文件
  businessLicense: null as File[] | File | null,
  identityCardFront: null as File[] | File | null,
  identityCardBack: null as File[] | File | null,
})

// 店铺分类选项
const categoryOptions = [
  { title: '便利店', value: 'convenience' },
  { title: '餐饮', value: 'catering' },
  { title: '美容美发', value: 'beauty' },
  { title: '家政服务', value: 'housekeeping' },
  { title: '维修服务', value: 'repair' },
  { title: '烘焙', value: 'bakery' },
  { title: '其他', value: 'other' },
]

// 验证规则
const rules = {
  required: (v: string) => !!v || '此字段为必填项',
  minLength: (min: number) => (v: string) => (v && v.length >= min) || `至少需要${min}个字符`,
  phone: (v: string) => /^1[3-9]\d{9}$/.test(v) || '请输入有效的手机号',
  idCard: (v: string) => /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(v) || '请输入有效的身份证号',
  passwordMatch: (v: string) => v === form.password || '两次密码输入不一致',
  fileRequired: (v: any) => {
    if (Array.isArray(v)) return v.length > 0 || '请上传文件'
    return !!v || '请上传文件'
  },
}

// 计算属性
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1: return step1Valid.value
    case 2: return step2Valid.value
    case 3: return step3Valid.value
    default: return false
  }
})

// 方法
function getCategoryLabel(value: string) {
  const option = categoryOptions.find(opt => opt.value === value)
  return option?.title || value
}

async function nextStep() {
  const currentForm = getCurrentFormRef()
  if (currentForm && await currentForm.validate()) {
    currentStep.value++
  }
}

function previousStep() {
  currentStep.value--
}

function getCurrentFormRef() {
  switch (currentStep.value) {
    case 1: return step1FormRef.value
    case 2: return step2FormRef.value
    case 3: return step3FormRef.value
    default: return null
  }
}

async function submitApplication() {
  if (!agreeTerms.value) {
    showSnackbar('error', '请同意服务条款')
    return
  }

  submitting.value = true

  try {
    // 创建FormData对象
    const formData = new FormData()
    
    // 添加基本信息
    formData.append('username', form.username)
    formData.append('password', form.password)
    formData.append('phone', form.phone)
    
    // 添加店铺信息
    formData.append('shop_name', form.shopName)
    formData.append('shop_category', form.shopCategory)
    formData.append('shop_phone', form.shopPhone)
    formData.append('shop_address', form.shopAddress)
    formData.append('business_hours_start', form.businessHoursStart)
    formData.append('business_hours_end', form.businessHoursEnd)
    formData.append('shop_description', form.shopDescription)
    
    // 添加法人信息
    formData.append('legal_name', form.legalName)
    formData.append('legal_id_card', form.legalIdCard)
    formData.append('legal_phone', form.legalPhone)
    
    // Helper to get file
    const getFile = (val: any) => {
      if (Array.isArray(val)) return val[0]
      return val
    }

    // 添加文件
    const licenseFile = getFile(form.businessLicense)
    if (licenseFile) {
      formData.append('business_license', licenseFile)
    }
    const idFrontFile = getFile(form.identityCardFront)
    if (idFrontFile) {
      formData.append('identity_card_front', idFrontFile)
    }
    const idBackFile = getFile(form.identityCardBack)
    if (idBackFile) {
      formData.append('identity_card_back', idBackFile)
    }

    // 调用注册API
    const response = await merchantRegisterApi.register(formData)
    
    if (response.success) {
      successDialog.value = true
    } else {
      showSnackbar('error', response.message || '注册失败，请重试')
    }
    
  } catch (error) {
    console.error('提交申请失败:', error)
    showSnackbar('error', '提交申请失败，请重试')
  } finally {
    submitting.value = false
  }
}

function goToLogin() {
  router.push('/login')
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

// 页面级别使用 default 布局
defineOptions({
  layout: 'default',
})
</script>

<style scoped>
.register-page {
  position: relative;
  min-height: 100vh;
}

.register-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a237e 0%, #3949ab 50%, #5c6bc0 100%);
  background-size: cover;
}

.register-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('https://picsum.photos/seed/merchant/1920/1080') center/cover;
  opacity: 0.15;
}

.register-card {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95) !important;
}

@media (prefers-color-scheme: dark) {
  .register-card {
    background: rgba(30, 30, 30, 0.95) !important;
  }
}
</style>
