// 商户管理 Store
import { defineStore } from 'pinia'
import {
    mockOrders,
    mockShopSettings,
    mockMerchantStats,
    type Order,
    type ShopSettings,
} from '@/mocks/merchant'
import { merchantProductApi, type Product as ApiProduct } from '@/services/merchant'

// 转换API产品到前端产品接口
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
        // 转换API产品数据到前端格式
        convertApiProductToProduct(apiProduct: ApiProduct): Product {
            return {
                id: apiProduct.id || 0,
                name: apiProduct.name,
                description: apiProduct.description,
                image: apiProduct.image || `https://picsum.photos/seed/${apiProduct.name}/200/200`,
                price: Number(apiProduct.price),
                originalPrice: apiProduct.original_price ? Number(apiProduct.original_price) : undefined,
                stock: apiProduct.stock,
                category: apiProduct.category,
                status: apiProduct.status,
                salesCount: apiProduct.sales_count || 0,
                serviceTimeSlots: apiProduct.service_time_slots,
                createdAt: apiProduct.created_at?.replace('T', ' ').slice(0, 19) || '',
            }
        },

        // 转换前端产品数据到API格式
        convertProductToApiData(product: Partial<Product>): FormData {
            const formData = new FormData()
            
            if (product.name) formData.append('name', product.name)
            if (product.description) formData.append('description', product.description)
            if (product.category) formData.append('category', product.category)
            if (product.price !== undefined) formData.append('price', product.price.toString())
            if (product.originalPrice) formData.append('original_price', product.originalPrice.toString())
            if (product.stock !== undefined) formData.append('stock', product.stock.toString())
            if (product.status) formData.append('status', product.status)
            if (product.serviceTimeSlots) {
                formData.append('service_time_slots', JSON.stringify(product.serviceTimeSlots))
            }
            
            return formData
        },

        // 加载所有数据
        async loadAll() {
            this.loading = true
            
            try {
                // 加载商品数据
                const productResponse = await merchantProductApi.getProducts()
                if (productResponse.success && productResponse.data) {
                    this.products = productResponse.data.map(this.convertApiProductToProduct)
                }
                
                // 暂时还使用mock数据的其他部分
                this.orders = [...mockOrders]
                this.shopSettings = { ...mockShopSettings }
                this.stats = { ...mockMerchantStats }
                
            } catch (error) {
                console.error('加载数据失败:', error)
                // 如果API调用失败，使用空数组
                this.products = []
                this.orders = [...mockOrders]
                this.shopSettings = { ...mockShopSettings }
                this.stats = { ...mockMerchantStats }
            }
            
            this.loading = false
        },

        // 商品操作
        async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'salesCount'>) {
            try {
                const formData = this.convertProductToApiData(product)
                const response = await merchantProductApi.createProduct(formData)
                
                if (response.success && response.data) {
                    const newProduct = this.convertApiProductToProduct(response.data)
                    this.products.push(newProduct)
                    return newProduct
                } else {
                    throw new Error(response.message || '创建商品失败')
                }
            } catch (error) {
                console.error('添加商品失败:', error)
                throw error
            }
        },

        async updateProduct(id: number, data: Partial<Product>) {
            try {
                const formData = this.convertProductToApiData(data)
                const response = await merchantProductApi.updateProduct(id, formData)
                
                if (response.success && response.data) {
                    const updatedProduct = this.convertApiProductToProduct(response.data)
                    const index = this.products.findIndex(p => p.id === id)
                    if (index > -1) {
                        this.products[index] = updatedProduct
                    }
                } else {
                    throw new Error(response.message || '更新商品失败')
                }
            } catch (error) {
                console.error('更新商品失败:', error)
                throw error
            }
        },

        async toggleProductStatus(id: number) {
            try {
                const response = await merchantProductApi.toggleProductStatus(id)
                
                if (response.success && response.data) {
                    const product = this.products.find(p => p.id === id)
                    if (product) {
                        product.status = response.data.status
                    }
                } else {
                    throw new Error(response.message || '操作失败')
                }
            } catch (error) {
                console.error('切换商品状态失败:', error)
                throw error
            }
        },

        async deleteProduct(id: number) {
            try {
                const response = await merchantProductApi.deleteProduct(id)
                
                if (response.success) {
                    const index = this.products.findIndex(p => p.id === id)
                    if (index > -1) {
                        this.products.splice(index, 1)
                    }
                } else {
                    throw new Error(response.message || '删除商品失败')
                }
            } catch (error) {
                console.error('删除商品失败:', error)
                throw error
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
