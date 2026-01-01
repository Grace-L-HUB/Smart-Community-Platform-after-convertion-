/**
 * auth store 测试
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../auth'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock as any

// Mock merchant API
vi.mock('@/services/merchant', () => ({
  merchantLoginApi: {
    login: vi.fn()
  }
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // 重置 localStorage mock 的实现，避免测试间的状态污染
    localStorageMock.getItem.mockReset()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('初始状态', () => {
    it('未登录时应该有正确的初始状态', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const auth = useAuthStore()

      expect(auth.token).toBeNull()
      expect(auth.user).toBeNull()
      expect(auth.isLoggedIn).toBe(false)
    })

    it('从localStorage恢复登录状态', () => {
      const mockToken = 'test-token-123'
      const mockUser = {
        id: 1,
        username: 'testuser',
        name: '测试用户',
        role: 'property' as const,
      }

      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'token') return mockToken
        if (key === 'user') return JSON.stringify(mockUser)
        return null
      })

      const auth = useAuthStore()

      expect(auth.token).toBe(mockToken)
      expect(auth.user).toEqual(mockUser)
      expect(auth.isLoggedIn).toBe(true)
    })
  })

  describe('Getters', () => {
    it('userRole应该返回用户的角色', () => {
      const auth = useAuthStore()
      auth.user = {
        id: 1,
        username: 'test',
        name: '测试',
        role: 'property',
      }

      expect(auth.userRole).toBe('property')
    })

    it('userName应该优先返回name，其次返回username', () => {
      const auth = useAuthStore()

      // 有name时
      auth.user = {
        id: 1,
        username: 'testuser',
        name: '张三',
        role: 'property',
      }
      expect(auth.userName).toBe('张三')

      // 没有name时
      auth.user = {
        id: 1,
        username: 'testuser',
        name: '',
        role: 'property',
      }
      expect(auth.userName).toBe('testuser')
    })
  })

  describe('Actions - 登录', () => {
    it('物业端登录应该成功', async () => {
      const auth = useAuthStore()

      const result = await auth.login('admin', '123456', 'property')

      expect(result.success).toBe(true)
      expect(auth.isLoggedIn).toBe(true)
      expect(auth.token).toBeTruthy()
      expect(auth.user).toEqual({
        id: 1,
        username: 'admin',
        name: '物业管理员',
        role: 'property',
        avatar: 'https://picsum.photos/seed/admin/100/100',
      })
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', expect.any(String))
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', expect.any(String))
    })

    it('商户端登录成功', async () => {
      const { merchantLoginApi } = await import('@/services/merchant')
      vi.mocked(merchantLoginApi.login).mockResolvedValue({
        success: true,
        data: {
          token: 'merchant-token-123',
          user: {
            id: 2,
            username: 'merchant1',
            name: '商户张三',
            avatar: 'https://example.com/avatar.jpg',
          }
        }
      })

      const auth = useAuthStore()
      const result = await auth.login('merchant1', 'password', 'merchant')

      expect(result.success).toBe(true)
      expect(auth.isLoggedIn).toBe(true)
      expect(auth.user).toEqual({
        id: 2,
        username: 'merchant1',
        name: '商户张三',
        role: 'merchant',
        avatar: 'https://example.com/avatar.jpg',
      })
    })

    it('商户端登录失败', async () => {
      const { merchantLoginApi } = await import('@/services/merchant')
      vi.mocked(merchantLoginApi.login).mockResolvedValue({
        success: false,
        message: '用户名或密码错误'
      })

      const auth = useAuthStore()
      const result = await auth.login('wrong', 'wrong', 'merchant')

      expect(result.success).toBe(false)
      expect(result.message).toBe('用户名或密码错误')
    })
  })

  describe('Actions - 登出', () => {
    it('登出应该清除所有状态', () => {
      const auth = useAuthStore()
      auth.token = 'test-token'
      auth.user = { id: 1, username: 'test', name: '测试', role: 'property' }
      auth.isLoggedIn = true

      auth.logout()

      expect(auth.token).toBeNull()
      expect(auth.user).toBeNull()
      expect(auth.isLoggedIn).toBe(false)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
    })
  })

  describe('Actions - 检查认证状态', () => {
    it('有token和user时应该返回true', () => {
      const auth = useAuthStore()
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token'
        if (key === 'user') return JSON.stringify({ id: 1, username: 'test' })
        return null
      })

      const result = auth.checkAuth()

      expect(result).toBe(true)
      expect(auth.isLoggedIn).toBe(true)
    })

    it('没有token时应该返回false', () => {
      const auth = useAuthStore()
      localStorageMock.getItem.mockReturnValue(null)

      const result = auth.checkAuth()

      expect(result).toBe(false)
      expect(auth.isLoggedIn).toBe(false)
    })
  })
})
