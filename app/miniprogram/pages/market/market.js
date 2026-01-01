// pages/market/market.js
const { API_BASE_URL } = require('../../config/api')

Page({
    data: {
        marketItems: [],
        loading: false
    },

    onLoad() {
        this.loadMarketItems()
    },

    loadMarketItems() {
        this.setData({ loading: true })
        
        wx.request({
            url: API_BASE_URL + '/market-items/',
            method: 'GET',
            header: {
                'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
                if (res.statusCode === 200 && res.data.results) {
                    this.setData({
                        marketItems: res.data.results,
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

    onItemClick(e) {
        const id = e.currentTarget.dataset.id
        wx.navigateTo({
            url: '/pages/community/market-detail/market-detail?id=' + id
        })
    },

    onPostClick() {
        wx.navigateTo({
            url: '/pages/community/post-item/post-item'
        })
    }
});
