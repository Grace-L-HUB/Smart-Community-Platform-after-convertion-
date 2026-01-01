// pages/profile/home/home.js
const { API_BASE_URL } = require('../../../config/api')

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
            wx.showModal({
                title: '提示',
                content: '请先登录',
                showCancel: false,
                success: () => {
                    wx.reLaunch({
                        url: '/pages/login/login'
                    })
                }
            })
            return null
        }
        return userInfo
    },

    loadUserProfile() {
        const storedUserInfo = this.getStoredUserInfo()
        if (!storedUserInfo) return

        this.setData({ loading: true, error: null })

        wx.request({
            url: `${API_BASE_URL}/profile`,
            method: 'GET',
            data: {
                user_id: storedUserInfo.user_id
            },
            header: {
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
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

    goToEditProfile() {
        wx.navigateTo({
            url: '/pages/profile/edit/edit'
        });
    }
});
