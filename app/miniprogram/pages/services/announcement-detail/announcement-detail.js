const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    announcement: {},
    loading: false
  },

  onLoad(options) {
    if (options.id) {
      this.loadAnnouncementDetail(options.id)
    }
  },

  loadAnnouncementDetail(id) {
    this.setData({ loading: true })
    
    wx.request({
      url: API_BASE_URL + '/property/announcements/' + id,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            announcement: res.data.data || {},
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

  onShare() {
    wx.showShareMenu({
      withShareTicket: true
    })
  }
})
