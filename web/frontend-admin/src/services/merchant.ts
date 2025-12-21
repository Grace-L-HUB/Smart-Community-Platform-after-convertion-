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