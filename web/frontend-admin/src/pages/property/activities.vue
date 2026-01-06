<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">社区活动</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openEditor(null)">
        发布活动
      </v-btn>
    </div>

    <!-- 活动卡片列表 -->
    <v-row>
      <v-col v-for="activity in activities" :key="activity.id" cols="12" sm="6" lg="4">
        <v-card rounded="lg" class="activity-card">
          <v-img
            :src="activity.image || `https://picsum.photos/seed/${activity.id}/400/200`"
            height="160"
            cover
            class="position-relative"
          >
            <v-chip
              :color="getStatusColor(activity.status)"
              size="small"
              class="position-absolute ma-2"
              style="top: 0; right: 0;"
            >
              {{ getStatusText(activity.status) }}
            </v-chip>
          </v-img>

          <v-card-title class="pb-0">{{ activity.title }}</v-card-title>

          <v-card-text class="pb-2">
            <div class="text-body-2 text-grey-darken-1 mb-3 text-truncate-2">
              {{ activity.description }}
            </div>

            <div class="d-flex align-center text-body-2 mb-1">
              <v-icon icon="mdi-map-marker" size="16" class="mr-1" />
              {{ activity.location }}
            </div>
            <div class="d-flex align-center text-body-2 mb-1">
              <v-icon icon="mdi-clock-outline" size="16" class="mr-1" />
              {{ formatTime(activity.start_time) }}
            </div>
            <div class="d-flex align-center text-body-2">
              <v-icon icon="mdi-account-group" size="16" class="mr-1" />
              {{ activity.current_participants }} / {{ activity.max_participants }} 人
            </div>

            <v-progress-linear
              :model-value="activity.registration_progress"
              color="primary"
              rounded
              class="mt-2"
            />
          </v-card-text>

          <v-card-actions>
            <v-btn size="small" variant="text" @click="viewParticipants(activity)">
              <v-icon start icon="mdi-account-multiple" />
              报名名单
            </v-btn>
            <v-spacer />
            <v-btn icon size="small" variant="text" @click="openEditor(activity)">
              <v-icon icon="mdi-pencil" />
            </v-btn>
            <v-btn icon size="small" variant="text" color="error" @click="deleteActivity(activity)">
              <v-icon icon="mdi-delete" />
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- 发布活动弹窗 -->
    <v-dialog v-model="editorDialog" max-width="600">
      <v-card>
        <v-card-title>{{ isEditing ? '编辑活动' : '发布活动' }}</v-card-title>
        <v-card-text>
          <!-- 活动图片上传 -->
          <v-file-input
            v-model="form.imageFile"
            label="活动图片"
            variant="outlined"
            prepend-icon=""
            prepend-inner-icon="mdi-camera"
            accept="image/*"
            show-size
            class="mb-4"
          />

          <v-text-field
            v-model="form.title"
            label="活动名称"
            variant="outlined"
            class="mb-4"
          />
          <v-textarea
            v-model="form.description"
            label="活动描述"
            variant="outlined"
            rows="3"
            class="mb-4"
          />
          <v-text-field
            v-model="form.location"
            label="活动地点"
            variant="outlined"
            class="mb-4"
          />
          <v-row>
            <v-col cols="6">
          <v-text-field
            v-model="form.startTime"
            label="开始时间"
            type="datetime-local"
            variant="outlined"
            required
          />
            </v-col>
            <v-col cols="6">
          <v-text-field
            v-model="form.endTime"
            label="结束时间"
            type="datetime-local"
            variant="outlined"
            required
          />
            </v-col>
          </v-row>
          <v-text-field
            v-model.number="form.maxParticipants"
            label="最大人数"
            type="number"
            variant="outlined"
            class="mb-4"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelEdit">取消</v-btn>
          <v-btn 
            color="primary" 
            variant="flat" 
            @click="saveActivity"
            :loading="saving"
          >
            {{ isEditing ? '保存' : '发布' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 报名名单弹窗 -->
    <v-dialog v-model="participantsDialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center">
          <span>报名名单</span>
          <v-spacer />
          <v-chip size="small" color="primary">
            {{ participants.length }} 人
          </v-chip>
        </v-card-title>
        
        <v-card-text style="max-height: 400px; overflow-y: auto;">
          <v-list v-if="participants.length > 0">
            <v-list-item
              v-for="participant in participants"
              :key="participant.id"
              :title="participant.user.display_name || participant.user.nickname"
              :subtitle="participant.contact_phone || '未提供联系方式'"
            >
              <template #prepend>
                <v-avatar color="primary" size="36">
                  <v-img
                    v-if="participant.user.avatar"
                    :src="participant.user.avatar"
                  />
                  <span v-else>
                    {{ (participant.user.display_name || participant.user.nickname)?.charAt(0) }}
                  </span>
                </v-avatar>
              </template>
              
            </v-list-item>
          </v-list>
          
          <v-empty-state
            v-else
            title="暂无报名"
            text="还没有人报名参加此活动"
            icon="mdi-account-group"
          />
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="participantsDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 删除确认弹窗 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>确认删除</v-card-title>
        <v-card-text>
          确定要删除活动"{{ deleteTarget?.title }}"吗？此操作不可恢复。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn 
            color="error" 
            variant="flat" 
            @click="confirmDelete"
            :loading="deleting"
          >
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="top">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/auth'

// API服务
const API_BASE = 'http://139.224.17.154:8000/api'

// 认证store
const authStore = useAuthStore()

// 获取Authorization头
const getAuthHeaders = (): Record<string, string> => {
  // 临时移除认证头进行测试
  return {}
  // const token = authStore.token
  // return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// 活动类型定义
interface Activity {
  id: number
  title: string
  description: string
  location: string
  start_time: string
  end_time: string
  max_participants: number
  current_participants: number
  status: 'upcoming' | 'ongoing' | 'ended'
  organizer: {
    id: number
    nickname: string
    avatar: string | null
    display_name: string
  }
  view_count: number
  registration_progress: number
  can_register: boolean
  user_registered: boolean
  image: string | null
}

interface Participant {
  id: number
  user: {
    id: number
    nickname: string
    avatar: string | null
    display_name: string
  }
  status: string
  contact_phone: string
  created_at: string
  time_ago: string
}

// 响应式数据
const activities = ref<Activity[]>([])
const participants = ref<Participant[]>([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    upcoming: 'primary',
    ongoing: 'success',
    ended: 'grey',
  }
  return colors[status] || 'grey'
}

function getStatusText(status: string) {
  const texts: Record<string, string> = {
    upcoming: '即将开始',
    ongoing: '进行中',
    ended: '已结束',
  }
  return texts[status] || status
}

function formatTime(time: string) {
  return dayjs(time).format('MM-DD HH:mm')
}

// 编辑器
const editorDialog = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  title: '',
  description: '',
  location: '',
  startTime: '',
  endTime: '',
  maxParticipants: 50,
  image: '',
  imageFile: null as File[] | null,
})

function openEditor(activity: Activity | null) {
  if (activity) {
    isEditing.value = true
    editingId.value = activity.id
    form.title = activity.title
    form.description = activity.description
    form.location = activity.location
    form.startTime = dayjs(activity.start_time).format('YYYY-MM-DDTHH:mm')
    form.endTime = dayjs(activity.end_time).format('YYYY-MM-DDTHH:mm')
    form.maxParticipants = activity.max_participants
    form.image = activity.image || ''
    form.imageFile = null
  } else {
    isEditing.value = false
    editingId.value = null
    form.title = ''
    form.description = ''
    form.location = ''
    form.startTime = ''
    form.endTime = ''
    form.maxParticipants = 50
    form.image = ''
    form.imageFile = null
  }
  editorDialog.value = true
}



// 报名名单
const participantsDialog = ref(false)

async function viewParticipants(activity: Activity) {
  participantsDialog.value = true
  await fetchParticipants(activity.id)
}

// 删除活动
const deleteDialog = ref(false)
const deleteTarget = ref<Activity | null>(null)

function deleteActivity(activity: Activity) {
  deleteTarget.value = activity
  deleteDialog.value = true
}

async function confirmDelete() {
  if (deleteTarget.value) {
    const success = await deleteActivityApi(deleteTarget.value.id)
    if (success) {
      deleteDialog.value = false
      deleteTarget.value = null
    }
  }
}


// 提示
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

function showSnackbar(text: string, color: string = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

// 获取活动列表
async function fetchActivities() {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/community/activities/`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (data.code === 200) {
      activities.value = data.data
      // 将后端数据映射到前端模型
      activities.value = data.data.map((item: any) => ({
        ...item,
        current_participants: item.participants_count,
        max_participants: item.max_participants,
        start_time: item.start_time,
        end_time: item.end_time,
      }))
    }
  } catch (error) {
    console.error('获取活动列表失败:', error)
    showSnackbar('获取活动列表失败', 'error')
  } finally {
    loading.value = false
  }
}

// 获取报名名单
async function fetchParticipants(activityId: number) {
  try {
    const response = await fetch(`${API_BASE}/community/activities/${activityId}/participants/`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (data.code === 200) {
      participants.value = data.data
    }
  } catch (error) {
    console.error('获取报名名单失败:', error)
    showSnackbar('获取报名名单失败', 'error')
  }
}

// 上传活动图片
async function uploadActivityImage(file: File): Promise<string | null> {
  try {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch(`${API_BASE}/community/upload/image/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    })

    const result = await response.json()
    if (result.code === 200 && result.data?.url) {
      return result.data.url
    } else {
      showSnackbar(result.message || '图片上传失败', 'error')
      return null
    }
  } catch (error) {
    console.error('图片上传异常:', error)
    showSnackbar('图片上传失败，请重试', 'error')
    return null
  }
}

// 保存活动
async function saveActivity() {
  saving.value = true
  try {
    // 获取文件（如果有）
    let file = null
    if (form.imageFile) {
      if (Array.isArray(form.imageFile)) {
        file = form.imageFile.length > 0 ? form.imageFile[0] : null
      } else {
        file = form.imageFile
      }
    }

    let imageUrl = form.image
    console.log('原始图片URL:', imageUrl)

    // 如果有新文件，先上传图片
    if (file) {
      console.log('上传图片文件:', file)
      const uploadedUrl = await uploadActivityImage(file)
      if (uploadedUrl) {
        imageUrl = uploadedUrl
        console.log('上传后的图片URL:', imageUrl)
      }
    }

    // 构造请求数据
    const payload: Record<string, any> = {
      title: form.title,
      description: form.description,
      location: form.location,
      start_time: form.startTime,
      end_time: form.endTime,
      max_participants: form.maxParticipants,
    }

    // 只有在有有效图片URL时才添加image字段
    if (imageUrl && imageUrl.trim() !== '') {
      payload.image = imageUrl
    }
    console.log('发送的payload:', JSON.stringify(payload, null, 2))

    const url = isEditing.value && editingId.value
      ? `${API_BASE}/community/activities/${editingId.value}/`
      : `${API_BASE}/community/activities/`

    const method = isEditing.value ? 'PUT' : 'POST'
    console.log('请求URL:', url)
    console.log('请求方法:', method)

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    })

    console.log('响应状态:', response.status)
    const data = await response.json()
    console.log('响应数据:', data)

    if (data.code === 200 || response.status === 201) {
      showSnackbar(isEditing.value ? '活动已更新' : '活动已发布')
      editorDialog.value = false
      fetchActivities()
    } else {
      showSnackbar(data.message || '操作失败', 'error')
    }
  } catch (error) {
    console.error('保存活动失败:', error)
    showSnackbar('保存活动失败', 'error')
  } finally {
    saving.value = false
  }
}

// 删除活动API
async function deleteActivityApi(id: number) {
  deleting.value = true
  try {
    const response = await fetch(`${API_BASE}/community/activities/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (data.code === 200) {
      showSnackbar('活动已删除')
      fetchActivities()
      return true
    } else {
      showSnackbar(data.message || '删除失败', 'error')
      return false
    }
  } catch (error) {
    console.error('删除活动失败:', error)
    showSnackbar('删除活动失败', 'error')
    return false
  } finally {
    deleting.value = false
  }
}

function cancelEdit() {
  editorDialog.value = false
  form.imageFile = null
}

onMounted(() => {
  fetchActivities()
})

defineOptions({
  layout: 'admin',
})
</script>

<style scoped>
.activity-card {
  transition: all 0.3s;
}

.activity-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
