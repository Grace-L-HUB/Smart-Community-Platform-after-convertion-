// pages/profile/profile.ts
import { API_BASE_URL } from '../../config/api'
const API_AUTH_URL = 'http://139.224.17.154:8000/api/auth'
const API_UPLOAD_URL = 'http://139.224.17.154:8000/api/upload'

Page({
    data: {
        userInfo: null,
        loading: true,
        error: null
    },

    onLoad() {
        this.loadUserProfile()
    },

    onShow() {
        // 每次显示页面时重新加载用户信息，以防信息更新
        this.loadUserProfile()
    },

    // 从本地存储获取用户基本信息
    getStoredUserInfo() {
        const userInfo = wx.getStorageSync('userInfo')
        if (!userInfo || !userInfo.user_id) {
            // 没有用户信息，返回null，但不强制跳转
            return null
        }
        return userInfo
    },

    // 从后端API获取完整的用户信息
    loadUserProfile() {
        const storedUserInfo = this.getStoredUserInfo()
        this.setData({ loading: true, error: null })

        if (!storedUserInfo) {
            // 没有用户信息，显示默认状态
            this.setData({
                userInfo: null,
                loading: false
            })
            return
        }

        wx.request({
            url: `${API_BASE_URL}/profile`,
            method: 'GET',
            data: {
                user_id: storedUserInfo.user_id
            },
            header: {
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
            },
            success: (res: any) => {
                console.log('用户信息请求成功:', res.data)
                if (res.statusCode === 200 && res.data.code === 200) {
                    const userInfo = res.data.data
                    // 使用后端返回的avatar_url字段，如果没有则使用默认头像
                    if (userInfo.avatar_url) {
                        // 后端已经返回了完整的URL，直接使用
                        userInfo.avatar_url = userInfo.avatar_url
                    } else {
                        // 如果没有avatar_url，使用默认头像
                        userInfo.avatar_url = 'https://img.yzcdn.cn/vant/cat.jpeg'
                    }

                    this.setData({
                        userInfo: userInfo,
                        loading: false
                    })

                    // 更新本地存储的用户信息
                    const updatedStoredInfo = { ...storedUserInfo, ...userInfo }
                    wx.setStorageSync('userInfo', updatedStoredInfo)
                } else {
                    console.error('获取用户信息失败:', res.data.message)
                    this.setData({
                        error: res.data.message || '获取用户信息失败',
                        loading: false
                    })
                }
            },
            fail: (err) => {
                console.error('网络请求失败:', err)
                this.setData({
                    error: '网络请求失败，请检查网络连接',
                    loading: false
                })

                // 网络失败时，使用本地存储的基本信息作为备用
                if (storedUserInfo) {
                    this.setData({
                        userInfo: {
                            display_name: storedUserInfo.nickname || storedUserInfo.phone || '用户',
                            id: storedUserInfo.user_id,
                            avatar_url: storedUserInfo.avatar || 'https://img.yzcdn.cn/vant/cat.jpeg',
                            role: storedUserInfo.role || 0
                        }
                    })
                }
            }
        })
    },

    // 重新加载用户信息
    onRefresh() {
        this.loadUserProfile()
    },

    // 跳转到个人主页页面
    goToPersonalHome() {
        wx.navigateTo({
            url: '/pages/profile/home/home'
        });
    },

    // 跳转到个人信息编辑页面
    goToEditProfile() {
        wx.navigateTo({
            url: '/pages/profile/edit/edit'
        });
    },

    // 关于我们
    onAbout() {
        wx.showModal({
            title: '关于我们',
            content: '智慧社区小程序 v1.0.0\n为社区居民提供便捷的物业服务',
            showCancel: false
        });
    },

    // 退出登录
    logout() {
        wx.showModal({
            title: '确认退出',
            content: '确定要退出登录吗？',
            success: (res) => {
                if (res.confirm) {
                    // 清除本地存储
                    wx.clearStorageSync()
                    wx.reLaunch({
                        url: '/pages/login/login'
                    })
                }
            }
        })
    }
});
