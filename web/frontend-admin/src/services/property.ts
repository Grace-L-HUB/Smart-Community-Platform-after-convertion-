// 物业管理相关 API 服务
import { apiClient, type ApiResponse } from './api'

// ===== 数据类型定义 =====

// 房屋绑定申请
export interface HouseBindingApplication {
  id: number
  applicant_name: string
  applicant_phone: string
  id_card_number: string
  community_name: string
  building_name: string
  unit_name: string
  room_number: string
  identity: number
  status: number
  created_at: string
  audit_remark?: string
  reject_reason?: string
  user_info?: {
    id: number
    nickname: string
    avatar_url?: string
  }
}

// 车位绑定申请
export interface ParkingBindingApplication {
  id: number
  owner_name: string
  owner_phone: string
  id_card: string
  community_name: string
  parking_type: 'owned' | 'rented'
  parking_area: string
  parking_no: string
  car_no: string
  car_brand: string
  car_color: string
  identity: number  // 申请身份：1-业主, 3-租客
  status: number
  created_at: string
  audit_remark?: string
  reject_reason?: string
  user_info?: {
    id: number
    nickname: string
    avatar_url?: string
  }
}

// 住户绑定关系
export interface HouseUserBinding {
  id: number
  identity: number
  identity_display: string
  status: number
  status_display: string
  created_at: string
  house_info: {
    community_name: string
    building_name: string
    unit_name: string
    room_number: string
    full_address: string
  }
  applicant_info: {
    name: string
    phone: string
    id_card: string
  }
}

// 车位绑定关系
export interface ParkingUserBinding {
  id: number
  identity: number  // 绑定身份：1-业主, 3-租客
  identity_display: string
  status: number
  status_display: string
  created_at: string
  parking_info: {
    community_name: string
    parking_type: string
    parking_type_display: string
    parking_area: string
    parking_no: string
    car_no: string
    car_brand: string
    car_color: string
    owner_name: string
    full_address: string
  }
}

// 公告数据类型
export interface AnnouncementAPI {
  id: number
  title: string
  content: string
  status: 'draft' | 'published' | 'withdrawn'
  status_text: string
  scope: 'all' | 'building'
  scope_text: string
  target_buildings?: string[]
  author: string
  author_info?: {
    id: number
    name: string
    nickname: string
    avatar?: string
  }
  created_at: string
  updated_at?: string
  published_at?: string
  withdrawn_at?: string
  read_count: number
}

// 公告创建/更新数据
export interface AnnouncementCreateData {
  title: string
  content: string
  category: string
  scope: 'all' | 'building'
  target_buildings?: string[]
  action?: 'draft' | 'publish' // draft=保存草稿, publish=直接发布
  author?: string
  user_id?: number
}

// 报修工单数据类型
export interface RepairOrderAPI {
  id: number
  order_no: string
  category: string
  category_display: string
  repair_type: string
  type_display: string
  priority: string
  priority_display: string
  summary: string
  description: string
  location: string
  reporter_name: string
  reporter_phone: string
  status: string
  status_display: string
  assignee?: string
  assigned_at?: string
  assigned_by?: number
  result?: string
  cost?: string
  completed_at?: string
  created_at: string
  updated_at: string
  is_rated: boolean
  rating?: number
  rating_comment?: string
  rated_at?: string
  images?: RepairOrderImageAPI[]
}

export interface RepairOrderImageAPI {
  id: number
  image: string
  image_type: 'image' | 'video'
  uploaded_at: string
}

export interface RepairEmployeeAPI {
  id: number
  name: string
  phone: string
  speciality: string
  is_active: boolean
  total_orders: number
  completed_orders: number
  average_rating: string
}

export interface RepairOrderCreateData {
  category: string
  repair_type: string
  priority: string
  location: string
  summary: string
  description: string
  reporter_name: string
  reporter_phone: string
  user_id: number
  images?: Array<{
    image: string
    image_type: 'image' | 'video'
  }>
}

// ===== API 服务类 =====

class PropertyAPI {
  
  // === 房屋绑定审核 ===
  
  /**
   * 获取待审核的房屋绑定申请列表
   */
  async getHouseBindingAuditList(): Promise<ApiResponse<HouseBindingApplication[]>> {
    return apiClient.get('/property/house/binding/audit')
  }

  /**
   * 审核房屋绑定申请
   */
  async auditHouseBinding(
    applicationId: number, 
    action: 'approve' | 'reject',
    rejectReason?: string,
    remark?: string
  ): Promise<ApiResponse> {
    return apiClient.patch(`/property/house/binding/audit/${applicationId}`, {
      action,
      reject_reason: rejectReason,
      remark
    })
  }

  /**
   * 获取已绑定的住户列表
   */
  async getApprovedResidents(): Promise<ApiResponse<HouseUserBinding[]>> {
    // 这个接口需要根据实际情况调整，可能需要分页等参数
    return apiClient.get('/property/house/my-houses', { user_id: 'all' })
  }

  // === 车位绑定审核 ===

  /**
   * 获取待审核的车位绑定申请列表  
   */
  async getParkingBindingAuditList(): Promise<ApiResponse<ParkingBindingApplication[]>> {
    return apiClient.get('/parking/binding/audit')
  }

  /**
   * 审核车位绑定申请
   */
  async auditParkingBinding(
    applicationId: number,
    action: 'approve' | 'reject', 
    rejectReason?: string,
    remark?: string
  ): Promise<ApiResponse> {
    return apiClient.patch(`/parking/binding/audit/${applicationId}`, {
      action,
      reject_reason: rejectReason,
      remark
    })
  }

  /**
   * 获取已绑定的车位列表
   */
  async getApprovedParkings(): Promise<ApiResponse<ParkingUserBinding[]>> {
    return apiClient.get('/parking/my-parkings', { user_id: 'all' })
  }

  // === 统计信息 ===

  /**
   * 获取房屋绑定统计信息
   */
  async getHouseBindingStats(): Promise<ApiResponse<any>> {
    return apiClient.get('/property/house/stats')
  }

  /**
   * 获取车位绑定统计信息
   */
  async getParkingBindingStats(): Promise<ApiResponse<any>> {
    return apiClient.get('/parking/stats')
  }

  // === 解绑功能 ===

  /**
   * 解绑房屋绑定关系
   */
  async unbindHouse(bindingId: number): Promise<ApiResponse> {
    return apiClient.patch(`/property/house/binding/unbind/${bindingId}`)
  }

  /**
   * 解绑车位绑定关系
   */
  async unbindParkingSpace(bindingId: number): Promise<ApiResponse> {
    return apiClient.patch(`/parking/binding/unbind/${bindingId}`)
  }

  // === 基础数据列表 ===

  /**
   * 获取房屋基础数据列表
   */
  async getHouseList(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/property/house/list')
  }

  /**
   * 获取车位基础数据列表  
   */
  async getParkingSpaceList(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/parking/space/list')
  }

  // === 工作台统计 ===

  /**
   * 获取工作台统计数据
   */
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return apiClient.get('/property/dashboard/stats')
  }

  // === 员工管理 ===

  /**
   * 获取员工列表
   */
  async getEmployeeList(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/property/employees')
  }

  /**
   * 添加员工
   */
  async addEmployee(data: { name: string; phone: string; role: string }): Promise<ApiResponse<any>> {
    return apiClient.post('/property/employees', data)
  }

  // === 公告管理 ===

  /**
   * 获取公告列表
   */
  async getAnnouncementList(): Promise<ApiResponse<AnnouncementAPI[]>> {
    return apiClient.get('/property/announcements')
  }

  /**
   * 获取公告详情
   */
  async getAnnouncementDetail(id: number): Promise<ApiResponse<AnnouncementAPI>> {
    return apiClient.get(`/property/announcements/${id}`)
  }

  /**
   * 创建公告
   */
  async createAnnouncement(data: AnnouncementCreateData): Promise<ApiResponse<any>> {
    return apiClient.post('/property/announcements/create', data)
  }

  /**
   * 更新公告（仅限草稿状态）
   */
  async updateAnnouncement(id: number, data: AnnouncementCreateData): Promise<ApiResponse<any>> {
    return apiClient.put(`/property/announcements/${id}/update`, data)
  }

  /**
   * 发布公告（草稿 -> 已发布）
   */
  async publishAnnouncement(id: number): Promise<ApiResponse<any>> {
    return apiClient.patch(`/property/announcements/${id}/status`, { action: 'publish' })
  }

  /**
   * 撤回公告（已发布 -> 已撤回）
   */
  async withdrawAnnouncement(id: number): Promise<ApiResponse<any>> {
    return apiClient.patch(`/property/announcements/${id}/status`, { action: 'withdraw' })
  }

  /**
   * 删除公告
   */
  async deleteAnnouncement(id: number): Promise<ApiResponse<any>> {
    return apiClient.delete(`/property/announcements/${id}/delete`)
  }

  /**
   * 获取公告分类选项
   */
  async getAnnouncementCategories(): Promise<ApiResponse<any>> {
    return apiClient.get('/property/announcements/options/categories')
  }

  /**
   * 获取楼栋列表选项
   */
  async getBuildingOptions(): Promise<ApiResponse<string[]>> {
    return apiClient.get('/property/house/options/buildings')
  }

  // ===== 报修工单相关 API =====

  /**
   * 获取报修工单列表
   */
  async getRepairOrderList(params?: {
    page?: number
    page_size?: number
    status?: string
    type?: string
    keyword?: string
  }): Promise<ApiResponse<{
    list: RepairOrderAPI[]
    total: number
    page: number
    page_size: number
    total_pages: number
  }>> {
    return apiClient.get('/property/repair-orders', { params })
  }

  /**
   * 获取工单详情
   */
  async getRepairOrderDetail(id: number): Promise<ApiResponse<RepairOrderAPI>> {
    return apiClient.get(`/property/repair-orders/${id}`)
  }

  /**
   * 派单
   */
  async assignRepairOrder(id: number, assignee: string, assignedByUserId?: number): Promise<ApiResponse<RepairOrderAPI>> {
    return apiClient.post(`/property/repair-orders/${id}/assign`, {
      assignee,
      assigned_by_user_id: assignedByUserId
    })
  }

  /**
   * 完成工单
   */
  async completeRepairOrder(id: number, result: string, cost?: number): Promise<ApiResponse<RepairOrderAPI>> {
    return apiClient.post(`/property/repair-orders/${id}/complete`, {
      result,
      cost
    })
  }

  /**
   * 驳回工单
   */
  async rejectRepairOrder(id: number): Promise<ApiResponse<RepairOrderAPI>> {
    return apiClient.post(`/property/repair-orders/${id}/reject`)
  }

  /**
   * 获取维修人员列表
   */
  async getRepairEmployees(): Promise<ApiResponse<RepairEmployeeAPI[]>> {
    return apiClient.get('/property/repair-employees')
  }

  /**
   * 获取报修选项数据
   */
  async getRepairOptions(): Promise<ApiResponse<{
    types: Array<{ label: string; value: string }>
    priorities: Array<{ label: string; value: string }>
    categories: Array<{ label: string; value: string }>
    statuses: Array<{ label: string; value: string }>
  }>> {
    return apiClient.get('/property/repair-orders/options')
  }
}

// 创建并导出 API 实例
export const propertyAPI = new PropertyAPI()

// 导出类型
export type {
  HouseBindingApplication,
  ParkingBindingApplication, 
  HouseUserBinding,
  ParkingUserBinding,
  AnnouncementAPI,
  AnnouncementCreateData,
  RepairOrderAPI,
  RepairOrderImageAPI,
  RepairEmployeeAPI,
  RepairOrderCreateData
}