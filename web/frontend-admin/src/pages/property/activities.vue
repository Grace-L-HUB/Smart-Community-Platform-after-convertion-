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
            :src="`https://picsum.photos/seed/${activity.id}/400/200`"
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
              {{ formatTime(activity.startTime) }}
            </div>
            <div class="d-flex align-center text-body-2">
              <v-icon icon="mdi-account-group" size="16" class="mr-1" />
              {{ activity.currentParticipants }} / {{ activity.maxParticipants }} 人
            </div>

            <v-progress-linear
              :model-value="(activity.currentParticipants / activity.maxParticipants) * 100"
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
            <v-btn icon size="small" variant="text">
              <v-icon icon="mdi-pencil" />
            </v-btn>
            <v-btn icon size="small" variant="text" color="error">
              <v-icon icon="mdi-delete" />
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- 发布活动弹窗 -->
    <v-dialog v-model="editorDialog" max-width="600">
      <v-card>
        <v-card-title>发布活动</v-card-title>
        <v-card-text>
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
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.endTime"
                label="结束时间"
                type="datetime-local"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-text-field
            v-model.number="form.maxParticipants"
            label="最大人数"
            type="number"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editorDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="publishActivity">发布</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 报名名单弹窗 -->
    <v-dialog v-model="participantsDialog" max-width="500">
      <v-card>
        <v-card-title>报名名单</v-card-title>
        <v-list>
          <v-list-item
            v-for="(p, i) in mockParticipants"
            :key="i"
            :title="p.name"
            :subtitle="p.phone"
          >
            <template #prepend>
              <v-avatar color="primary" size="36">
                {{ p.name.charAt(0) }}
              </v-avatar>
            </template>
          </v-list-item>
        </v-list>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="participantsDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="success" location="top">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { usePropertyStore, type Activity } from '@/stores/property'
import dayjs from 'dayjs'

const propertyStore = usePropertyStore()

const activities = computed(() => propertyStore.activities)

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
const form = reactive({
  title: '',
  description: '',
  location: '',
  startTime: '',
  endTime: '',
  maxParticipants: 50,
})

function openEditor(_activity: Activity | null) {
  form.title = ''
  form.description = ''
  form.location = ''
  form.startTime = ''
  form.endTime = ''
  form.maxParticipants = 50
  editorDialog.value = true
}

function publishActivity() {
  propertyStore.addActivity({
    title: form.title,
    description: form.description,
    location: form.location,
    startTime: form.startTime,
    endTime: form.endTime,
    maxParticipants: form.maxParticipants,
    status: 'upcoming',
  })
  showSnackbar('活动已发布')
  editorDialog.value = false
}

// 报名名单
const participantsDialog = ref(false)
const mockParticipants = [
  { name: '张三', phone: '138****8001' },
  { name: '李四', phone: '138****8002' },
  { name: '王五', phone: '138****8003' },
]

function viewParticipants(_activity: Activity) {
  participantsDialog.value = true
}

// 提示
const snackbar = ref(false)
const snackbarText = ref('')

function showSnackbar(text: string) {
  snackbarText.value = text
  snackbar.value = true
}

onMounted(() => {
  propertyStore.loadAll()
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
