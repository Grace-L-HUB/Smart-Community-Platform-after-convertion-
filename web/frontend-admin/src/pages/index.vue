<template>
  <div />
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 页面加载时自动跳转到登录页
onMounted(() => {
  router.push('/login')
})
</script>
