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

export interface Parking {
    id: number
    area: string
    parkingNo: string
    carNo: string
    carBrand: string
    carColor: string
    ownerName: string
    ownerPhone: string
    type: 'owned' | 'rented'
    status: 'active' | 'expired' | 'empty'
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
    status: 0 | 1 | 2
    applyTime: string
    rejectReason?: string
}

export interface Resident {
    id: number
    name: string
    phone: string
    houseId: number
    houseAddress: string
    identity: 'owner' | 'tenant' | 'family'
    status: 0 | 1 | 2
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
    category?: string
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
