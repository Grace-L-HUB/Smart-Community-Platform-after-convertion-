// 商户管理 Store
import { defineStore } from 'pinia'
import { merchantProductApi, merchantOrderApi, merchantStatsApi, type Product, type Order } from '@/services/merchant'

// 使用与后端API一致的Product类型
export type MerchantProduct = Product

// UI页面使用的订单格式（转换后）
export interface MerchantOrder {
    id: number
    orderNo: string
    merchantName: string
    totalAmount: number
    actualAmount: number
    status: 'new' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'refunded'
    pickupType: 'pickup' | 'delivery'
    customerName: string
    customerPhone: string
    address: string
    note?: string
    pickupCode?: string
    products: Array<{
        name: string
        quantity: number
        price: number
    }>
    createdAt: string
    acceptedAt?: string
    completedAt?: string
}

// 原始API订单格式
type ApiOrder = Order

export interface MerchantCoupon {
    id: number
    name: string
    description: string
    amount: number
    min_amount: number
    total_count: number
    used_count: number
    start_date: string
    end_date: string
    status: 'active' | 'inactive'
}

interface ShopSettings {
    name: string
    businessHours: {
        start: string
        end: string
    }
}

interface Stats {
    todayOrders: number
    todayRevenue: number
    pendingOrders: number
    salesTrend: Array<{ date: string, amount: number }>
}

interface MerchantState {
    products: MerchantProduct[]
    orders: MerchantOrder[]
    coupons: MerchantCoupon[]
    shopSettings: ShopSettings | null
    stats: Stats
    loading: boolean
}

// 将API订单格式转换为UI格式
function transformOrder(apiOrder: ApiOrder): MerchantOrder {
    return {
        id: apiOrder.id,
        orderNo: apiOrder.order_no,
        merchantName: apiOrder.merchant_name,
        totalAmount: Number(apiOrder.total_amount) || 0,
        actualAmount: Number(apiOrder.actual_amount) || 0,
        status: apiOrder.status,
        pickupType: apiOrder.pickup_type,
        customerName: apiOrder.user_info?.display_name || apiOrder.contact_name,
        customerPhone: apiOrder.contact_phone,
        address: apiOrder.address || '',
        note: apiOrder.note,
        pickupCode: apiOrder.pickup_code,
        products: apiOrder.items.map(item => ({
            name: item.product_name,
            quantity: item.quantity,
            price: Number(item.product_price) || 0
        })),
        createdAt: apiOrder.created_at,
        acceptedAt: apiOrder.accepted_at,
        completedAt: apiOrder.completed_at
    }
}

export const useMerchantStore = defineStore('merchant', {
    state: (): MerchantState => ({
        products: [],
        orders: [],
        coupons: [],
        shopSettings: null,
        stats: {
            todayOrders: 0,
            todayRevenue: 0,
            pendingOrders: 0,
            salesTrend: []
        },
        loading: false
    }),

    getters: {
        activeProducts: (state) => state.products.filter(p => p.status === 'online'),
        pendingOrders: (state) => state.orders.filter(o => o.status === 'new'),
        activeCoupons: (state) => state.coupons.filter(c => c.status === 'active'),

        // 订单分组
        newOrders: (state) => state.orders.filter(o => o.status === 'new'),
        processingOrders: (state) => state.orders.filter(o => ['accepted', 'preparing', 'ready'].includes(o.status)),
        completedOrders: (state) => state.orders.filter(o => o.status === 'completed'),
        cancelledOrders: (state) => state.orders.filter(o => ['cancelled', 'refunded'].includes(o.status)),
    },

    actions: {
        // 加载所有数据
        async loadAll() {
            this.loading = true
            try {
                // 并行加载商品和订单
                const [productsResponse, ordersResponse] = await Promise.all([
                    merchantProductApi.getProducts(),
                    merchantOrderApi.getOrders()
                ])

                if (productsResponse.success && productsResponse.data) {
                    this.products = productsResponse.data
                }

                if (ordersResponse.success && ordersResponse.data) {
                    const data = ordersResponse.data
                    // 处理分页数据或数组数据
                    const orderList = Array.isArray(data) ? data : (data.items || [])
                    this.orders = orderList.map(transformOrder)
                }
            } catch (error) {
                console.error('加载数据失败:', error)
            } finally {
                this.loading = false
            }
        },

        // 单独加载订单
        async loadOrders() {
            try {
                const response = await merchantOrderApi.getOrders()
                if (response.success && response.data) {
                    const data = response.data
                    const orderList = Array.isArray(data) ? data : (data.items || [])
                    this.orders = orderList.map(transformOrder)
                }
            } catch (error) {
                console.error('加载订单失败:', error)
            }
        },

        // 加载统计数据
        async loadStats() {
            try {
                const response = await merchantStatsApi.getStats()
                if (response.success && response.data) {
                    this.stats = response.data
                }
            } catch (error) {
                console.error('加载统计数据失败:', error)
            }
        },

        // 商品操作
        async addProduct(product: Omit<MerchantProduct, 'id' | 'created_at' | 'updated_at'>) {
            // 转换为FormData
            const formData = new FormData()
            Object.entries(product).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        // 数组类型转换为JSON字符串
                        formData.append(key, JSON.stringify(value))
                    } else {
                        formData.append(key, String(value))
                    }
                }
            })

            try {
                const response = await merchantProductApi.createProduct(formData)
                if (response.success && response.data && response.data.id) {
                    this.products.unshift(response.data as MerchantProduct)
                    return response.data as MerchantProduct
                }
                throw new Error(response.message || '创建失败')
            } catch (error) {
                console.error('创建商品失败:', error)
                throw error
            }
        },

        async updateProduct(id: number, data: Partial<MerchantProduct>) {
            console.log('=== Store更新商品开始 ===')
            console.log('商品ID:', id)
            console.log('更新数据:', data)
            console.log('图片字段:', data.image)

            // 转换为FormData
            const formData = new FormData()
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        // 数组类型转换为JSON字符串
                        formData.append(key, JSON.stringify(value))
                    } else {
                        formData.append(key, String(value))
                    }
                }
            })

            // 打印FormData内容（需要特殊方式）
            console.log('FormData内容:')
            for (let [key, value] of formData.entries()) {
                console.log(`  ${key}:`, value)
            }

            try {
                const response = await merchantProductApi.updateProduct(id, formData)
                console.log('API响应:', response)
                if (response.success && response.data) {
                    console.log('✅ 更新成功，返回数据:', response.data)
                    // 更新本地状态
                    const index = this.products.findIndex(p => p.id === id)
                    if (index > -1) {
                        this.products[index] = response.data as MerchantProduct
                    }
                    return response.data as MerchantProduct
                }
                // 输出详细的验证错误
                if ((response as any).errors) {
                    console.error('❌ 验证错误详情:', (response as any).errors)
                }
                throw new Error(response.message || '更新失败')
            } catch (error) {
                console.error('❌ 更新商品失败:', error)
                throw error
            }
        },

        deleteProduct(id: number) {
            const index = this.products.findIndex(p => p.id === id)
            if (index > -1) {
                this.products.splice(index, 1)
            }
        },

        // 订单操作
        async updateOrderStatus(orderId: number, status: MerchantOrder['status']) {
            try {
                const response = await merchantOrderApi.updateOrderStatus(orderId, { status })
                if (response.success && response.data) {
                    // 更新本地订单状态
                    const index = this.orders.findIndex(o => o.id === orderId)
                    if (index > -1) {
                        const updated = transformOrder(response.data)
                        this.orders[index] = updated
                    }
                }
            } catch (error) {
                console.error('更新订单状态失败:', error)
                throw error
            }
        },

        // 接单
        async acceptOrder(orderId: number) {
            return this.updateOrderStatus(orderId, 'accepted')
        },

        // 拒单
        async rejectOrder(orderId: number, reason: string) {
            try {
                const response = await merchantOrderApi.updateOrderStatus(orderId, {
                    status: 'cancelled',
                    reject_reason: reason
                })
                if (response.success && response.data) {
                    // 更新本地订单状态
                    const index = this.orders.findIndex(o => o.id === orderId)
                    if (index > -1) {
                        const updated = transformOrder(response.data)
                        this.orders[index] = updated
                    }
                }
            } catch (error) {
                console.error('拒单失败:', error)
                throw error
            }
        },

        // 验证取餐码
        async verifyPickupCode(pickupCode: string): Promise<{
            success: boolean
            message: string
            order?: MerchantOrder
        }> {
            try {
                const response = await merchantOrderApi.verifyPickupCode(pickupCode)
                if (response.success && response.data) {
                    // 重新加载订单列表
                    await this.loadOrders()
                    const orderId = response.data?.order_id
                    return {
                        success: true,
                        message: '验证成功',
                        order: orderId ? this.orders.find(o => o.id === orderId) : undefined
                    }
                }
                return {
                    success: false,
                    message: response.message || '验证失败'
                }
            } catch (error) {
                console.error('验证取餐码失败:', error)
                return {
                    success: false,
                    message: '验证失败，请重试'
                }
            }
        },

        // 优惠券操作
        addCoupon(coupon: Omit<MerchantCoupon, 'id'>) {
            const newCoupon: MerchantCoupon = {
                ...coupon,
                id: Date.now()
            }
            this.coupons.unshift(newCoupon)
            return newCoupon
        },

        updateCoupon(id: number, data: Partial<MerchantCoupon>) {
            const index = this.coupons.findIndex(c => c.id === id)
            if (index > -1) {
                const coupon = this.coupons[index]
                if (coupon) {
                    Object.assign(coupon, data)
                }
            }
        },

        deleteCoupon(id: number) {
            const index = this.coupons.findIndex(c => c.id === id)
            if (index > -1) {
                this.coupons.splice(index, 1)
            }
        }
    }
})
