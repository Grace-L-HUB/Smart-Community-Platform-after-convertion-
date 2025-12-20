<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">公告发布</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openEditor(null)">
        发布公告
      </v-btn>
    </div>

    <!-- 公告列表 -->
    <v-card rounded="lg">
      <v-data-table
        :headers="headers"
        :items="announcements"
        :items-per-page="10"
        class="elevation-0"
      >
        <template #item.title="{ item }">
          <div class="d-flex align-center">
            <v-icon
              :icon="item.status === 'published' ? 'mdi-check-circle' : item.status === 'draft' ? 'mdi-pencil' : 'mdi-close-circle'"
              :color="item.status === 'published' ? 'success' : item.status === 'draft' ? 'warning' : 'error'"
              size="small"
              class="mr-2"
            />
            <span class="font-weight-medium">{{ item.title }}</span>
          </div>
        </template>

        <template #item.scope="{ item }">
          <v-chip size="small" :color="item.scope === 'all' ? 'primary' : 'secondary'" variant="tonal">
            {{ item.scope === 'all' ? '全员' : '指定楼栋' }}
          </v-chip>
        </template>

        <template #item.status="{ item }">
          <v-chip
            size="small"
            :color="item.status === 'published' ? 'success' : item.status === 'draft' ? 'warning' : 'error'"
            variant="flat"
          >
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>

        <template #item.createdAt="{ item }">
          {{ formatTime(item.createdAt) }}
        </template>

        <template #item.actions="{ item }">
          <v-btn icon size="small" variant="text" @click="previewAnnouncement(item)">
            <v-icon icon="mdi-eye" />
          </v-btn>
          <v-btn
            v-if="item.status === 'draft'"
            icon
            size="small"
            variant="text"
            color="primary"
            @click="openEditor(item)"
          >
            <v-icon icon="mdi-pencil" />
          </v-btn>
          <v-btn
            v-if="item.status === 'published'"
            icon
            size="small"
            variant="text"
            color="warning"
            @click="withdrawAnnouncement(item)"
          >
            <v-icon icon="mdi-undo" />
            <v-tooltip activator="parent" location="top">撤回</v-tooltip>
          </v-btn>
          <v-btn icon size="small" variant="text" color="error" @click="deleteAnnouncement(item)">
            <v-icon icon="mdi-delete" />
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- 编辑器弹窗 -->
    <v-dialog v-model="editorDialog" max-width="900" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <span>{{ editingAnnouncement ? '编辑公告' : '发布公告' }}</span>
          <v-spacer />
          <v-btn icon variant="text" @click="editorDialog = false">
            <v-icon icon="mdi-close" />
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-text-field
            v-model="form.title"
            label="公告标题"
            variant="outlined"
            class="mb-4"
            :rules="[v => !!v || '请输入标题']"
          />

          <v-select
            v-model="form.category"
            :items="categoryOptions"
            label="公告分类"
            variant="outlined"
            class="mb-4"
            item-title="label"
            item-value="value"
            :rules="[v => !!v || '请选择分类']"
          />

          <div class="mb-4">
            <div class="text-body-2 mb-2">公告内容</div>
            <QuillEditor
              v-model:content="form.content"
              content-type="html"
              theme="snow"
              :toolbar="toolbarOptions"
              style="height: 300px;"
            />
          </div>

          <v-radio-group v-model="form.scope" label="发送范围" inline class="mt-8">
            <v-radio label="全员" value="all" />
            <v-radio label="指定楼栋" value="building" />
          </v-radio-group>

          <v-select
            v-if="form.scope === 'building'"
            v-model="form.targetBuildings"
            :items="buildingOptions"
            label="选择楼栋"
            variant="outlined"
            multiple
            chips
            :rules="[v => form.scope === 'all' || (v && v.length > 0) || '请选择至少一个楼栋']"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="saveAsDraft">保存草稿</v-btn>
          <v-btn color="primary" variant="flat" @click="publishAnnouncement">发布</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 预览弹窗 -->
    <v-dialog v-model="previewDialog" max-width="700">
      <v-card v-if="previewingAnnouncement">
        <v-card-title>{{ previewingAnnouncement.title }}</v-card-title>
        <v-card-subtitle>
          {{ previewingAnnouncement.author }} · {{ formatTime(previewingAnnouncement.createdAt) }}
        </v-card-subtitle>
        <v-divider />
        <v-card-text>
          <div v-html="previewingAnnouncement.content" class="announcement-content" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="previewDialog = false">关闭</v-btn>
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
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { usePropertyStore, type Announcement } from '@/stores/property'
import { useAuthStore } from '@/stores'
import { propertyAPI } from '@/services/property'
import dayjs from 'dayjs'

const propertyStore = usePropertyStore()
const authStore = useAuthStore()

const announcements = computed(() => propertyStore.announcements)

// 表格
const headers = [
  { title: '标题', key: 'title' },
  { title: '发送范围', key: 'scope' },
  { title: '作者', key: 'author' },
  { title: '状态', key: 'status' },
  { title: '创建时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false, align: 'center' },
]

// 富文本工具栏
const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],
  ['blockquote', 'code-block'],
  [{ header: 1 }, { header: 2 }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ color: [] }, { background: [] }],
  ['link', 'image'],
  ['clean'],
]

function getStatusText(status: string) {
  const texts: Record<string, string> = {
    published: '已发布',
    draft: '草稿',
    withdrawn: '已撤回',
  }
  return texts[status] || status
}

function formatTime(time: string) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

// 编辑器
const editorDialog = ref(false)
const editingAnnouncement = ref<Announcement | null>(null)
const categoryOptions = ref<Array<{value: string, label: string}>>([])
const buildingOptions = ref<string[]>([])
const form = reactive({
  title: '',
  content: '',
  category: 'property_notice',
  scope: 'all' as 'all' | 'building',
  targetBuildings: [] as string[],
})

function openEditor(announcement: Announcement | null) {
  editingAnnouncement.value = announcement
  if (announcement) {
    form.title = announcement.title
    form.content = announcement.content
    form.category = (announcement as any).category || 'property_notice'
    form.scope = announcement.scope
    form.targetBuildings = announcement.targetBuildings || []
  } else {
    form.title = ''
    form.content = ''
    form.category = 'property_notice'
    form.scope = 'all'
    form.targetBuildings = []
  }
  editorDialog.value = true
}

async function saveAsDraft() {
  if (!form.title) {
    showSnackbar('error', '请输入标题')
    return
  }
  
  try {
    if (editingAnnouncement.value) {
      // 更新草稿
      await propertyStore.updateAnnouncement(editingAnnouncement.value.id, {
        title: form.title,
        content: form.content,
        category: form.category,
        scope: form.scope,
        targetBuildings: form.targetBuildings,
        action: 'save'
      })
    } else {
      // 创建草稿
      await propertyStore.addAnnouncement({
        title: form.title,
        content: form.content,
        category: form.category,
        scope: form.scope,
        targetBuildings: form.targetBuildings,
        author: authStore.userName || '管理员',
        status: 'draft',
        action: 'draft'
      })
    }
    showSnackbar('success', '草稿已保存')
    editorDialog.value = false
  } catch (error) {
    console.error('保存草稿失败:', error)
    showSnackbar('error', '保存草稿失败，请重试')
  }
}

async function publishAnnouncement() {
  if (!form.title) {
    showSnackbar('error', '请输入标题')
    return
  }
  
  try {
    if (editingAnnouncement.value) {
      // 发布草稿
      await propertyStore.updateAnnouncement(editingAnnouncement.value.id, {
        title: form.title,
        content: form.content,
        category: form.category,
        scope: form.scope,
        targetBuildings: form.targetBuildings,
        action: 'publish'
      })
    } else {
      // 直接创建并发布
      await propertyStore.addAnnouncement({
        title: form.title,
        content: form.content,
        category: form.category,
        scope: form.scope,
        targetBuildings: form.targetBuildings,
        author: authStore.userName || '管理员',
        status: 'published',
        action: 'publish'
      })
    }
    showSnackbar('success', '公告已发布')
    editorDialog.value = false
  } catch (error) {
    console.error('发布公告失败:', error)
    showSnackbar('error', '发布公告失败，请重试')
  }
}

async function withdrawAnnouncement(announcement: Announcement) {
  try {
    await propertyStore.withdrawAnnouncement(announcement.id)
    showSnackbar('warning', '公告已撤回')
  } catch (error) {
    console.error('撤回公告失败:', error)
    showSnackbar('error', '撤回公告失败，请重试')
  }
}

async function deleteAnnouncement(announcement: Announcement) {
  if (confirm(`确定要删除公告"${announcement.title}"吗？此操作不可恢复。`)) {
    try {
      await propertyStore.deleteAnnouncement(announcement.id)
      showSnackbar('success', '公告已删除')
    } catch (error) {
      console.error('删除公告失败:', error)
      showSnackbar('error', '删除公告失败，请重试')
    }
  }
}

// 预览
const previewDialog = ref(false)
const previewingAnnouncement = ref<Announcement | null>(null)

function previewAnnouncement(announcement: Announcement) {
  previewingAnnouncement.value = announcement
  previewDialog.value = true
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
  propertyStore.loadAll()
  await Promise.all([
    loadCategoryOptions(),
    loadBuildingOptions()
  ])
})

// 加载分类选项
async function loadCategoryOptions() {
  try {
    const response = await propertyAPI.getAnnouncementCategories()
    if (response.code === 200) {
      categoryOptions.value = response.data.categories
    }
  } catch (error) {
    console.error('加载分类选项失败:', error)
    // 使用默认分类选项作为备选
    categoryOptions.value = [
      { value: 'property_notice', label: '物业通知' },
      { value: 'community_news', label: '社区新闻' },
      { value: 'warm_tips', label: '温馨提示' }
    ]
  }
}

// 加载楼栋选项
async function loadBuildingOptions() {
  console.log('开始加载楼栋选项...')
  try {
    const response = await propertyAPI.getBuildingOptions()
    console.log('楼栋选项API响应:', response)
    if (response.code === 200) {
      buildingOptions.value = response.data || []
      console.log('楼栋选项加载成功:', buildingOptions.value)
    } else {
      console.error('楼栋选项API返回错误:', response)
      // 使用默认楼栋选项作为备选
      buildingOptions.value = ['1栋', '2栋', '3栋', '4栋']
    }
  } catch (error) {
    console.error('加载楼栋选项失败:', error)
    // 使用默认楼栋选项作为备选
    buildingOptions.value = ['1栋', '2栋', '3栋', '4栋']
  }
}

defineOptions({
  layout: 'admin',
})
</script>

<style scoped>
.announcement-content {
  line-height: 1.8;
}

.announcement-content :deep(p) {
  margin-bottom: 1em;
}
</style>
