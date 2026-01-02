const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    coupons: [],
    loading: false,
    activeTab: 'valid'
  },

  onLoad() {
    this.loadCoupons()
  },

  onShow() {
    this.loadCoupons()
  },

  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    this.loadCoupons()
  },

  loadCoupons() {
    this.setData({ loading: true })
    
    wx.request({
      url: API_BASE_URL + '/merchant/user/coupons/',
      method: 'GET',
      data: {
        status: this.data.activeTab
      },
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
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

  onUseCoupon(e) {
    const couponId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/shop/product/product`
    })
  },

  onGetMoreCoupons() {
    wx.navigateTo({
      url: '/pages/coupon/market/market'
    })
  },

  onPullDownRefresh() {
    this.loadCoupons()
    wx.stopPullDownRefresh()
  }
})
