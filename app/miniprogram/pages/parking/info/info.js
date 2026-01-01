const API_BASE_URL = require('../../config/api.js').API_BASE_URL

Page({
  data: {
    parkingInfo: {},
    loading: false
  },

  onLoad() {
    this.loadParkingInfo()
  },

  loadParkingInfo() {
    this.setData({ loading: true })
    
    wx.request({
      url: `${API_BASE_URL}/parking/info/`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            parkingInfo: res.data.data || {},
            loading: false
          })
        }
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    })
  },

  onRefresh() {
    this.loadParkingInfo()
  }
})
