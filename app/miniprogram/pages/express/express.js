// pages/express/express.js
const { API_BASE_URL } = require('../../config/api')

Page({
    data: {
        expressList: [],
        loading: false
    },

    onLoad() {
        this.loadExpressList()
    },

    loadExpressList() {
        this.setData({ loading: true })
        
        wx.request({
            url: API_BASE_URL + '/express/',
            method: 'GET',
            header: {
                'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    this.setData({
                        expressList: res.data.data || [],
                        loading: false
                    })
                } else {
                    wx.showToast({ title: res.data.message || '获取快递信息失败', icon: 'none' })
                    this.setData({ loading: false })
                }
            },
            fail: () => {
                wx.showToast({ title: '网络请求失败', icon: 'none' })
                this.setData({ loading: false })
            }
        })
    }
});
