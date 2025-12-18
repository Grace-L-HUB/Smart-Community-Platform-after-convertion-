// 商户管理 Store
import { defineStore } from 'pinia'
import {
    mockProducts,
    mockOrders,
    mockShopSettings,
    mockMerchantStats,
    type Product,
    type Order,
    type ShopSettings,
} from '@/mocks/merchant'

interface MerchantState {
    products: Product[]
    orders: Order[]
    shopSettings: ShopSettings
    stats: typeof mockMerchantStats
    loading: boolean
}

export const useMerchantStore = defineStore('merchant', {
    state: (): MerchantState => ({
        products: [],
        orders: [],
        shopSettings: mockShopSettings,
        stats: mockMerchantStats,
        loading: false,
    }),

    getters: {
        onlineProducts: (state) => state.products.filter(p => p.status === 'online'),
        offlineProducts: (state) => state.products.filter(p => p.status === 'offline'),
        newOrders: (state) => state.orders.filter(o => o.status === 'new'),
        processingOrders: (state) => state.orders.filter(o => ['accepted', 'preparing', 'ready'].includes(o.status)),
        completedOrders: (state) => state.orders.filter(o => o.status === 'completed'),
        cancelledOrders: (state) => state.orders.filter(o => ['cancelled', 'refunded'].includes(o.status)),
    },

    actions: {
        // 加载所有数据
        async loadAll() {
            this.loading = true
            await new Promise(resolve => setTimeout(resolve, 300))

            this.products = [...mockProducts]
            this.orders = [...mockOrders]
            this.shopSettings = { ...mockShopSettings }
            this.stats = { ...mockMerchantStats }

            this.loading = false
        },

        // 商品操作
        addProduct(product: Omit<Product, 'id' | 'createdAt' | 'salesCount'>) {
            const newProduct: Product = {
                ...product,
                id: this.products.length + 1,
                salesCount: 0,
                createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
            }
            this.products.push(newProduct)
            return newProduct
        },

        updateProduct(id: number, data: Partial<Product>) {
            const product = this.products.find(p => p.id === id)
            if (product) {
                Object.assign(product, data)
            }
        },

        toggleProductStatus(id: number) {
            const product = this.products.find(p => p.id === id)
            if (product) {
                product.status = product.status === 'online' ? 'offline' : 'online'
            }
        },

        deleteProduct(id: number) {
            const index = this.products.findIndex(p => p.id === id)
            if (index > -1) {
                this.products.splice(index, 1)
            }
        },

        // 订单操作
        acceptOrder(id: number) {
            const order = this.orders.find(o => o.id === id)
            if (order) {
                order.status = 'accepted'
            }
        },

        rejectOrder(id: number, _reason: string) {
            const order = this.orders.find(o => o.id === id)
            if (order) {
                order.status = 'cancelled'
            }
        },

        updateOrderStatus(id: number, status: Order['status']) {
            const order = this.orders.find(o => o.id === id)
            if (order) {
                order.status = status
                if (status === 'completed') {
                    order.completedAt = new Date().toISOString().replace('T', ' ').slice(0, 19)
                }
            }
        },

        // 核销码验证
        verifyPickupCode(code: string) {
            const order = this.orders.find(o => o.pickupCode === code && o.status !== 'completed')
            if (order) {
                order.status = 'completed'
                order.completedAt = new Date().toISOString().replace('T', ' ').slice(0, 19)
                return { success: true, order }
            }
            return { success: false, message: '核销码无效或订单已完成' }
        },

        // 店铺设置
        updateShopSettings(settings: Partial<ShopSettings>) {
            Object.assign(this.shopSettings, settings)
            return { success: true, message: '店铺设置已更新' }
        },
    },
})
