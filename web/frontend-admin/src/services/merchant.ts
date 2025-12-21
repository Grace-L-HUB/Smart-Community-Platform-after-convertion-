import { apiClient, type ApiResponse } from './api'

const API_BASE_URL = 'http://127.0.0.1:8000/api'

// 商户申请接口
export interface MerchantApplication {
  id?: number
  username?: string
  password?: string
  phone?: string
  shop_name: string
  shop_category: string
  shop_phone: string
  shop_address: string
  shop_description: string
  business_hours_start: string
  business_hours_end: string
  legal_name: string
  legal_id_card: string
  legal_phone: string
  business_license?: File
  identity_card_front?: File
  identity_card_back?: File
  status?: 'pending' | 'approved' | 'rejected'
  created_at?: string
  updated_at?: string
}

// 商户档案接口
export interface MerchantProfile {
  id: number
  user: number
  user_info: {
    id: number
    username: string
    display_name: string
    phone: string
  }
  shop_name: string
  shop_logo?: string
  shop_category: string
  category_display: string
  shop_phone: string
  shop_address: string
  shop_description: string
  shop_announcement: string
  business_hours_start: string
  business_hours_end: string
  is_active: boolean
  total_orders: number
  total_revenue: string
  created_at: string
  updated_at: string
}

// 商户申请API
export const merchantApplicationApi = {
  // 提交商户申请
  async submit(data: FormData): Promise<{
    success: boolean
    message: string
    data?: MerchantApplication
  }> {
    const response = await fetch(`${API_BASE_URL}/merchant/application/`, {
      method: 'POST',
      body: data,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    return response.json()
  },

  // 获取当前用户的申请记录
  async getMyApplications(): Promise<ApiResponse<MerchantApplication[]>> {
    return apiClient.get('/merchant/application/')
  },

  // 获取所有申请列表（物业端）
  async getApplicationList(params?: {
    status?: string
    page?: number
    page_size?: number
  }): Promise<ApiResponse<{
    items: MerchantApplication[]
    total: number
    page: number
    page_size: number
    total_pages: number
  }>> {
    return apiClient.get('/merchant/applications/', params)
  },

  // 审核申请（物业端）
  async reviewApplication(
    applicationId: number, 
    data: { status: 'approved' | 'rejected', review_comment?: string }
  ): Promise<ApiResponse<MerchantApplication>> {
    return apiClient.post(`/merchant/applications/${applicationId}/review/`, data)
  }
}

// 商户档案API
export const merchantProfileApi = {
  // 获取商户档案
  async getProfile(): Promise<ApiResponse<MerchantProfile>> {
    return apiClient.get('/merchant/profile/')
  },

  // 更新商户档案
  async updateProfile(data: FormData): Promise<{
    success: boolean
    message: string
    data?: MerchantProfile
  }> {
    const response = await fetch(`${API_BASE_URL}/merchant/profile/`, {
      method: 'PUT',
      body: data,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    return response.json()
  }
}

// 商户登录API
export const merchantLoginApi = {
  // 商户登录
  async login(data: {
    username: string
    password: string
  }): Promise<{
    success: boolean
    message: string
    data?: {
      token: string
      user: {
        id: number
        username: string
        name: string
        role: string
        avatar?: string
        phone?: string
        shop_name?: string
      }
    }
  }> {
    const response = await fetch(`${API_BASE_URL}/merchant/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    return response.json()
  }
}

// 商户注册API
export const merchantRegisterApi = {
  // 注册新商户账号并提交申请
  async register(data: FormData): Promise<{
    success: boolean
    message: string
    data?: { 
      user: any
      application: MerchantApplication 
    }
  }> {
    const response = await fetch(`${API_BASE_URL}/merchant/register/`, {
      method: 'POST',
      body: data
    })
    return response.json()
  }
}

// 商品管理接口
export interface Product {
  id?: number
  name: string
  description: string
  image?: string
  category: string
  price: number
  original_price?: number
  stock: number
  status: 'online' | 'offline'
  sales_count?: number
  service_time_slots?: string[]
  created_at?: string
  updated_at?: string
}

export const merchantProductApi = {
  // 获取商品列表
  async getProducts(params?: {
    category?: string
    status?: string
    keyword?: string
  }): Promise<ApiResponse<Product[]>> {
    return apiClient.get('/merchant/products/', params)
  },

  // 创建商品
  async createProduct(data: FormData): Promise<{
    success: boolean
    message: string
    data?: Product
  }> {
    const response = await fetch(`${API_BASE_URL}/merchant/products/`, {
      method: 'POST',
      body: data,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    return response.json()
  },

  // 获取商品详情
  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return apiClient.get(`/merchant/products/${id}/`)
  },

  // 更新商品
  async updateProduct(id: number, data: FormData): Promise<{
    success: boolean
    message: string
    data?: Product
  }> {
    const response = await fetch(`${API_BASE_URL}/merchant/products/${id}/`, {
      method: 'PUT',
      body: data,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    return response.json()
  },

  // 删除商品
  async deleteProduct(id: number): Promise<{
    success: boolean
    message: string
  }> {
    const response = await fetch(`${API_BASE_URL}/merchant/products/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    return response.json()
  },

  // 切换商品上下架状态
  async toggleProductStatus(id: number): Promise<{
    success: boolean
    message: string
    data?: {
      id: number
      status: 'online' | 'offline'
      status_display: string
    }
  }> {
    const response = await fetch(`${API_BASE_URL}/merchant/products/${id}/toggle-status/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    return response.json()
  }
}

// 订单管理接口
export interface OrderItem {
  id: number
  product: number
  product_name: string
  product_price: number
  quantity: number
  subtotal: number
  specifications?: any
}

export interface Order {
  id: number
  order_no: string
  merchant: number
  merchant_name: string
  user: number
  user_info: {
    id: number
    username: string
    display_name: string
    phone: string
  }
  total_amount: number
  actual_amount: number
  status: 'new' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'refunded'
  status_display: string
  pickup_type: 'pickup' | 'delivery'
  pickup_type_display: string
  contact_name: string
  contact_phone: string
  address?: string
  pickup_code?: string
  used_coupon?: number
  used_coupon_info?: {
    id: number
    name: string
    amount: number
    verification_code: string
  }
  discount_amount: number
  note?: string
  reject_reason?: string
  items: OrderItem[]
  created_at: string
  accepted_at?: string
  completed_at?: string
}

export const merchantOrderApi = {
  // 获取订单列表
  async getOrders(params?: {
    status?: string
    page?: number
    page_size?: number
  }): Promise<ApiResponse<{
    items: Order[]
    total: number
    page: number
    page_size: number
    total_pages: number
  }>> {
    return apiClient.get('/merchant/orders/', params)
  },

  // 获取订单详情
  async getOrder(id: number): Promise<ApiResponse<Order>> {
    return apiClient.get(`/merchant/orders/${id}/`)
  },

  // 更新订单状态
  async updateOrderStatus(id: number, data: {
    status: string
    reject_reason?: string
  }): Promise<ApiResponse<Order>> {
    return apiClient.post(`/merchant/orders/${id}/status/`, data)
  },

  // 验证取餐码
  async verifyPickupCode(pickup_code: string): Promise<{
    success: boolean
    message: string
    data?: {
      order_id: number
      order_no: string
      customer_name: string
      total_amount: number
    }
  }> {
    const response = await fetch(`${API_BASE_URL}/merchant/orders/verify-pickup/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pickup_code })
    })
    return response.json()
  }
}

// 优惠券管理接口
export interface Coupon {
  id: number
  merchant: number
  merchant_name: string
  name: string
  description: string
  coupon_type: 'discount' | 'deduction' | 'gift'
  type_display: string
  amount: number
  min_amount: number
  total_count: number
  used_count: number
  remaining_count: number
  per_user_limit: number
  start_date: string
  end_date: string
  status: 'active' | 'inactive' | 'expired'
  status_display: string
  is_valid: boolean
  created_at: string
  updated_at: string
}

export interface UserCoupon {
  id: number
  coupon: number
  coupon_info: {
    id: number
    name: string
    description: string
    type: string
    type_display: string
    amount: number
    min_amount: number
    start_date: string
    end_date: string
  }
  merchant_info: {
    id: number
    name: string
    logo?: string
  }
  status: 'unused' | 'used' | 'expired'
  status_display: string
  verification_code: string
  is_expired: boolean
  used_at?: string
  received_at: string
}

export const merchantCouponApi = {
  // 获取商户优惠券列表
  async getCoupons(params?: {
    status?: string
    type?: string
  }): Promise<ApiResponse<Coupon[]>> {
    return apiClient.get('/merchant/coupons/', params)
  },

  // 创建优惠券
  async createCoupon(data: Partial<Coupon>): Promise<ApiResponse<Coupon>> {
    return apiClient.post('/merchant/coupons/', data)
  },

  // 核销优惠券
  async verifyCoupon(data: {
    verification_code: string
    order_id?: number
  }): Promise<{
    success: boolean
    message: string
    data?: {
      coupon_id: number
      coupon_name: string
      amount: number
      user_name: string
      verification_code: string
      used_at: string
    }
  }> {
    const response = await fetch(`${API_BASE_URL}/merchant/coupons/verify/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    return response.json()
  }
}

// 小程序端优惠券接口
export const publicCouponApi = {
  // 获取公开优惠券列表
  async getCoupons(merchant_id?: number): Promise<ApiResponse<Coupon[]>> {
    const url = merchant_id 
      ? `/merchant/coupons/public/${merchant_id}/`
      : '/merchant/coupons/public/'
    return apiClient.get(url)
  },

  // 领取优惠券
  async receiveCoupon(coupon_id: number): Promise<ApiResponse<UserCoupon>> {
    return apiClient.post('/merchant/coupons/receive/', { coupon_id })
  },

  // 获取用户优惠券列表
  async getUserCoupons(params?: {
    status?: string
    merchant_id?: number
  }): Promise<ApiResponse<UserCoupon[]>> {
    return apiClient.get('/merchant/user/coupons/', params)
  }
}