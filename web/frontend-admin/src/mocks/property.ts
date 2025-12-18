// Mock 数据 - 物业管理端

export interface House {
    id: number
    building: string
    unit: string
    room: string
    area: number
    status: 'self' | 'rent' | 'empty'
    ownerName: string
    ownerPhone: string
}

export interface Resident {
    id: number
    name: string
    phone: string
    houseId: number
    houseAddress: string
    identity: 'owner' | 'tenant' | 'family'
    status: 0 | 1 | 2 // 0-待审核, 1-已通过, 2-已拒绝
    applyTime: string
    rejectReason?: string
}

export interface WorkOrder {
    id: number
    orderNo: string
    reporterName: string
    reporterPhone: string
    location: string
    type: 'water' | 'electric' | 'door' | 'public' | 'other'
    summary: string
    description: string
    images: string[]
    status: 'pending' | 'processing' | 'completed' | 'rejected'
    assignee?: string
    result?: string
    cost?: number
    createdAt: string
    updatedAt: string
}

export interface Bill {
    id: number
    houseAddress: string
    ownerName: string
    type: 'property' | 'water' | 'electric' | 'parking'
    amount: number
    period: string
    status: 'paid' | 'unpaid'
    paidAt?: string
    createdAt: string
}

export interface Announcement {
    id: number
    title: string
    content: string
    scope: 'all' | 'building'
    targetBuildings?: string[]
    author: string
    status: 'published' | 'draft' | 'withdrawn'
    createdAt: string
    publishedAt?: string
}

export interface Activity {
    id: number
    title: string
    description: string
    location: string
    startTime: string
    endTime: string
    maxParticipants: number
    currentParticipants: number
    status: 'upcoming' | 'ongoing' | 'ended'
    createdAt: string
}

export interface AccessLog {
    id: number
    personName: string
    method: 'face' | 'qrcode' | 'card' | 'password'
    location: string
    direction: 'in' | 'out'
    timestamp: string
}

export interface Employee {
    id: number
    name: string
    phone: string
    role: 'admin' | 'service' | 'repair' | 'security'
    status: 'active' | 'inactive'
    createdAt: string
}

// Mock 数据实例
export const mockHouses: House[] = [
    { id: 1, building: '1栋', unit: '1单元', room: '101', area: 89.5, status: 'self', ownerName: '张三', ownerPhone: '13800138001' },
    { id: 2, building: '1栋', unit: '1单元', room: '102', area: 120.3, status: 'rent', ownerName: '李四', ownerPhone: '13800138002' },
    { id: 3, building: '1栋', unit: '2单元', room: '201', area: 95.2, status: 'empty', ownerName: '王五', ownerPhone: '13800138003' },
    { id: 4, building: '2栋', unit: '1单元', room: '301', area: 110.8, status: 'self', ownerName: '赵六', ownerPhone: '13800138004' },
    { id: 5, building: '2栋', unit: '2单元', room: '402', area: 88.6, status: 'rent', ownerName: '钱七', ownerPhone: '13800138005' },
    { id: 6, building: '3栋', unit: '1单元', room: '501', area: 135.0, status: 'self', ownerName: '孙八', ownerPhone: '13800138006' },
    { id: 7, building: '3栋', unit: '2单元', room: '602', area: 78.9, status: 'empty', ownerName: '周九', ownerPhone: '13800138007' },
    { id: 8, building: '4栋', unit: '1单元', room: '101', area: 102.4, status: 'self', ownerName: '吴十', ownerPhone: '13800138008' },
]

export const mockResidents: Resident[] = [
    { id: 1, name: '张三', phone: '13800138001', houseId: 1, houseAddress: '1栋1单元101', identity: 'owner', status: 1, applyTime: '2024-01-15 10:30:00' },
    { id: 2, name: '张小明', phone: '13800138011', houseId: 1, houseAddress: '1栋1单元101', identity: 'family', status: 1, applyTime: '2024-01-16 14:20:00' },
    { id: 3, name: '王租客', phone: '13800138021', houseId: 2, houseAddress: '1栋1单元102', identity: 'tenant', status: 0, applyTime: '2024-12-15 09:00:00' },
    { id: 4, name: '李家人', phone: '13800138022', houseId: 2, houseAddress: '1栋1单元102', identity: 'family', status: 0, applyTime: '2024-12-16 11:30:00' },
    { id: 5, name: '赵六', phone: '13800138004', houseId: 4, houseAddress: '2栋1单元301', identity: 'owner', status: 1, applyTime: '2024-02-20 16:45:00' },
    { id: 6, name: '新住户A', phone: '13900139001', houseId: 5, houseAddress: '2栋2单元402', identity: 'tenant', status: 0, applyTime: '2024-12-17 08:15:00' },
]

export const mockWorkOrders: WorkOrder[] = [
    {
        id: 1, orderNo: 'WO20241218001', reporterName: '张三', reporterPhone: '13800138001',
        location: '1栋1单元101', type: 'water', summary: '卫生间漏水', description: '主卧卫生间天花板有渗水现象',
        images: [], status: 'pending', createdAt: '2024-12-18 08:30:00', updatedAt: '2024-12-18 08:30:00'
    },
    {
        id: 2, orderNo: 'WO20241217002', reporterName: '李四', reporterPhone: '13800138002',
        location: '1栋1单元102', type: 'electric', summary: '插座不通电', description: '客厅靠窗的插座没有电',
        images: [], status: 'processing', assignee: '维修工小王', createdAt: '2024-12-17 14:20:00', updatedAt: '2024-12-17 15:00:00'
    },
    {
        id: 3, orderNo: 'WO20241216003', reporterName: '赵六', reporterPhone: '13800138004',
        location: '2栋1单元301', type: 'door', summary: '入户门锁损坏', description: '门锁打不开，需要更换',
        images: [], status: 'completed', assignee: '维修工小李', result: '已更换新门锁', cost: 350, createdAt: '2024-12-16 09:15:00', updatedAt: '2024-12-16 16:30:00'
    },
    {
        id: 4, orderNo: 'WO20241218004', reporterName: '钱七', reporterPhone: '13800138005',
        location: '2栋2单元402', type: 'public', summary: '楼道灯不亮', description: '4楼楼道的灯坏了',
        images: [], status: 'pending', createdAt: '2024-12-18 10:00:00', updatedAt: '2024-12-18 10:00:00'
    },
    {
        id: 5, orderNo: 'WO20241215005', reporterName: '孙八', reporterPhone: '13800138006',
        location: '3栋1单元501', type: 'other', summary: '空调外机噪音大', description: '邻居空调外机噪音影响休息',
        images: [], status: 'rejected', createdAt: '2024-12-15 20:30:00', updatedAt: '2024-12-15 21:00:00'
    },
]

export const mockBills: Bill[] = [
    { id: 1, houseAddress: '1栋1单元101', ownerName: '张三', type: 'property', amount: 1200, period: '2024-12', status: 'paid', paidAt: '2024-12-05 10:30:00', createdAt: '2024-12-01 00:00:00' },
    { id: 2, houseAddress: '1栋1单元102', ownerName: '李四', type: 'property', amount: 1450, period: '2024-12', status: 'unpaid', createdAt: '2024-12-01 00:00:00' },
    { id: 3, houseAddress: '2栋1单元301', ownerName: '赵六', type: 'property', amount: 1350, period: '2024-12', status: 'paid', paidAt: '2024-12-10 14:20:00', createdAt: '2024-12-01 00:00:00' },
    { id: 4, houseAddress: '1栋1单元101', ownerName: '张三', type: 'water', amount: 85.5, period: '2024-11', status: 'paid', paidAt: '2024-12-03 09:15:00', createdAt: '2024-12-01 00:00:00' },
    { id: 5, houseAddress: '1栋1单元102', ownerName: '李四', type: 'water', amount: 120.3, period: '2024-11', status: 'unpaid', createdAt: '2024-12-01 00:00:00' },
    { id: 6, houseAddress: '2栋2单元402', ownerName: '钱七', type: 'property', amount: 1080, period: '2024-12', status: 'unpaid', createdAt: '2024-12-01 00:00:00' },
]

export const mockAnnouncements: Announcement[] = [
    { id: 1, title: '关于小区电梯维保的通知', content: '<p>尊敬的业主：</p><p>定于12月20日对1-3栋电梯进行年度维保，届时电梯将暂停使用2小时。</p>', scope: 'building', targetBuildings: ['1栋', '2栋', '3栋'], author: '物业管理处', status: 'published', createdAt: '2024-12-15 10:00:00', publishedAt: '2024-12-15 10:00:00' },
    { id: 2, title: '元旦放假安排', content: '<p>2025年元旦假期：1月1日放假一天。物业服务热线24小时值班。</p>', scope: 'all', author: '物业管理处', status: 'published', createdAt: '2024-12-18 09:00:00', publishedAt: '2024-12-18 09:00:00' },
    { id: 3, title: '停车费调整公告（草稿）', content: '<p>关于调整地下停车费的通知...</p>', scope: 'all', author: '物业管理处', status: 'draft', createdAt: '2024-12-17 14:30:00' },
]

export const mockActivities: Activity[] = [
    { id: 1, title: '圣诞节亲子活动', description: '在小区花园举办圣诞节亲子游戏活动，有礼品赠送', location: '中心花园', startTime: '2024-12-24 14:00:00', endTime: '2024-12-24 17:00:00', maxParticipants: 50, currentParticipants: 32, status: 'upcoming', createdAt: '2024-12-10 10:00:00' },
    { id: 2, title: '业主瑜伽课', description: '每周六上午的免费瑜伽课程', location: '社区活动中心', startTime: '2024-12-21 09:00:00', endTime: '2024-12-21 10:30:00', maxParticipants: 20, currentParticipants: 18, status: 'upcoming', createdAt: '2024-12-01 08:00:00' },
    { id: 3, title: '跳蚤市场', description: '业主二手物品交易市场', location: '地下车库B区', startTime: '2024-12-14 10:00:00', endTime: '2024-12-14 16:00:00', maxParticipants: 100, currentParticipants: 67, status: 'ended', createdAt: '2024-12-05 09:00:00' },
]

export const mockAccessLogs: AccessLog[] = [
    { id: 1, personName: '张三', method: 'face', location: '1栋东门', direction: 'in', timestamp: '2024-12-18 08:15:32' },
    { id: 2, personName: '李四', method: 'qrcode', location: '1栋东门', direction: 'in', timestamp: '2024-12-18 08:20:45' },
    { id: 3, personName: '外卖员', method: 'qrcode', location: '南大门', direction: 'in', timestamp: '2024-12-18 11:35:20' },
    { id: 4, personName: '张三', method: 'face', location: '1栋东门', direction: 'out', timestamp: '2024-12-18 09:00:15' },
    { id: 5, personName: '赵六', method: 'card', location: '2栋西门', direction: 'in', timestamp: '2024-12-18 12:10:08' },
    { id: 6, personName: '访客A', method: 'password', location: '南大门', direction: 'in', timestamp: '2024-12-18 14:25:33' },
    { id: 7, personName: '快递员', method: 'qrcode', location: '北大门', direction: 'out', timestamp: '2024-12-18 15:40:22' },
]

export const mockEmployees: Employee[] = [
    { id: 1, name: '王经理', phone: '13600136001', role: 'admin', status: 'active', createdAt: '2023-01-01 00:00:00' },
    { id: 2, name: '李客服', phone: '13600136002', role: 'service', status: 'active', createdAt: '2023-03-15 00:00:00' },
    { id: 3, name: '张维修', phone: '13600136003', role: 'repair', status: 'active', createdAt: '2023-06-20 00:00:00' },
    { id: 4, name: '刘维修', phone: '13600136004', role: 'repair', status: 'active', createdAt: '2024-02-10 00:00:00' },
    { id: 5, name: '陈保安', phone: '13600136005', role: 'security', status: 'active', createdAt: '2023-08-05 00:00:00' },
    { id: 6, name: '周保安', phone: '13600136006', role: 'security', status: 'inactive', createdAt: '2023-04-12 00:00:00' },
]

// 统计数据
export const mockPropertyStats = {
    pendingWorkOrders: 2,
    todayRepairs: 3,
    totalResidents: 128,
    feeCollectionRate: 0.856,
    // 近7天工单趋势
    workOrderTrend: [
        { date: '12-12', count: 5 },
        { date: '12-13', count: 3 },
        { date: '12-14', count: 8 },
        { date: '12-15', count: 4 },
        { date: '12-16', count: 6 },
        { date: '12-17', count: 7 },
        { date: '12-18', count: 3 },
    ],
    // 报修类型分布
    repairTypeDistribution: [
        { type: '水电', value: 35 },
        { type: '门窗', value: 20 },
        { type: '公区', value: 25 },
        { type: '其他', value: 20 },
    ],
}
