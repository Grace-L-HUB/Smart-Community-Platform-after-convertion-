// pages/qrcode/qrcode.js
const { API_BASE_URL } = require('../../config/api')

Page({
    data: {
        type: '',
        qrCodeUrl: '',
        loading: true
    },

    onLoad(options) {
        const type = options.type || 'identity'
        this.setData({ type: type })
        
        if (type === 'identity') {
            this.loadIdentityQRCode()
        } else if (type === 'house') {
            this.loadHouseQRCode()
        }
    },

    loadIdentityQRCode() {
        const userInfo = wx.getStorageSync('userInfo')
        if (!userInfo || !userInfo.user_id) {
            wx.showModal({
                title: '提示',
                content: '请先登录',
                showCancel: false,
                success: () => {
                    wx.reLaunch({ url: '/pages/login/login' })
                }
            })
            return
        }

        wx.request({
            url: API_BASE_URL + '/qrcode/identity',
            method: 'GET',
            data: {
                user_id: userInfo.user_id
            },
            header: {
                'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    this.setData({
                        qrCodeUrl: res.data.data.qrcode_url,
                        loading: false
                    })
                } else {
                    wx.showToast({ title: res.data.message || '获取二维码失败', icon: 'none' })
                    this.setData({ loading: false })
                }
            },
            fail: () => {
                wx.showToast({ title: '网络请求失败', icon: 'none' })
                this.setData({ loading: false })
            }
        })
    },

    loadHouseQRCode() {
        wx.showToast({ title: '功能开发中', icon: 'none' })
    },

    onShareAppMessage() {
        return {
            title: '智慧社区',
            path: '/pages/index/index'
        }
    }
});
