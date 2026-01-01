const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    announcements: [],
    loading: false
  },

  onLoad() {
    this.loadAnnouncements()
  },

  loadAnnouncements() {
    this.setData({ loading: true })
    
    wx.request({
      url: API_BASE_URL + '/property/announcements',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            announcements: res.data.data || [],
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

  onAnnouncementClick(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/services/announcement-detail/announcement-detail?id=' + id
    })
  },

  onPullDownRefresh() {
    this.loadAnnouncements()
    wx.stopPullDownRefresh()
  }
})
