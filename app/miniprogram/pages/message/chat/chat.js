const API_BASE_URL = require('../../config/api.js').API_BASE_URL

Page({
  data: {
    messages: [],
    inputContent: '',
    loading: false
  },

  onLoad(options) {
    if (options.userId) {
      this.setData({ userId: options.userId })
      this.loadMessages()
    }
  },

  onShow() {
    this.loadMessages()
  },

  loadMessages() {
    this.setData({ loading: true })
    
    wx.request({
      url: `${API_BASE_URL}/messages/${this.data.userId}/`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            messages: res.data.data || [],
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

  onInputChange(e) {
    this.setData({
      inputContent: e.detail.value
    })
  },

  onSend() {
    const { inputContent, userId } = this.data

    if (!inputContent.trim()) {
      wx.showToast({
        title: '请输入消息内容',
        icon: 'none'
      })
      return
    }

    wx.request({
      url: `${API_BASE_URL}/messages/send/`,
      method: 'POST',
      data: {
        receiver_id: userId,
        content: inputContent
      },
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            inputContent: ''
          })
          this.loadMessages()
        }
      }
    })
  }
})
