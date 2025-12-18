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
                    <v-img :src="form.logo" />
                  </v-avatar>
                  <div>
                    <v-btn variant="outlined" size="small" prepend-icon="mdi-camera">
                      更换头像
                    </v-btn>
                    <div class="text-caption text-grey mt-1">建议尺寸 200x200px</div>
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
              <v-img :src="form.logo" />
            </v-avatar>
            <h3 class="text-h6 font-weight-bold">{{ form.name }}</h3>
            <v-chip size="small" color="primary" variant="tonal" class="mt-2">
              {{ form.category }}
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

const merchantStore = useMerchantStore()

const formRef = ref()
const formValid = ref(false)
const saving = ref(false)

const categoryOptions = ['便利店', '餐饮', '美容美发', '家政服务', '维修服务', '其他']

const form = reactive({
  name: '',
  logo: '',
  announcement: '',
  businessHours: {
    start: '08:00',
    end: '22:00',
  },
  phone: '',
  address: '',
  category: '便利店',
})

function loadSettings() {
  const settings = merchantStore.shopSettings
  form.name = settings.name
  form.logo = settings.logo
  form.announcement = settings.announcement
  form.businessHours = { ...settings.businessHours }
  form.phone = settings.phone
  form.address = settings.address
  form.category = settings.category
}

function resetForm() {
  loadSettings()
}

async function saveSettings() {
  if (!formValid.value) return

  saving.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    merchantStore.updateShopSettings({
      name: form.name,
      logo: form.logo,
      announcement: form.announcement,
      businessHours: form.businessHours,
      phone: form.phone,
      address: form.address,
      category: form.category,
    })

    showSnackbar('success', '设置已保存')
  } finally {
    saving.value = false
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
  loadSettings()
})

defineOptions({
  layout: 'admin',
})
</script>
