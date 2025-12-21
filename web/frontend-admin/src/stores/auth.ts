// 认证 Store
import { defineStore } from 'pinia'

export type UserRole = 'property' | 'merchant'

export interface User {
    id: number
    username: string
    name: string
    role: UserRole
    avatar?: string
}

interface AuthState {
    token: string | null
    user: User | null
    isLoggedIn: boolean
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        token: localStorage.getItem('token'),
        user: JSON.parse(localStorage.getItem('user') || 'null'),
        isLoggedIn: !!localStorage.getItem('token'),
    }),

    getters: {
        userRole: (state) => state.user?.role,
        userName: (state) => state.user?.name || state.user?.username,
    },

    actions: {
        async login(username: string, password: string, role: UserRole) {
            if (role === 'property') {
                // 物业端使用Mock登录
                const user: User = {
                    id: 1,
                    username,
                    name: '物业管理员',
                    role: 'property',
                    avatar: 'https://picsum.photos/seed/admin/100/100',
                }
                
                const token = `mock-token-${Date.now()}`

                this.token = token
                this.user = user
                this.isLoggedIn = true

                localStorage.setItem('token', token)
                localStorage.setItem('user', JSON.stringify(user))

                return { success: true, user, token }
            } else {
                // 商户端使用真实API登录
                try {
                    const { merchantLoginApi } = await import('@/services/merchant')
                    const response = await merchantLoginApi.login({ username, password })
                    
                    if (response.success && response.data) {
                        const { token, user: userData } = response.data
                        
                        const user: User = {
                            id: userData.id,
                            username: userData.username,
                            name: userData.name,
                            role: 'merchant' as UserRole,
                            avatar: userData.avatar,
                        }

                        this.token = token
                        this.user = user
                        this.isLoggedIn = true

                        localStorage.setItem('token', token)
                        localStorage.setItem('user', JSON.stringify(user))

                        return { success: true, user, token }
                    } else {
                        return { 
                            success: false, 
                            message: response.message || '登录失败' 
                        }
                    }
                } catch (error) {
                    console.error('商户登录失败:', error)
                    return { 
                        success: false, 
                        message: '登录失败，请检查网络连接' 
                    }
                }
            }
        },

        logout() {
            this.token = null
            this.user = null
            this.isLoggedIn = false

            localStorage.removeItem('token')
            localStorage.removeItem('user')
        },

        // 检查并恢复登录状态
        checkAuth() {
            const token = localStorage.getItem('token')
            const user = JSON.parse(localStorage.getItem('user') || 'null')

            if (token && user) {
                this.token = token
                this.user = user
                this.isLoggedIn = true
                return true
            }
            return false
        },
    },
})
