<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">员工管理</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openEditor(null)">
        添加员工
      </v-btn>
    </div>

    <!-- 员工列表 -->
    <v-card rounded="lg">
      <v-data-table
        :headers="headers"
        :items="employees"
        :items-per-page="10"
        class="elevation-0"
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center">
            <v-avatar color="primary" size="36" class="mr-2">
              <span class="text-body-2">{{ item.name.charAt(0) }}</span>
            </v-avatar>
            <span class="font-weight-medium">{{ item.name }}</span>
          </div>
        </template>

        <template #item.role="{ item }">
          <v-chip
            size="small"
            :color="getRoleColor(item.role)"
            variant="tonal"
          >
            {{ getRoleText(item.role) }}
          </v-chip>
        </template>

        <template #item.status="{ item }">
          <v-chip
            size="small"
            :color="item.status === 'active' ? 'success' : 'grey'"
            variant="flat"
          >
            {{ item.status === 'active' ? '在职' : '离职' }}
          </v-chip>
        </template>

        <template #item.createdAt="{ item }">
          {{ formatTime(item.createdAt) }}
        </template>

        <template #item.actions="{ item }">
          <v-btn icon size="small" variant="text" @click="openEditor(item)">
            <v-icon icon="mdi-pencil" />
          </v-btn>
          <v-btn
            icon
            size="small"
            variant="text"
            :color="item.status === 'active' ? 'warning' : 'success'"
            @click="toggleStatus(item)"
          >
            <v-icon :icon="item.status === 'active' ? 'mdi-account-off' : 'mdi-account-check'" />
            <v-tooltip activator="parent" location="top">
              {{ item.status === 'active' ? '禁用' : '启用' }}
            </v-tooltip>
          </v-btn>
          <v-btn icon size="small" variant="text" color="error" @click="confirmDelete(item)">
            <v-icon icon="mdi-delete" />
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- 编辑弹窗 -->
    <v-dialog v-model="editorDialog" max-width="500">
      <v-card>
        <v-card-title>{{ editingEmployee ? '编辑员工' : '添加员工' }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="form.name"
            label="姓名"
            variant="outlined"
            class="mb-4"
          />
          <v-text-field
            v-model="form.phone"
            label="手机号"
            variant="outlined"
            class="mb-4"
          />
          <v-select
            v-model="form.role"
            :items="roleOptions"
            label="角色"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editorDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="saveEmployee">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-error">
          <v-icon icon="mdi-alert" class="mr-2" />
          确认删除
        </v-card-title>
        <v-card-text>
          确定要删除员工 <strong>{{ deletingEmployee?.name }}</strong> 吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" @click="executeDelete">删除</v-btn>
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
import { usePropertyStore, type Employee } from '@/stores/property'
import dayjs from 'dayjs'

const propertyStore = usePropertyStore()

const employees = computed(() => propertyStore.employees)

// 表格
const headers = [
  { title: '姓名', key: 'name' },
  { title: '手机号', key: 'phone' },
  { title: '角色', key: 'role' },
  { title: '状态', key: 'status' },
  { title: '入职时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false, align: 'center' },
]

const roleOptions = [
  { title: '管理员', value: 'admin' },
  { title: '客服', value: 'service' },
  { title: '维修工', value: 'repair' },
  { title: '保安', value: 'security' },
]

function getRoleColor(role: string) {
  const colors: Record<string, string> = {
    admin: 'error',
    service: 'primary',
    repair: 'warning',
    security: 'info',
  }
  return colors[role] || 'grey'
}

function getRoleText(role: string) {
  const texts: Record<string, string> = {
    admin: '管理员',
    service: '客服',
    repair: '维修工',
    security: '保安',
  }
  return texts[role] || role
}

function formatTime(time: string) {
  return dayjs(time).format('YYYY-MM-DD')
}

// 编辑器
const editorDialog = ref(false)
const editingEmployee = ref<Employee | null>(null)
const form = reactive({
  name: '',
  phone: '',
  role: 'service' as Employee['role'],
})

function openEditor(employee: Employee | null) {
  editingEmployee.value = employee
  if (employee) {
    form.name = employee.name
    form.phone = employee.phone
    form.role = employee.role
  } else {
    form.name = ''
    form.phone = ''
    form.role = 'service'
  }
  editorDialog.value = true
}

async function saveEmployee() {
  try {
    if (editingEmployee.value) {
      propertyStore.updateEmployee(editingEmployee.value.id, {
        name: form.name,
        phone: form.phone,
        role: form.role,
      })
      showSnackbar('success', '员工信息已更新')
    } else {
      await propertyStore.addEmployee({
        name: form.name,
        phone: form.phone,
        role: form.role,
      })
      showSnackbar('success', '员工已添加')
    }
    editorDialog.value = false
  } catch (error) {
    console.error('保存员工失败:', error)
    showSnackbar('error', '操作失败，请重试')
  }
}

function toggleStatus(employee: Employee) {
  propertyStore.updateEmployee(employee.id, {
    status: employee.status === 'active' ? 'inactive' : 'active',
  })
  showSnackbar('success', '状态已更新')
}

// 删除
const deleteDialog = ref(false)
const deletingEmployee = ref<Employee | null>(null)

function confirmDelete(employee: Employee) {
  deletingEmployee.value = employee
  deleteDialog.value = true
}

function executeDelete() {
  if (deletingEmployee.value) {
    propertyStore.deleteEmployee(deletingEmployee.value.id)
    showSnackbar('success', '员工已删除')
  }
  deleteDialog.value = false
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
  propertyStore.loadAll()
})

defineOptions({
  layout: 'admin',
})
</script>
