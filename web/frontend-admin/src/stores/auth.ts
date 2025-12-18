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
        login(username: string, _password: string, role: UserRole) {
            // Mock 登录逻辑
            const mockUsers: Record<UserRole, User> = {
                property: {
                    id: 1,
                    username,
                    name: '物业管理员',
                    role: 'property',
                    avatar: 'https://picsum.photos/seed/admin/100/100',
                },
                merchant: {
                    id: 2,
                    username,
                    name: '商户管理员',
                    role: 'merchant',
                    avatar: 'https://picsum.photos/seed/shop/100/100',
                },
            }

            const user = mockUsers[role]
            const token = `mock-token-${Date.now()}`

            this.token = token
            this.user = user
            this.isLoggedIn = true

            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))

            return { success: true, user, token }
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
