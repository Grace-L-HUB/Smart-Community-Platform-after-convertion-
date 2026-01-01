const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    item: {},
    loading: false,
    quantity: 1
  },

  onLoad(options) {
    if (options.id) {
      this.loadItemDetail(options.id)
    }
  },

  loadItemDetail(id) {
    this.setData({ loading: true })
    
    wx.request({
      url: API_BASE_URL + '/market-items/' + id + '/',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            item: res.data.data || {},
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

  onQuantityChange(e) {
    this.setData({
      quantity: parseInt(e.detail.value) || 1
    })
  },

  onDecrease() {
    if (this.data.quantity > 1) {
      this.setData({
        quantity: this.data.quantity - 1
      })
    }
  },

  onIncrease() {
    this.setData({
      quantity: this.data.quantity + 1
    })
  },

  onContact() {
    const item = this.data.item
    if (item.seller_phone) {
      wx.makePhoneCall({
        phoneNumber: item.seller_phone
      })
    }
  },

  onShare() {
    wx.showShareMenu({
      withShareTicket: true
    })
  }
})
