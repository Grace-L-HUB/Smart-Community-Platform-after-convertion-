<template>
  <v-app>
    <v-main class="login-page">
      <!-- 背景 -->
      <div class="login-background" />

      <!-- 登录卡片 -->
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="5" lg="4" xl="3">
            <v-card class="login-card elevation-12" rounded="xl">
              <!-- Logo & Title -->
              <v-card-title class="text-center pt-8 pb-4">
                <v-icon icon="mdi-home-city" size="64" color="primary" class="mb-2" />
                <div class="text-h5 font-weight-bold">智慧社区管理平台</div>
                <div class="text-body-2 text-grey mt-1">Smart Community Platform</div>
              </v-card-title>

              <!-- 角色切换 Tabs -->
              <v-tabs v-model="selectedRole" color="primary" grow class="mb-4">
                <v-tab value="property">
                  <v-icon icon="mdi-domain" start />
                  物业端
                </v-tab>
                <v-tab value="merchant">
                  <v-icon icon="mdi-store" start />
                  商户端
                </v-tab>
              </v-tabs>

              <!-- 登录表单 -->
              <v-card-text class="px-6 pb-8">
                <v-form ref="formRef" v-model="formValid" @submit.prevent="handleLogin">
                  <v-text-field
                    v-model="form.username"
                    :rules="[rules.required]"
                    label="用户名"
                    prepend-inner-icon="mdi-account"
                    variant="outlined"
                    density="comfortable"
                    class="mb-4"
                    autocomplete="username"
                  />

                  <v-text-field
                    v-model="form.password"
                    :rules="[rules.required]"
                    :type="showPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    label="密码"
                    prepend-inner-icon="mdi-lock"
                    variant="outlined"
                    density="comfortable"
                    class="mb-6"
                    autocomplete="current-password"
                    @click:append-inner="showPassword = !showPassword"
                  />

                  <v-btn
                    :loading="loading"
                    :disabled="!formValid"
                    type="submit"
                    color="primary"
                    size="large"
                    block
                    rounded="lg"
                  >
                    登 录
                  </v-btn>
                </v-form>

                <!-- 提示信息 -->
                <v-alert
                  type="info"
                  variant="tonal"
                  density="compact"
                  class="mt-6"
                  closable
                >
                  演示账号：任意用户名和密码即可登录
                </v-alert>
              </v-card-text>
            </v-card>

            <!-- 版权信息 -->
            <div class="text-center text-white mt-4 text-body-2">
              © 2024 智慧社区平台 · 版权所有
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, type UserRole } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 表单状态
const formRef = ref()
const formValid = ref(false)
const loading = ref(false)
const showPassword = ref(false)
const selectedRole = ref<UserRole>('property')

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  required: (v: string) => !!v || '此字段为必填项',
}

// 登录处理
async function handleLogin() {
  if (!formValid.value) return

  loading.value = true

  try {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800))

    const result = authStore.login(form.username, form.password, selectedRole.value)

    if (result.success) {
      // 根据角色跳转到对应首页
      const targetPath = selectedRole.value === 'property'
        ? '/property/dashboard'
        : '/merchant/dashboard'

      router.push(targetPath)
    }
  } finally {
    loading.value = false
  }
}

// 页面级别使用 default 布局
defineOptions({
  layout: 'default',
})
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a237e 0%, #3949ab 50%, #5c6bc0 100%);
  background-size: cover;
}

.login-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('https://picsum.photos/seed/community/1920/1080') center/cover;
  opacity: 0.15;
}

.login-card {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95) !important;
}

@media (prefers-color-scheme: dark) {
  .login-card {
    background: rgba(30, 30, 30, 0.95) !important;
  }
}
</style>
