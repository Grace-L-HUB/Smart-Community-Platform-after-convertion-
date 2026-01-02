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
          const data = res.data.data || {}
          this.setData({
            announcement: data,
            title: data.title || '',
            content: data.content || '',
            category: data.category_text || '',
            publishTime: data.published_at || data.created_at || '',
            views: data.read_count || 0,
            publisher: data.author || '',
            isTop: false,
            attachments: [],
            loading: false
          })
        } else {
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none'
          })
          this.setData({ loading: false })
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
