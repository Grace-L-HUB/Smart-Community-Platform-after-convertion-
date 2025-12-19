// 物业管理 Store
import { defineStore } from 'pinia'
import {
    mockHouses,
    mockWorkOrders,
    mockBills,
    mockAnnouncements,
    mockActivities,
    mockAccessLogs,
    mockEmployees,
    mockPropertyStats,
    type House,
    type WorkOrder,
    type Bill,
    type Announcement,
    type Activity,
    type AccessLog,
    type Employee,
} from '@/mocks/property'
import {
    propertyAPI,
    type HouseBindingApplication,
    type ParkingBindingApplication,
    type HouseUserBinding,
    type ParkingUserBinding
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
    // 新增：原始API数据存储
    houseBindingApplications: HouseBindingApplication[]
    parkingBindingApplications: ParkingBindingApplication[]
    approvedHouseBindings: HouseUserBinding[]
    approvedParkingBindings: ParkingUserBinding[]
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

        // 工单管理
        pendingWorkOrders: (state) => state.workOrders.filter(o => o.status === 'pending'),
        processingWorkOrders: (state) => state.workOrders.filter(o => o.status === 'processing'),
        completedWorkOrders: (state) => state.workOrders.filter(o => o.status === 'completed'),

        // 财务与员工
        unpaidBills: (state) => state.bills.filter(b => b.status === 'unpaid'),
        activeEmployees: (state) => state.employees.filter(e => e.status === 'active'),
        repairEmployees: (state) => state.employees.filter(e => e.role === 'repair' && e.status === 'active'),

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
                    statsResponse,
                    employeesResponse
                ] = await Promise.all([
                    propertyAPI.getHouseBindingAuditList(),
                    propertyAPI.getParkingBindingAuditList(),
                    propertyAPI.getApprovedResidents(),
                    propertyAPI.getApprovedParkings(),
                    propertyAPI.getHouseList(),
                    propertyAPI.getParkingSpaceList(),
                    propertyAPI.getDashboardStats(),
                    propertyAPI.getEmployeeList()
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
                this.stats = statsResponse.data || mockPropertyStats
                this.employees = employeesResponse.data || []

                // 保持mock数据用于其他功能
                this.workOrders = [...mockWorkOrders]
                this.bills = [...mockBills]
                this.announcements = [...mockAnnouncements]
                this.activities = [...mockActivities]
                this.accessLogs = [...mockAccessLogs]

            } catch (error) {
                console.error('加载数据失败:', error)
                // 失败时使用mock数据作为fallback
                this.houseBindingApplications = []
                this.parkingBindingApplications = []
                this.approvedHouseBindings = []
                this.approvedParkingBindings = []
                this.houses = [...mockHouses] // fallback to mock data
                this.parkings = [] // 车位数据没有mock，置空
                this.stats = { ...mockPropertyStats } // fallback to mock stats
                this.employees = [...mockEmployees] // fallback to mock employees
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

        // 工单操作
        assignWorkOrder(id: number, assignee: string) {
            const order = this.workOrders.find(o => o.id === id)
            if (order) {
                order.status = 'processing'
                order.assignee = assignee
                order.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19)
            }
        },

        completeWorkOrder(id: number, result: string, cost: number) {
            const order = this.workOrders.find(o => o.id === id)
            if (order) {
                order.status = 'completed'
                order.result = result
                order.cost = cost
                order.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19)
            }
        },

        rejectWorkOrder(id: number) {
            const order = this.workOrders.find(o => o.id === id)
            if (order) {
                order.status = 'rejected'
                order.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19)
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

        // 公告操作
        addAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt'>) {
            const newAnnouncement: Announcement = {
                ...announcement,
                id: this.announcements.length + 1,
                createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
            }
            this.announcements.unshift(newAnnouncement)
            return newAnnouncement
        },

        withdrawAnnouncement(id: number) {
            const announcement = this.announcements.find(a => a.id === id)
            if (announcement) {
                announcement.status = 'withdrawn'
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
    },
})
