<template>
  <v-app>
    <!-- 顶栏 -->
    <v-app-bar color="primary" prominent>
      <v-app-bar-nav-icon @click="drawer = !drawer" />

      <v-toolbar-title>
        <span class="font-weight-bold">{{ appTitle }}</span>
      </v-toolbar-title>

      <!-- 面包屑 -->
      <v-breadcrumbs v-if="breadcrumbs.length" :items="breadcrumbs" class="ml-4 d-none d-md-flex">
        <template #divider>
          <v-icon icon="mdi-chevron-right" />
        </template>
      </v-breadcrumbs>

      <v-spacer />

      <!-- 用户菜单 -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" class="text-none">
            <v-avatar size="32" class="mr-2">
              <v-img :src="userAvatar" />
            </v-avatar>
            <span class="d-none d-sm-inline">{{ userName }}</span>
            <v-icon end icon="mdi-menu-down" />
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item prepend-icon="mdi-account" title="个人信息" />
          <v-list-item prepend-icon="mdi-cog" title="设置" />
          <v-divider />
          <v-list-item prepend-icon="mdi-logout" title="退出登录" @click="handleLogout" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- 侧边栏 -->
    <v-navigation-drawer v-model="drawer" :permanent="!mobile" :temporary="mobile">
      <v-list-item
        :prepend-avatar="userAvatar"
        :title="userName"
        :subtitle="roleLabel"
        class="px-2 py-3"
      />

      <v-divider />

      <v-list nav density="compact">
        <template v-for="item in menuItems" :key="item.title">
          <!-- 无子菜单 -->
          <v-list-item
            v-if="!item.children"
            :prepend-icon="item.icon"
            :title="item.title"
            :to="item.to"
            :value="item.to"
            rounded="lg"
            class="mb-1"
          />

          <!-- 有子菜单 -->
          <v-list-group v-else :value="item.title">
            <template #activator="{ props }">
              <v-list-item
                v-bind="props"
                :prepend-icon="item.icon"
                :title="item.title"
                rounded="lg"
                class="mb-1"
              />
            </template>

            <v-list-item
              v-for="child in item.children"
              :key="child.title"
              :prepend-icon="child.icon"
              :title="child.title"
              :to="child.to"
              :value="child.to"
              rounded="lg"
              class="mb-1"
            />
          </v-list-group>
        </template>
      </v-list>
    </v-navigation-drawer>

    <!-- 主内容区 -->
    <v-main>
      <v-container fluid class="pa-4 pa-md-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { mobile } = useDisplay()

const drawer = ref(true)

// 用户信息
const userName = computed(() => authStore.userName || '管理员')
const userAvatar = computed(() => authStore.user?.avatar || 'https://picsum.photos/seed/avatar/100/100')
const userRole = computed(() => authStore.userRole)
const roleLabel = computed(() => userRole.value === 'property' ? '物业管理员' : '商户管理员')

// 应用标题
const appTitle = computed(() => userRole.value === 'property' ? '物业管理系统' : '商户管理系统')

// 物业端菜单
const propertyMenuItems = [
  { title: '工作台', icon: 'mdi-view-dashboard', to: '/property/dashboard' },
  {
    title: '房屋与住户',
    icon: 'mdi-home-city',
    children: [
      { title: '房产列表', icon: 'mdi-home', to: '/property/houses' },
      { title: '住户审核', icon: 'mdi-account-check', to: '/property/residents/audit' },
      { title: '住户总表', icon: 'mdi-account-group', to: '/property/residents' },
    ],
  },
  { title: '工单中心', icon: 'mdi-clipboard-list', to: '/property/work-orders' },
  { title: '缴费管理', icon: 'mdi-cash-multiple', to: '/property/fees' },
  {
    title: '社区运营',
    icon: 'mdi-bullhorn',
    children: [
      { title: '公告发布', icon: 'mdi-newspaper', to: '/property/announcements' },
      { title: '社区活动', icon: 'mdi-party-popper', to: '/property/activities' },
    ],
  },
  {
    title: '系统与安防',
    icon: 'mdi-shield-home',
    children: [
      { title: '门禁日志', icon: 'mdi-door', to: '/property/access-logs' },
      { title: '员工管理', icon: 'mdi-account-tie', to: '/property/employees' },
    ],
  },
]

// 商户端菜单
const merchantMenuItems = [
  { title: '经营概览', icon: 'mdi-view-dashboard', to: '/merchant/dashboard' },
  { title: '订单管理', icon: 'mdi-receipt', to: '/merchant/orders' },
  { title: '商品管理', icon: 'mdi-package-variant', to: '/merchant/products' },
  { title: '店铺设置', icon: 'mdi-store-cog', to: '/merchant/settings' },
]

// 根据角色动态菜单
const menuItems = computed(() => {
  return userRole.value === 'property' ? propertyMenuItems : merchantMenuItems
})

// 面包屑
const breadcrumbs = computed(() => {
  const path = route.path
  const items: Array<{ title: string; disabled?: boolean }> = []

  // 根据路径生成面包屑
  if (path.startsWith('/property')) {
    items.push({ title: '物业管理' })
    if (path.includes('dashboard')) items.push({ title: '工作台', disabled: true })
    else if (path.includes('houses')) items.push({ title: '房产列表', disabled: true })
    else if (path.includes('residents/audit')) items.push({ title: '住户审核', disabled: true })
    else if (path.includes('residents')) items.push({ title: '住户总表', disabled: true })
    else if (path.includes('work-orders')) items.push({ title: '工单中心', disabled: true })
    else if (path.includes('fees')) items.push({ title: '缴费管理', disabled: true })
    else if (path.includes('announcements')) items.push({ title: '公告发布', disabled: true })
    else if (path.includes('activities')) items.push({ title: '社区活动', disabled: true })
    else if (path.includes('access-logs')) items.push({ title: '门禁日志', disabled: true })
    else if (path.includes('employees')) items.push({ title: '员工管理', disabled: true })
  } else if (path.startsWith('/merchant')) {
    items.push({ title: '商户管理' })
    if (path.includes('dashboard')) items.push({ title: '经营概览', disabled: true })
    else if (path.includes('orders')) items.push({ title: '订单管理', disabled: true })
    else if (path.includes('products')) items.push({ title: '商品管理', disabled: true })
    else if (path.includes('settings')) items.push({ title: '店铺设置', disabled: true })
  }

  return items
})

// 退出登录
function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>
