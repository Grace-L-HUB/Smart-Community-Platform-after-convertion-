// 商户管理 Store
import { defineStore } from 'pinia'
import { merchantProductApi, type Product } from '@/services/merchant'

// 使用与后端API一致的Product类型
export type MerchantProduct = Product

export interface MerchantOrder {
    id: number
    order_no: string
    merchant_name: string
    total_amount: number
    actual_amount: number
    status: 'new' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled'
    pickup_type: 'pickup' | 'delivery'
    contact_name: string
    contact_phone: string
    address: string
    created_at: string
}

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
                // 从API加载商品列表
                const response = await merchantProductApi.getProducts()
                if (response.success && response.data) {
                    this.products = response.data
                }
            } catch (error) {
                console.error('加载数据失败:', error)
            } finally {
                this.loading = false
            }
        },

        // 加载统计数据
        async loadStats() {
            // TODO: 从API加载统计数据
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
            const order = this.orders.find(o => o.id === orderId)
            if (order) {
                order.status = status
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
