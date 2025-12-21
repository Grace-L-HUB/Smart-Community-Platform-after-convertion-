<template>
  <v-container fluid>
    <h1 class="text-h4 font-weight-bold mb-6">店铺设置</h1>

    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg">
          <v-card-title>基本信息</v-card-title>
          <v-card-text>
            <v-form ref="formRef" v-model="formValid">
              <v-row>
                <!-- 头像上传 -->
                <v-col cols="12" class="d-flex align-center mb-4">
                  <v-avatar size="80" class="mr-4">
                    <v-img :src="getLogoUrl()" />
                  </v-avatar>
                  <div>
                    <v-file-input
                      v-model="form.logo"
                      accept="image/*"
                      show-size
                      variant="outlined"
                      density="compact"
                      prepend-icon=""
                      prepend-inner-icon="mdi-camera"
                      label="更换Logo"
                      hide-details
                      class="mb-2"
                      style="max-width: 200px;"
                    />
                    <div class="text-caption text-grey">建议尺寸 200x200px</div>
                  </div>
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="form.name"
                    label="店铺名称"
                    variant="outlined"
                    :rules="[v => !!v || '请输入店铺名称']"
                  />
                </v-col>

                <v-col cols="12">
                  <v-select
                    v-model="form.category"
                    :items="categoryOptions"
                    label="店铺分类"
                    variant="outlined"
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="form.description"
                    label="店铺介绍"
                    variant="outlined"
                    rows="3"
                    hint="简要介绍您的店铺特色和服务"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="form.announcement"
                    label="店铺公告"
                    variant="outlined"
                    rows="3"
                    hint="显示在店铺主页"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="form.businessHours.start"
                    label="营业开始时间"
                    type="time"
                    variant="outlined"
                  />
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="form.businessHours.end"
                    label="营业结束时间"
                    type="time"
                    variant="outlined"
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="form.phone"
                    label="联系电话"
                    variant="outlined"
                    prepend-inner-icon="mdi-phone"
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="form.address"
                    label="店铺地址"
                    variant="outlined"
                    prepend-inner-icon="mdi-map-marker"
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>

          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" @click="resetForm">重置</v-btn>
            <v-btn color="primary" variant="flat" :loading="saving" @click="saveSettings">
              保存设置
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- 预览 -->
      <v-col cols="12" md="4">
        <v-card rounded="lg">
          <v-card-title>店铺预览</v-card-title>
          <v-card-text class="text-center">
            <v-avatar size="80" class="mb-3">
              <v-img :src="getLogoUrl()" />
            </v-avatar>
            <h3 class="text-h6 font-weight-bold">{{ form.name }}</h3>
            <v-chip size="small" color="primary" variant="tonal" class="mt-2">
              {{ getCategoryLabel(form.category) }}
            </v-chip>
            <div class="text-body-2 text-grey mt-3">{{ form.announcement }}</div>

            <v-divider class="my-4" />

            <div class="text-left">
              <div class="d-flex align-center mb-2">
                <v-icon icon="mdi-clock-outline" size="18" class="mr-2" />
                <span class="text-body-2">{{ form.businessHours.start }} - {{ form.businessHours.end }}</span>
              </div>
              <div class="d-flex align-center mb-2">
                <v-icon icon="mdi-phone" size="18" class="mr-2" />
                <span class="text-body-2">{{ form.phone }}</span>
              </div>
              <div class="d-flex align-center">
                <v-icon icon="mdi-map-marker" size="18" class="mr-2" />
                <span class="text-body-2">{{ form.address }}</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="top">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useMerchantStore } from '@/stores'
import { merchantProfileApi, type MerchantProfile } from '@/services/merchant'

const merchantStore = useMerchantStore()

const formRef = ref()
const formValid = ref(false)
const saving = ref(false)
const loading = ref(false)
const profile = ref<MerchantProfile | null>(null)

const categoryOptions = [
  { title: '便利店', value: 'convenience' },
  { title: '餐饮', value: 'catering' },
  { title: '美容美发', value: 'beauty' },
  { title: '家政服务', value: 'housekeeping' },
  { title: '维修服务', value: 'repair' },
  { title: '烘焙', value: 'bakery' },
  { title: '其他', value: 'other' },
]

const form = reactive({
  name: '',
  logo: null as File[] | null,
  announcement: '',
  businessHours: {
    start: '08:00',
    end: '22:00',
  },
  phone: '',
  address: '',
  category: 'convenience',
  description: '',
})

async function loadProfile() {
  loading.value = true
  try {
    const response = await merchantProfileApi.getProfile()
    if (response.success) {
      profile.value = response.data
      loadFormFromProfile(response.data)
    } else {
      showSnackbar('error', response.message || '加载档案信息失败')
    }
  } catch (error) {
    console.error('加载商户档案失败:', error)
    showSnackbar('error', '加载档案信息失败')
  } finally {
    loading.value = false
  }
}

function loadFormFromProfile(profileData: MerchantProfile) {
  form.name = profileData.shop_name
  form.announcement = profileData.shop_announcement
  form.businessHours.start = profileData.business_hours_start
  form.businessHours.end = profileData.business_hours_end
  form.phone = profileData.shop_phone
  form.address = profileData.shop_address
  form.category = profileData.shop_category
  form.description = profileData.shop_description
}

function loadSettings() {
  if (profile.value) {
    loadFormFromProfile(profile.value)
  } else {
    // 如果没有档案数据，使用store中的mock数据
    const settings = merchantStore.shopSettings
    form.name = settings.name
    form.announcement = settings.announcement
    form.businessHours = { ...settings.businessHours }
    form.phone = settings.phone
    form.address = settings.address
    form.category = settings.category
  }
}

function resetForm() {
  loadSettings()
}

async function saveSettings() {
  if (!formValid.value) return

  saving.value = true
  try {
    // 创建FormData对象
    const formData = new FormData()
    formData.append('shop_name', form.name)
    formData.append('shop_announcement', form.announcement)
    formData.append('business_hours_start', form.businessHours.start)
    formData.append('business_hours_end', form.businessHours.end)
    formData.append('shop_phone', form.phone)
    formData.append('shop_address', form.address)
    formData.append('shop_description', form.description)
    
    // 如果有新的logo文件
    if (form.logo && form.logo.length > 0) {
      formData.append('shop_logo', form.logo[0])
    }

    const response = await merchantProfileApi.updateProfile(formData)
    
    if (response.success) {
      profile.value = response.data
      showSnackbar('success', '设置已保存')
    } else {
      showSnackbar('error', response.message || '保存失败')
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    showSnackbar('error', '保存设置失败，请重试')
  } finally {
    saving.value = false
  }
}

function getCategoryLabel(value: string) {
  const option = categoryOptions.find(opt => opt.value === value)
  return option?.title || value
}

function getLogoUrl() {
  // 如果有新选择的文件，显示预览
  if (form.logo && form.logo.length > 0) {
    return URL.createObjectURL(form.logo[0])
  }
  // 否则显示现有的logo
  return profile.value?.shop_logo || 'https://picsum.photos/seed/shop/100/100'
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

onMounted(async () => {
  await loadProfile()
  // 如果没有档案数据，回退到使用store数据
  if (!profile.value) {
    merchantStore.loadAll()
    loadSettings()
  }
})

defineOptions({
  layout: 'admin',
})
</script>
