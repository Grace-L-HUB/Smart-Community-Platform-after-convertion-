// pages/payment/payment.js
const { API_BASE_URL } = require('../../config/api')

Page({
    data: {
        bills: [],
        loading: false
    },

    onLoad() {
        this.loadBills()
    },

    loadBills() {
        this.setData({ loading: true })
        
        wx.request({
            url: API_BASE_URL + '/payment/bills/',
            method: 'GET',
            header: {
                'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    this.setData({
                        bills: res.data.data || [],
                        loading: false
                    })
                } else {
                    wx.showToast({ title: '加载失败', icon: 'none' })
                    this.setData({ loading: false })
                }
            },
            fail: () => {
                wx.showToast({ title: '网络错误', icon: 'none' })
                this.setData({ loading: false })
            }
        })
    },

    onPayClick(e) {
        const billId = e.currentTarget.dataset.id
        wx.navigateTo({
            url: '/pages/payment/receipt?id=' + billId
        })
    }
});
