const API_BASE_URL = require('../../config/api.js').API_BASE_URL

Page({
  data: {
    coupons: [],
    loading: false
  },

  onLoad() {
    this.loadCoupons()
  },

  loadCoupons() {
    this.setData({ loading: true })
    
    wx.request({
      url: API_BASE_URL + '/coupons/market/',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            coupons: res.data.data || [],
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

  onReceiveCoupon(e) {
    const couponId = e.currentTarget.dataset.id
    wx.request({
      url: API_BASE_URL + '/coupons/' + couponId + '/receive/',
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '领取成功',
            icon: 'success'
          })
          this.loadCoupons()
        }
      }
    })
  },

  onPullDownRefresh() {
    this.loadCoupons()
    wx.stopPullDownRefresh()
  }
})
