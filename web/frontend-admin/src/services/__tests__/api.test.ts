/**
 * API 服务测试
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { apiClient, ApiResponse } from '../api'

// Mock fetch
global.fetch = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock as any

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('GET 请求', () => {
    it('应该发送GET请求并返回数据', async () => {
      const mockResponse: ApiResponse = {
        success: true,
        message: '成功',
        data: { id: 1, name: '测试数据' }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await apiClient.get('/test')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('应该正确处理查询参数', async () => {
      const mockResponse: ApiResponse = { success: true, message: '成功' }
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response)

      await apiClient.get('/test', { page: 1, size: 10 })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1&size=10'),
        expect.any(Object)
      )
    })
  })

  describe('POST 请求', () => {
    it('应该发送POST请求并返回数据', async () => {
      const mockResponse: ApiResponse = {
        success: true,
        message: '创建成功',
        data: { id: 1 }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const requestData = { name: '测试', value: 123 }
      const result = await apiClient.post('/test', requestData)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData)
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('PUT 请求', () => {
    it('应该发送PUT请求并返回数据', async () => {
      const mockResponse: ApiResponse = {
        success: true,
        message: '更新成功',
        data: { id: 1, name: '更新后的名称' }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const requestData = { name: '更新后的名称' }
      const result = await apiClient.put('/test/1', requestData)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestData)
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('PATCH 请求', () => {
    it('应该发送PATCH请求并返回数据', async () => {
      const mockResponse: ApiResponse = {
        success: true,
        message: '部分更新成功',
        data: { id: 1, status: 'active' }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const requestData = { status: 'active' }
      const result = await apiClient.patch('/test/1', requestData)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(requestData)
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('DELETE 请求', () => {
    it('应该发送DELETE请求并返回数据', async () => {
      const mockResponse: ApiResponse = {
        success: true,
        message: '删除成功'
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await apiClient.delete('/test/1')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'DELETE'
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('错误处理', () => {
    it('应该处理HTTP错误响应', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: '资源不存在' })
      } as Response)

      await expect(apiClient.get('/not-found')).rejects.toThrow('HTTP 404')
    })

    it('应该处理网络错误', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      await expect(apiClient.get('/test')).rejects.toThrow('Network error')
    })
  })

  describe('认证Token', () => {
    it('有token时应该在请求头中添加Authorization', async () => {
      localStorageMock.getItem.mockReturnValue('test-token-123')

      const mockResponse: ApiResponse = { success: true, message: '成功' }
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response)

      await apiClient.get('/protected')

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123'
          })
        })
      )
    })

    it('没有token时不应该添加Authorization头', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const mockResponse: ApiResponse = { success: true, message: '成功' }
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response)

      await apiClient.get('/public')

      const fetchCall = vi.mocked(fetch).mock.calls[0]
      const headers = fetchCall[1]?.headers as Record<string, string>
      expect(headers?.['Authorization']).toBeUndefined()
    })
  })
})
