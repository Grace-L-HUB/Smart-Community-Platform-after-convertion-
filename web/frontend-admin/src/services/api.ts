// API 基础服务配置
const API_BASE_URL = 'http://139.224.17.154:8000/api'

// 请求响应接口
interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

// HTTP 请求工具类
class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    // 获取认证token
    const token = localStorage.getItem('token')
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      // 兼容后端返回格式：success=True 或 code=200 表示成功
      if (result.success === true || result.code === 200) {
        return {
          success: true,
          message: result.message || '操作成功',
          data: result.data
        }
      } else {
        return {
          success: false,
          message: result.message || '操作失败',
          data: undefined
        }
      }
    } catch (error) {
      console.error('API请求失败:', error)
      throw error
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params).toString()}` : endpoint
    return this.request<T>(url, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// 创建 API 客户端实例
export const apiClient = new ApiClient(API_BASE_URL)

// 导出 API 基础 URL 供其他地方使用
export { API_BASE_URL }

// 导出类型
export type { ApiResponse }