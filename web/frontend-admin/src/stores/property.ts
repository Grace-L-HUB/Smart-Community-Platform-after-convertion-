// 物业管理 Store
import { defineStore } from 'pinia'
import {
    type House,
    type WorkOrder,
    type Bill,
    type Announcement,
    type Activity,
    type AccessLog,
    type Employee,
} from '@/types/property'
import {
    propertyAPI,
    type HouseBindingApplication,
    type ParkingBindingApplication,
    type HouseUserBinding,
    type ParkingUserBinding,
    type AnnouncementAPI,
    type AnnouncementCreateData,
    type RepairOrderAPI,
    type RepairEmployeeAPI
} from '@/services/property'

// 更新数据类型以匹配后端API
export interface Resident {
    id: number
    name: string
    phone: string
    idCard: string
    houseAddress: string
    identity: 'owner' | 'tenant' | 'family'
    status: 0 | 1 | 2 // 0-待审核, 1-已通过, 2-已拒绝
    applyTime: string
    rejectReason?: string
}

export interface ParkingApply {
    id: number
    communityName: string
    parkingType: 'owned' | 'rented'
    parkingArea: string
    parkingNo: string
    carNo: string
    carBrand: string
    carColor: string
    ownerName: string
    ownerPhone: string
    idCard: string
    identity: 'owner' | 'tenant' // 车位只支持业主或租客身份
    status: 0 | 1 | 2 // 0-待审核, 1-已通过, 2-已拒绝
    applyTime: string
    rejectReason?: string
}

export interface Parking {
    id: number
    area: string
    parkingNo: string
    carNo: string
    carBrand: string
    carColor: string
    ownerName: string
    ownerPhone: string
    identity: 'owner' | 'tenant'
    type: 'owned' | 'rented'
    status: 'active' | 'expired' | 'empty'
}

export type { House, WorkOrder, Bill, Announcement, Activity, AccessLog, Employee }

// ===== 数据转换函数 =====

/**
 * 将房屋绑定申请转换为住户格式
 */
function convertHouseApplicationToResident(app: HouseBindingApplication): Resident {
    // 身份映射: 1-业主, 2-家庭成员, 3-租客
    const identityMap: Record<number, 'owner' | 'tenant' | 'family'> = {
        1: 'owner',
        2: 'family',
        3: 'tenant'
    }

    return {
        id: app.id,
        name: app.applicant_name,
        phone: app.applicant_phone,
        idCard: app.id_card_number,
        houseAddress: `${app.building_name}${app.unit_name}${app.room_number}`,
        identity: identityMap[app.identity] || 'owner',
        status: app.status as 0 | 1 | 2,
        applyTime: app.created_at,
        rejectReason: app.reject_reason
    }
}

/**
 * 将房屋绑定关系转换为住户格式
 */
function convertHouseBindingToResident(binding: HouseUserBinding): Resident {
    // 从identity_display解析身份
    const identityMap: Record<string, 'owner' | 'tenant' | 'family'> = {
        '业主': 'owner',
        '家庭成员': 'family',
        '租客': 'tenant'
    }

    return {
        id: binding.id,
        name: binding.applicant_info?.name || 'N/A',
        phone: binding.applicant_info?.phone || 'N/A',
        idCard: binding.applicant_info?.id_card || 'N/A',
        houseAddress: binding.house_info.full_address,
        identity: identityMap[binding.identity_display] || 'owner',
        status: binding.status as 1, // 绑定关系都是已通过状态
        applyTime: binding.created_at
    }
}

/**
 * 将车位绑定申请转换为车位申请格式
 */
function convertParkingApplicationToParkingApply(app: ParkingBindingApplication): ParkingApply {
    // 身份映射: 1-业主, 3-租客
    const identityMap: Record<number, 'owner' | 'tenant'> = {
        1: 'owner',
        3: 'tenant'
    }

    return {
        id: app.id,
        communityName: app.community_name,
        parkingType: app.parking_type,
        parkingArea: app.parking_area,
        parkingNo: app.parking_no,
        carNo: app.car_no,
        carBrand: app.car_brand,
        carColor: app.car_color,
        ownerName: app.owner_name,
        ownerPhone: app.owner_phone,
        idCard: app.id_card,
        identity: identityMap[app.identity] || 'owner',
        status: app.status as 0 | 1 | 2,
        applyTime: app.created_at,
        rejectReason: app.reject_reason
    }
}

/**
 * 将车位绑定关系转换为车位格式
 */
function convertParkingBindingToParking(binding: ParkingUserBinding): Parking {
    // 身份映射
    const identityMap: Record<string, 'owner' | 'tenant'> = {
        '业主': 'owner',
        '租客': 'tenant'
    }

    return {
        id: binding.id,
        area: binding.parking_info.parking_area,
        parkingNo: binding.parking_info.parking_no,
        carNo: binding.parking_info.car_no,
        carBrand: binding.parking_info.car_brand,
        carColor: binding.parking_info.car_color,
        ownerName: binding.parking_info.owner_name,
        ownerPhone: '', // 假设后端会提供这个信息
        identity: identityMap[binding.identity_display] || 'owner',
        type: binding.parking_info.parking_type as 'owned' | 'rented',
        status: binding.status === 1 ? 'active' : 'expired' // 根据绑定状态判断
    }
}

// 默认统计数据
const mockPropertyStats = {
    pendingWorkOrders: 0,
    todayRepairs: 0,
    totalResidents: 0,
    feeCollectionRate: 0,
    workOrderTrend: [] as Array<{ date: string; count: number }>,
    repairTypeDistribution: [] as Array<{ type: string; value: number }>,
}

// 默认门禁日志数据
const mockAccessLogs: AccessLog[] = []

interface PropertyState {
    houses: House[]
    residents: Resident[]
    workOrders: WorkOrder[]
    bills: Bill[]
    announcements: Announcement[]
    activities: Activity[]
    accessLogs: AccessLog[]
    employees: Employee[]
    parkings: Parking[]
    parkingApplies: ParkingApply[]
    stats: typeof mockPropertyStats
    loading: boolean
    accessLogsPagination?: {
        currentPage: number
        pageSize: number
        total: number
        totalPages: number
    }
    // 新增：原始API数据存储
    houseBindingApplications: HouseBindingApplication[]
    parkingBindingApplications: ParkingBindingApplication[]
    approvedHouseBindings: HouseUserBinding[]
    approvedParkingBindings: ParkingUserBinding[]
    // 公告API数据
    announcementsAPI: AnnouncementAPI[]
    // 报修工单API数据
    repairOrdersAPI: RepairOrderAPI[]
    repairEmployeesAPI: RepairEmployeeAPI[]
}

export const usePropertyStore = defineStore('property', {
    state: (): PropertyState => ({
        houses: [],
        residents: [],
        workOrders: [],
        bills: [],
        announcements: [],
        activities: [],
        accessLogs: [],
        employees: [],
        parkings: [],
        parkingApplies: [],
        stats: mockPropertyStats,
        loading: false,
        // 新增状态
        houseBindingApplications: [],
        parkingBindingApplications: [],
        approvedHouseBindings: [],
        approvedParkingBindings: [],
        announcementsAPI: [],
        // 报修工单状态
        repairOrdersAPI: [],
        repairEmployeesAPI: [],
    }),

    getters: {
        // 房产与住户 - 使用转换后的数据
        pendingResidents: (state) => {
            // 将后端数据转换为前端期望的格式
            return state.houseBindingApplications
                .filter(app => app.status === 0)
                .map(app => convertHouseApplicationToResident(app))
        },
        approvedResidents: (state) => {
            return state.approvedHouseBindings.map(binding => convertHouseBindingToResident(binding))
        },

        // 车位申请 - 使用转换后的数据
        pendingParkingApplies: (state) => {
            return state.parkingBindingApplications
                .filter(app => app.status === 0)
                .map(app => convertParkingApplicationToParkingApply(app))
        },

        // 已绑定车位 - 使用转换后的数据
        approvedParkings: (state) => {
            return state.approvedParkingBindings.map(binding => convertParkingBindingToParking(binding))
        },

        // 工单管理 - 使用API数据
        pendingWorkOrders: (state) => state.repairOrdersAPI.filter(o => o.status === 'pending'),
        processingWorkOrders: (state) => state.repairOrdersAPI.filter(o => o.status === 'processing'),
        completedWorkOrders: (state) => state.repairOrdersAPI.filter(o => o.status === 'completed'),

        // 财务与员工
        unpaidBills: (state) => state.bills.filter(b => b.status === 'unpaid'),
        activeEmployees: (state) => state.employees.filter(e => e.status === 'active'),
        repairEmployees: (state) => state.repairEmployeesAPI.filter(e => e.is_active),

        // 公告
        publishedAnnouncements: (state) => state.announcements.filter(a => a.status === 'published'),
    },

    actions: {
        // 加载所有数据
        async loadAll() {
            this.loading = true

            try {
                // 并行加载数据
                const [
                    houseAuditResponse,
                    parkingAuditResponse,
                    approvedHousesResponse,
                    approvedParkingsResponse,
                    houseListResponse,
                    parkingSpaceListResponse,
                    dashboardStatsResponse,
                    employeesResponse,
                    announcementsResponse,
                    repairOrdersResponse,
                    repairEmployeesResponse
                ] = await Promise.all([
                    propertyAPI.getHouseBindingAuditList(),
                    propertyAPI.getParkingBindingAuditList(),
                    propertyAPI.getApprovedResidents(),
                    propertyAPI.getApprovedParkings(),
                    propertyAPI.getHouseList(),
                    propertyAPI.getParkingSpaceList(),
                    propertyAPI.getDashboardStats(),
                    propertyAPI.getEmployeeList(),
                    propertyAPI.getAnnouncementList(),
                    propertyAPI.getRepairOrderList(),
                    propertyAPI.getRepairEmployees()
                ])

                // 存储原始API数据
                this.houseBindingApplications = houseAuditResponse.data || []
                this.parkingBindingApplications = parkingAuditResponse.data || []
                this.approvedHouseBindings = approvedHousesResponse.data || []
                this.approvedParkingBindings = approvedParkingsResponse.data || []

                // 存储基础数据列表
                this.houses = houseListResponse.data || []
                this.parkings = parkingSpaceListResponse.data || []

                // 存储统计数据和员工数据
                this.stats = dashboardStatsResponse.data || mockPropertyStats
                this.employees = employeesResponse.data || []

                // 存储公告API数据，并转换格式给前端使用
                this.announcementsAPI = announcementsResponse.data || []
                this.announcements = this.convertAnnouncementsToFrontend(this.announcementsAPI)

                // 存储报修工单API数据
                console.log('报修工单API响应:', repairOrdersResponse)
                this.repairOrdersAPI = repairOrdersResponse.data || []
                this.repairEmployeesAPI = repairEmployeesResponse.data || []
                
                // 转换报修工单数据为前端格式
                this.workOrders = this.convertRepairOrdersToFrontend(this.repairOrdersAPI)
                console.log('转换后的工单数据:', this.workOrders)

                // 加载门禁日志数据
                await this.loadAccessLogs()
                
                // 初始化空数据
                this.bills = []
                this.activities = []

            } catch (error) {
                console.error('加载数据失败:', error)
                // 失败时初始化空数据
                this.houseBindingApplications = []
                this.parkingBindingApplications = []
                this.approvedHouseBindings = []
                this.approvedParkingBindings = []
                this.announcementsAPI = []
                this.repairOrdersAPI = []
                this.repairEmployeesAPI = []
                this.houses = []
                this.parkings = []
                this.stats = {}
                this.employees = []
                this.announcements = []
                this.workOrders = []
                this.bills = []
                this.activities = []
            }

            this.loading = false
        },

        // 住户审核
        async approveResident(id: number) {
            try {
                const response = await propertyAPI.auditHouseBinding(id, 'approve')
                if (response.code === 200) {
                    // 更新本地状态
                    const application = this.houseBindingApplications.find(app => app.id === id)
                    if (application) {
                        application.status = 1
                    }
                    // 重新加载数据以获取最新状态
                    await this.loadAll()
                }
                return response
            } catch (error) {
                console.error('审核住户失败:', error)
                throw error
            }
        },

        async rejectResident(id: number, reason: string) {
            try {
                const response = await propertyAPI.auditHouseBinding(id, 'reject', reason)
                if (response.code === 200) {
                    // 更新本地状态
                    const application = this.houseBindingApplications.find(app => app.id === id)
                    if (application) {
                        application.status = 2
                        application.reject_reason = reason
                    }
                    await this.loadAll()
                }
                return response
            } catch (error) {
                console.error('拒绝住户申请失败:', error)
                throw error
            }
        },

        // 车位审核
        async approveParking(id: number) {
            try {
                const response = await propertyAPI.auditParkingBinding(id, 'approve')
                if (response.code === 200) {
                    // 更新本地状态
                    const application = this.parkingBindingApplications.find(app => app.id === id)
                    if (application) {
                        application.status = 1
                    }
                    await this.loadAll()
                }
                return response
            } catch (error) {
                console.error('审核车位失败:', error)
                throw error
            }
        },

        async rejectParking(id: number, reason: string) {
            try {
                const response = await propertyAPI.auditParkingBinding(id, 'reject', reason)
                if (response.code === 200) {
                    // 更新本地状态
                    const application = this.parkingBindingApplications.find(app => app.id === id)
                    if (application) {
                        application.status = 2
                        application.reject_reason = reason
                    }
                    await this.loadAll()
                }
                return response
            } catch (error) {
                console.error('拒绝车位申请失败:', error)
                throw error
            }
        },

        // === 解绑功能 ===

        /**
         * 解绑房屋绑定关系
         */
        async unbindHouse(bindingId: number) {
            try {
                const response = await propertyAPI.unbindHouse(bindingId)
                if (response.code === 200) {
                    // 重新加载数据以获取最新状态
                    await this.loadAll()
                }
                return response
            } catch (error) {
                console.error('解绑房屋失败:', error)
                throw error
            }
        },

        /**
         * 解绑车位绑定关系
         */
        async unbindParkingSpace(bindingId: number) {
            try {
                const response = await propertyAPI.unbindParkingSpace(bindingId)
                if (response.code === 200) {
                    await this.loadAll()
                }
                return response
            } catch (error) {
                console.error('解绑车位失败:', error)
                throw error
            }
        },

        // ===== 报修工单操作（使用API） =====

        /**
         * 派单
         */
        async assignWorkOrder(id: number, assignee: string) {
            try {
                const response = await propertyAPI.assignRepairOrder(id, assignee, 1) // TODO: 从auth store获取真实用户ID
                
                if (response.code === 200) {
                    // 重新加载工单列表
                    await this.reloadRepairOrders()
                    return response.data
                } else {
                    throw new Error(response.message || '派单失败')
                }
            } catch (error) {
                console.error('派单失败:', error)
                throw error
            }
        },

        /**
         * 完成工单
         */
        async completeWorkOrder(id: number, result: string, cost?: number) {
            try {
                const response = await propertyAPI.completeRepairOrder(id, result, cost)
                
                if (response.code === 200) {
                    // 重新加载工单列表
                    await this.reloadRepairOrders()
                    return response.data
                } else {
                    throw new Error(response.message || '完成工单失败')
                }
            } catch (error) {
                console.error('完成工单失败:', error)
                throw error
            }
        },

        /**
         * 驳回工单
         */
        async rejectWorkOrder(id: number) {
            try {
                const response = await propertyAPI.rejectRepairOrder(id)
                
                if (response.code === 200) {
                    // 重新加载工单列表
                    await this.reloadRepairOrders()
                    return response.data
                } else {
                    throw new Error(response.message || '驳回工单失败')
                }
            } catch (error) {
                console.error('驳回工单失败:', error)
                throw error
            }
        },

        /**
         * 重新加载报修工单列表
         */
        async reloadRepairOrders() {
            try {
                const response = await propertyAPI.getRepairOrderList()
                if (response.code === 200) {
                    this.repairOrdersAPI = response.data?.list || []
                    this.workOrders = this.convertRepairOrdersToFrontend(this.repairOrdersAPI)
                }
            } catch (error) {
                console.error('重新加载工单列表失败:', error)
            }
        },

        /**
         * 重新加载Dashboard统计数据
         */
        async reloadDashboardStats() {
            try {
                const response = await propertyAPI.getDashboardStats()
                if (response.code === 200) {
                    this.stats = response.data || this.stats
                    return response.data
                } else {
                    throw new Error(response.message || '获取统计数据失败')
                }
            } catch (error) {
                console.error('重新加载Dashboard统计数据失败:', error)
                throw error
            }
        },

        // 账单操作
        sendReminder(id: number) {
            console.log(`发送催缴提醒：账单 ${id}`)
            return { success: true, message: '催缴提醒已发送' }
        },

        generateBills(type: string, period: string, buildings: string[]) {
            console.log('生成账单：', { type, period, buildings })
            return { success: true, message: `已为 ${buildings.length} 栋楼生成账单` }
        },

        // ===== 数据转换方法 =====

        /**
         * 将后端公告数据转换为前端格式
         */
        convertAnnouncementsToFrontend(apiAnnouncements: AnnouncementAPI[]): Announcement[] {
            return apiAnnouncements.map(apiAnn => ({
                id: apiAnn.id,
                title: apiAnn.title,
                content: apiAnn.content,
                status: apiAnn.status,
                scope: apiAnn.scope,
                targetBuildings: apiAnn.target_buildings || [],
                author: apiAnn.author,
                createdAt: apiAnn.created_at,
                publishedAt: apiAnn.published_at
            }))
        },

        /**
         * 将后端报修工单数据转换为前端格式
         */
        convertRepairOrdersToFrontend(apiOrders: RepairOrderAPI[]): WorkOrder[] {
            return apiOrders.map(apiOrder => ({
                id: apiOrder.id,
                orderNo: apiOrder.order_no,
                type: apiOrder.repair_type as 'water' | 'electric' | 'door' | 'public' | 'other',
                summary: apiOrder.summary,
                description: apiOrder.description,
                location: apiOrder.location,
                reporterName: apiOrder.reporter_name,
                reporterPhone: apiOrder.reporter_phone,
                status: apiOrder.status as 'pending' | 'processing' | 'completed' | 'rejected',
                assignee: apiOrder.assignee,
                result: apiOrder.result,
                cost: apiOrder.cost ? parseFloat(apiOrder.cost) : undefined,
                createdAt: apiOrder.created_at,
                updatedAt: apiOrder.updated_at,
                images: apiOrder.images?.map(img => img.image) || []
            }))
        },

        // ===== 公告操作（使用API） =====

        /**
         * 创建公告（支持草稿和直接发布）
         */
        async addAnnouncement(announcementData: Omit<Announcement, 'id' | 'createdAt'> & { action?: 'draft' | 'publish' }) {
            try {
                const createData: AnnouncementCreateData = {
                    title: announcementData.title,
                    content: announcementData.content,
                    category: (announcementData as any).category || 'property_notice',
                    scope: announcementData.scope,
                    target_buildings: announcementData.targetBuildings,
                    action: announcementData.action || (announcementData.status === 'published' ? 'publish' : 'draft'),
                    author: announcementData.author,
                    user_id: 1 // TODO: 从auth store获取真实用户ID
                }

                const response = await propertyAPI.createAnnouncement(createData)
                
                if (response.code === 200) {
                    // 重新加载公告列表
                    await this.reloadAnnouncements()
                    return response.data
                } else {
                    throw new Error(response.message || '创建公告失败')
                }
            } catch (error) {
                console.error('创建公告失败:', error)
                throw error
            }
        },

        /**
         * 更新公告（仅限草稿）
         */
        async updateAnnouncement(id: number, announcementData: Partial<Announcement> & { action?: 'save' | 'publish' }) {
            try {
                const updateData: AnnouncementCreateData = {
                    title: announcementData.title!,
                    content: announcementData.content!,
                    category: (announcementData as any).category || 'property_notice',
                    scope: announcementData.scope!,
                    target_buildings: announcementData.targetBuildings,
                    action: announcementData.action === 'save' ? 'draft' : (announcementData.action || 'draft'),
                    user_id: 1 // TODO: 从auth store获取真实用户ID
                }

                const response = await propertyAPI.updateAnnouncement(id, updateData)
                
                if (response.code === 200) {
                    // 重新加载公告列表
                    await this.reloadAnnouncements()
                    return response.data
                } else {
                    throw new Error(response.message || '更新公告失败')
                }
            } catch (error) {
                console.error('更新公告失败:', error)
                throw error
            }
        },

        /**
         * 撤回公告
         */
        async withdrawAnnouncement(id: number) {
            try {
                const response = await propertyAPI.withdrawAnnouncement(id)
                
                if (response.code === 200) {
                    // 重新加载公告列表
                    await this.reloadAnnouncements()
                    return response.data
                } else {
                    throw new Error(response.message || '撤回公告失败')
                }
            } catch (error) {
                console.error('撤回公告失败:', error)
                throw error
            }
        },

        /**
         * 发布公告（草稿->已发布）
         */
        async publishAnnouncement(id: number) {
            try {
                const response = await propertyAPI.publishAnnouncement(id)
                
                if (response.code === 200) {
                    // 重新加载公告列表
                    await this.reloadAnnouncements()
                    return response.data
                } else {
                    throw new Error(response.message || '发布公告失败')
                }
            } catch (error) {
                console.error('发布公告失败:', error)
                throw error
            }
        },

        /**
         * 删除公告
         */
        async deleteAnnouncement(id: number) {
            try {
                const response = await propertyAPI.deleteAnnouncement(id)
                
                if (response.code === 200) {
                    // 重新加载公告列表
                    await this.reloadAnnouncements()
                    return response.data
                } else {
                    throw new Error(response.message || '删除公告失败')
                }
            } catch (error) {
                console.error('删除公告失败:', error)
                throw error
            }
        },

        /**
         * 重新加载公告列表
         */
        async reloadAnnouncements() {
            try {
                const response = await propertyAPI.getAnnouncementList()
                if (response.code === 200) {
                    this.announcementsAPI = response.data || []
                    this.announcements = this.convertAnnouncementsToFrontend(this.announcementsAPI)
                }
            } catch (error) {
                console.error('重新加载公告列表失败:', error)
            }
        },

        // 活动操作
        addActivity(activity: Omit<Activity, 'id' | 'createdAt' | 'currentParticipants'>) {
            const newActivity: Activity = {
                ...activity,
                id: this.activities.length + 1,
                currentParticipants: 0,
                createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
            }
            this.activities.unshift(newActivity)
            return newActivity
        },

        updateActivity(id: number, data: Partial<Omit<Activity, 'id' | 'createdAt' | 'currentParticipants'>>) {
            const activity = this.activities.find(a => a.id === id)
            if (activity) {
                Object.assign(activity, data)
            }
        },

        deleteActivity(id: number) {
            const index = this.activities.findIndex(a => a.id === id)
            if (index > -1) {
                this.activities.splice(index, 1)
            }
        },

        // 员工操作
        async addEmployee(employee: { name: string; phone: string; role: string }) {
            try {
                const response = await propertyAPI.addEmployee(employee)
                if (response.code === 200) {
                    // 重新加载员工数据
                    const employeesResponse = await propertyAPI.getEmployeeList()
                    this.employees = employeesResponse.data || []
                }
                return response
            } catch (error) {
                console.error('添加员工失败:', error)
                throw error
            }
        },

        updateEmployee(id: number, data: Partial<Employee>) {
            const employee = this.employees.find(e => e.id === id)
            if (employee) {
                Object.assign(employee, data)
            }
        },

        deleteEmployee(id: number) {
            const index = this.employees.findIndex(e => e.id === id)
            if (index > -1) {
                this.employees.splice(index, 1)
            }
        },

        // ===== 门禁日志操作 =====

        /**
         * 创建房产
         */
        async createHouse(data: {
            building: number
            unit: string
            floor: number
            room_number: string
            area: number
            status: number
        }) {
            try {
                const response = await propertyAPI.createHouse(data)
                if (response.code === 200) {
                    // 重新加载房产列表
                    const houseListResponse = await propertyAPI.getHouseList()
                    this.houses = houseListResponse.data || []
                    return response.data
                } else {
                    throw new Error(response.message || '创建房产失败')
                }
            } catch (error) {
                console.error('创建房产失败:', error)
                throw error
            }
        },

        /**
         * 创建车位
         */
        async createParkingSpace(data: {
            area_name: string
            space_number: string
            parking_type: 'owned' | 'rented'
            status: number
        }) {
            try {
                const response = await propertyAPI.createParkingSpace(data)
                if (response.code === 200) {
                    // 重新加载车位列表
                    const parkingListResponse = await propertyAPI.getParkingSpaceList()
                    this.parkings = parkingListResponse.data || []
                    return response.data
                } else {
                    throw new Error(response.message || '创建车位失败')
                }
            } catch (error) {
                console.error('创建车位失败:', error)
                throw error
            }
        },

        /**
         * 加载门禁日志数据
         */
        async loadAccessLogs(params?: {
            page?: number
            page_size?: number
            method?: string
            location?: string
            keyword?: string
            start_date?: string
            end_date?: string
            person_type?: string
        }) {
            try {
                const response = await propertyAPI.getAccessLogs(params)
                if (response.code === 200 && response.data) {
                    // 转换后端数据格式为前端需要的格式
                    this.accessLogs = response.data.list.map(log => ({
                        id: log.id,
                        personName: log.person_name,
                        method: log.method,
                        method_display: log.method_display,
                        location: log.location,
                        direction: log.direction,
                        timestamp: log.timestamp,
                        avatar_url: '',
                        status: log.direction === 'in' ? '进入' : '离开',
                        statusColor: log.direction === 'in' ? 'success' : 'warning'
                    }))

                    // 存储分页信息（如果需要的话）
                    this.accessLogsPagination = {
                        currentPage: response.data.page,
                        pageSize: response.data.page_size,
                        total: response.data.total,
                        totalPages: response.data.total_pages
                    }
                } else {
                    // 失败时使用mock数据作为fallback
                    this.accessLogs = [...mockAccessLogs]
                    console.warn('加载门禁日志失败，使用mock数据')
                }
            } catch (error) {
                console.error('加载门禁日志失败:', error)
                // 失败时使用mock数据作为fallback
                this.accessLogs = [...mockAccessLogs]
            }
        },

        /**
         * 刷新门禁日志
         */
        async refreshAccessLogs() {
            await this.loadAccessLogs()
        },

        /**
         * 根据筛选条件加载门禁日志
         */
        async filterAccessLogs(filters: {
            method?: string
            location?: string
            keyword?: string
            start_date?: string
            end_date?: string
            person_type?: string
        }) {
            await this.loadAccessLogs(filters)
        },

        /**
         * 获取门禁日志统计数据
         */
        async getAccessLogStatistics(params?: {
            days?: number
            start_date?: string
            end_date?: string
        }) {
            try {
                const response = await propertyAPI.getAccessLogStatistics(params)
                return response.data
            } catch (error) {
                console.error('获取门禁日志统计数据失败:', error)
                throw error
            }
        },

        /**
         * 获取门禁日志选项数据
         */
        async getAccessLogOptions() {
            try {
                const response = await propertyAPI.getAccessLogOptions()
                return response.data
            } catch (error) {
                console.error('获取门禁日志选项失败:', error)
                throw error
            }
        },

        /**
         * 创建门禁日志记录（设备上报）
         */
        async createAccessLog(data: {
            person_name: string
            method: string
            direction: string
            location: string
            person_type?: string
            device_id?: string
            success?: boolean
        }) {
            try {
                const response = await propertyAPI.createAccessLog(data)
                if (response.code === 200) {
                    // 重新加载数据
                    await this.loadAccessLogs()
                }
                return response
            } catch (error) {
                console.error('创建门禁日志失败:', error)
                throw error
            }
        },
    },
})
