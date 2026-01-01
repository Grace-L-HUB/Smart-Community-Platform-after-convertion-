const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    event: {},
    loading: false
  },

  onLoad(options) {
    if (options.id) {
      this.loadEventDetail(options.id)
    }
  },

  loadEventDetail(id) {
    this.setData({ loading: true })
    
    wx.request({
      url: API_BASE_URL + '/community/events/' + id + '/',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            event: res.data.data || {},
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

  onJoinEvent() {
    const eventId = this.data.event.id
    wx.request({
      url: API_BASE_URL + '/community/events/' + eventId + '/join/',
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '报名成功',
            icon: 'success'
          })
          this.loadEventDetail(eventId)
        }
      }
    })
  },

  onShare() {
    wx.showShareMenu({
      withShareTicket: true
    })
  }
})
