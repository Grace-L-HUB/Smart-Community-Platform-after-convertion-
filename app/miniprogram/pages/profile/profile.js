// pages/profile/profile.js
const { API_BASE_URL } = require('../../config/api')
const API_AUTH_URL = API_BASE_URL + '/auth'
const API_UPLOAD_URL = API_BASE_URL + '/upload'

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
        this.loadUserProfile()
    },

    getStoredUserInfo() {
        const userInfo = wx.getStorageSync('userInfo')
        if (!userInfo || !userInfo.user_id) {
            return null
        }
        return userInfo
    },

    loadUserProfile() {
        const storedUserInfo = this.getStoredUserInfo()
        this.setData({ loading: true, error: null })

        if (!storedUserInfo) {
            this.setData({
                userInfo: null,
                loading: false
            })
            return
        }

        wx.request({
            url: API_BASE_URL + '/profile',
            method: 'GET',
            data: {
                user_id: storedUserInfo.user_id
            },
            header: {
                'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
                console.log('用户信息请求成功:', res.data)
                if (res.statusCode === 200 && res.data.code === 200) {
                    const userInfo = res.data.data
                    if (userInfo.avatar_url) {
                        userInfo.avatar_url = userInfo.avatar_url
                    } else {
                        userInfo.avatar_url = 'https://img.yzcdn.cn/vant/cat.jpeg'
                    }

                    this.setData({
                        userInfo: userInfo,
                        loading: false
                    })

                    const updatedStoredInfo = Object.assign({}, storedUserInfo, userInfo)
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

    onRefresh() {
        this.loadUserProfile()
    },

    goToPersonalHome() {
        wx.navigateTo({
            url: '/pages/profile/home/home'
        });
    },

    goToEditProfile() {
        wx.navigateTo({
            url: '/pages/profile/edit/edit'
        });
    },

    onAbout() {
        wx.showModal({
            title: '关于我们',
            content: '智慧社区小程序 v1.0.0\n为社区居民提供便捷的物业服务',
            showCancel: false
        });
    },

    logout() {
        wx.showModal({
            title: '确认退出',
            content: '确定要退出登录吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.clearStorageSync()
                    wx.reLaunch({
                        url: '/pages/login/login'
                    })
                }
            }
        })
    }
});
