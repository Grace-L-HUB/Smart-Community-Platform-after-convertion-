const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    houseInfo: {},
    loading: false
  },

  onLoad() {
    this.loadHouseInfo()
  },

  loadHouseInfo() {
    this.setData({ loading: true })
    
    wx.request({
      url: `${API_BASE_URL}/house/info/`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            houseInfo: res.data.data || {},
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
    this.loadHouseInfo()
  }
})
