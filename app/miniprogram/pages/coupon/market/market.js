const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

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
      url: API_BASE_URL + '/merchant/coupons/public/',
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
        } else {
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

  onReceiveCoupon(e) {
    const couponId = e.currentTarget.dataset.id
    wx.request({
      url: API_BASE_URL + '/merchant/coupons/receive/',
      method: 'POST',
      data: {
        coupon_id: couponId
      },
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
        } else {
          wx.showToast({
            title: res.data.message || '领取失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  },

  onPullDownRefresh() {
    this.loadCoupons()
    wx.stopPullDownRefresh()
  },

  onViewMyCoupons() {
    wx.navigateTo({
      url: '/pages/coupon/list/list'
    })
  }
})
