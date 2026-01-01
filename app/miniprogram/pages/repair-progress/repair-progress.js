const { API_BASE_URL } = require('../../config/api')

Page({
    data: {
        repairs: [],
        loading: false
    },

    onLoad() {
        this.loadRepairs()
    },

    loadRepairs() {
        const userInfo = wx.getStorageSync('userInfo')
        if (!userInfo || !userInfo.user_id) {
            wx.showToast({ title: '请先登录', icon: 'none' })
            return
        }

        this.setData({ loading: true })

        wx.request({
            url: API_BASE_URL + '/property/repair-orders',
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
                        repairs: res.data.data.list || [],
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
    }
});
