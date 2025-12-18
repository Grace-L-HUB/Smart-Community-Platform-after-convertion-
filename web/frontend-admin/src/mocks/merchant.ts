// Mock 数据 - 商户管理端

export interface Product {
    id: number
    name: string
    description: string
    image: string
    price: number
    originalPrice?: number
    stock: number
    category: string
    status: 'online' | 'offline'
    salesCount: number
    serviceTimeSlots?: string[]
    createdAt: string
}

export interface Order {
    id: number
    orderNo: string
    customerName: string
    customerPhone: string
    products: Array<{
        name: string
        quantity: number
        price: number
    }>
    totalAmount: number
    status: 'new' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'refunded'
    pickupCode?: string
    pickupType: 'delivery' | 'pickup'
    address?: string
    note?: string
    createdAt: string
    completedAt?: string
}

export interface ShopSettings {
    id: number
    name: string
    logo: string
    announcement: string
    businessHours: {
        start: string
        end: string
    }
    phone: string
    address: string
    category: string
}

// Mock 商品数据
export const mockProducts: Product[] = [
    {
        id: 1, name: '招牌奶茶', description: '新鲜牛奶配制，口感香醇',
        image: 'https://picsum.photos/seed/milk-tea/200/200', price: 15, originalPrice: 18,
        stock: 100, category: '饮品', status: 'online', salesCount: 256, createdAt: '2024-06-01 10:00:00'
    },
    {
        id: 2, name: '水果捞', description: '多种新鲜水果搭配酸奶',
        image: 'https://picsum.photos/seed/fruit/200/200', price: 25, originalPrice: 30,
        stock: 50, category: '甜品', status: 'online', salesCount: 128, createdAt: '2024-06-15 10:00:00'
    },
    {
        id: 3, name: '家政保洁2小时', description: '专业保洁人员上门服务',
        image: 'https://picsum.photos/seed/cleaning/200/200', price: 120,
        stock: 999, category: '家政服务', status: 'online', salesCount: 45,
        serviceTimeSlots: ['09:00-11:00', '14:00-16:00', '16:00-18:00'], createdAt: '2024-07-01 10:00:00'
    },
    {
        id: 4, name: '开锁服务', description: '24小时专业开锁，快速上门',
        image: 'https://picsum.photos/seed/key/200/200', price: 80,
        stock: 999, category: '便民服务', status: 'online', salesCount: 33, createdAt: '2024-08-01 10:00:00'
    },
    {
        id: 5, name: '蛋糕6寸', description: '生日蛋糕，需提前1天预订',
        image: 'https://picsum.photos/seed/cake/200/200', price: 88, originalPrice: 108,
        stock: 10, category: '烘焙', status: 'online', salesCount: 67, createdAt: '2024-09-01 10:00:00'
    },
    {
        id: 6, name: '过季饮品', description: '冬季限定，已下架',
        image: 'https://picsum.photos/seed/drink/200/200', price: 12,
        stock: 0, category: '饮品', status: 'offline', salesCount: 89, createdAt: '2024-03-01 10:00:00'
    },
]

// Mock 订单数据
export const mockOrders: Order[] = [
    {
        id: 1, orderNo: 'MO20241218001', customerName: '张三', customerPhone: '138****8001',
        products: [{ name: '招牌奶茶', quantity: 2, price: 15 }], totalAmount: 30,
        status: 'new', pickupType: 'pickup', pickupCode: '8821',
        createdAt: '2024-12-18 10:30:00'
    },
    {
        id: 2, orderNo: 'MO20241218002', customerName: '李四', customerPhone: '138****8002',
        products: [{ name: '水果捞', quantity: 1, price: 25 }, { name: '招牌奶茶', quantity: 1, price: 15 }],
        totalAmount: 40, status: 'accepted', pickupType: 'delivery', address: '1栋1单元102',
        createdAt: '2024-12-18 11:15:00'
    },
    {
        id: 3, orderNo: 'MO20241218003', customerName: '王五', customerPhone: '139****9001',
        products: [{ name: '家政保洁2小时', quantity: 1, price: 120 }], totalAmount: 120,
        status: 'preparing', pickupType: 'delivery', address: '2栋1单元301', note: '请下午2点到',
        createdAt: '2024-12-18 09:00:00'
    },
    {
        id: 4, orderNo: 'MO20241217004', customerName: '赵六', customerPhone: '138****8004',
        products: [{ name: '蛋糕6寸', quantity: 1, price: 88 }], totalAmount: 88,
        status: 'completed', pickupType: 'pickup', pickupCode: '6653',
        createdAt: '2024-12-17 14:20:00', completedAt: '2024-12-17 16:30:00'
    },
    {
        id: 5, orderNo: 'MO20241217005', customerName: '钱七', customerPhone: '138****8005',
        products: [{ name: '招牌奶茶', quantity: 3, price: 15 }], totalAmount: 45,
        status: 'completed', pickupType: 'delivery', address: '2栋2单元402',
        createdAt: '2024-12-17 15:40:00', completedAt: '2024-12-17 16:10:00'
    },
    {
        id: 6, orderNo: 'MO20241216006', customerName: '孙八', customerPhone: '138****8006',
        products: [{ name: '水果捞', quantity: 2, price: 25 }], totalAmount: 50,
        status: 'cancelled', pickupType: 'pickup', note: '用户取消',
        createdAt: '2024-12-16 12:00:00'
    },
    {
        id: 7, orderNo: 'MO20241218007', customerName: '周九', customerPhone: '138****8007',
        products: [{ name: '开锁服务', quantity: 1, price: 80 }], totalAmount: 80,
        status: 'new', pickupType: 'delivery', address: '3栋2单元602',
        createdAt: '2024-12-18 12:05:00'
    },
]

// Mock 店铺设置
export const mockShopSettings: ShopSettings = {
    id: 1,
    name: '社区便利店',
    logo: 'https://picsum.photos/seed/shop/100/100',
    announcement: '欢迎光临！满50元免配送费',
    businessHours: { start: '08:00', end: '22:00' },
    phone: '400-123-4567',
    address: '社区南门商业街1号',
    category: '便利店',
}

// 统计数据
export const mockMerchantStats = {
    todayOrders: 12,
    todayRevenue: 856.5,
    pendingOrders: 3,
    // 近一周销售额
    salesTrend: [
        { date: '12-12', amount: 680 },
        { date: '12-13', amount: 920 },
        { date: '12-14', amount: 1250 },
        { date: '12-15', amount: 780 },
        { date: '12-16', amount: 1100 },
        { date: '12-17', amount: 950 },
        { date: '12-18', amount: 856.5 },
    ],
}
