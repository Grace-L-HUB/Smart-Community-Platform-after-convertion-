// 物业管理 Store
import { defineStore } from 'pinia'
import {
    mockHouses,
    mockResidents,
    mockWorkOrders,
    mockBills,
    mockAnnouncements,
    mockActivities,
    mockAccessLogs,
    mockEmployees,
    mockPropertyStats,
    mockParkings,
    mockParkingApplies,
    type House,
    type Resident,
    type Parking,
    type ParkingApply,
    type WorkOrder,
    type Bill,
    type Announcement,
    type Activity,
    type AccessLog,
    type Employee,
} from '@/mocks/property'

export type { House, Resident, Parking, ParkingApply, WorkOrder, Bill, Announcement, Activity, AccessLog, Employee }

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
    }),

    getters: {
        // 房产与住户
        pendingResidents: (state) => state.residents.filter(r => r.status === 0),
        approvedResidents: (state) => state.residents.filter(r => r.status === 1),

        // 车位申请
        pendingParkingApplies: (state) => state.parkingApplies.filter(p => p.status === 0),

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
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 300))

            this.houses = [...mockHouses]
            this.residents = [...mockResidents]
            this.workOrders = [...mockWorkOrders]
            this.bills = [...mockBills]
            this.announcements = [...mockAnnouncements]
            this.activities = [...mockActivities]
            this.accessLogs = [...mockAccessLogs]
            this.employees = [...mockEmployees]
            this.parkings = [...mockParkings]
            this.parkingApplies = [...mockParkingApplies]
            this.stats = { ...mockPropertyStats }

            this.loading = false
        },

        // 住户审核
        approveResident(id: number) {
            const resident = this.residents.find(r => r.id === id)
            if (resident) {
                resident.status = 1
            }
        },

        rejectResident(id: number, reason: string) {
            const resident = this.residents.find(r => r.id === id)
            if (resident) {
                resident.status = 2
                resident.rejectReason = reason
            }
        },

        // 车位审核
        approveParking(id: number) {
            const apply = this.parkingApplies.find(p => p.id === id)
            if (apply) {
                apply.status = 1
                // 同时更新车位状态（可选逻辑，根据业务需求）
                const parking = this.parkings.find(p => p.area === apply.parkingArea && p.parkingNo === apply.parkingNo)
                if (parking) {
                    parking.status = 'active'
                    parking.ownerName = apply.ownerName
                    parking.ownerPhone = apply.ownerPhone
                    parking.carNo = apply.carNo
                    parking.carBrand = apply.carBrand
                    parking.carColor = apply.carColor
                    parking.type = apply.parkingType
                } else {
                    // 如果车位不存在，创建一个新记录
                    this.parkings.push({
                        id: this.parkings.length + 1,
                        area: apply.parkingArea,
                        parkingNo: apply.parkingNo,
                        carNo: apply.carNo,
                        carBrand: apply.carBrand,
                        carColor: apply.carColor,
                        ownerName: apply.ownerName,
                        ownerPhone: apply.ownerPhone,
                        type: apply.parkingType,
                        status: 'active'
                    })
                }
            }
        },

        rejectParking(id: number, reason: string) {
            const apply = this.parkingApplies.find(p => p.id === id)
            if (apply) {
                apply.status = 2
                apply.rejectReason = reason
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

        // 员工操作
        addEmployee(employee: Omit<Employee, 'id' | 'createdAt'>) {
            const newEmployee: Employee = {
                ...employee,
                id: this.employees.length + 1,
                createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
            }
            this.employees.push(newEmployee)
            return newEmployee
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
