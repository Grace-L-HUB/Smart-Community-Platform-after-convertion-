const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    coupons: [],
    loading: false,
    activeTab: 0,  // 使用索引而不是状态字符串
    currentStatus: 'valid',  // 实际的查询状态
    tabs: [
      { status: 'valid', title: '可使用' },
      { status: 'used', title: '已使用' },
      { status: 'expired', title: '已过期' }
    ]
  },

  onLoad() {
    this.loadCoupons()
  },

  onShow() {
    this.loadCoupons()
  },

  onTabChange(e) {
    // van-tabs 的 change 事件返回的是索引
    const index = e.detail.index
    const tab = this.data.tabs[index]
    this.setData({
      activeTab: index,
      currentStatus: tab.status
    })
    this.loadCoupons()
  },

  loadCoupons() {
    this.setData({ loading: true })

    wx.request({
      url: API_BASE_URL + '/merchant/user/coupons/',
      method: 'GET',
      data: {
        status: this.data.currentStatus
      },
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res) => {
        console.log('我的优惠券数据:', res.data)
        console.log('第一张优惠券详情:', res.data.data?.[0])
        if (res.statusCode === 200 && (res.data.code === 200 || res.data.success === true)) {
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

  onUseCoupon(e) {
    // 获取商户ID
    const merchantId = e.currentTarget.dataset.merchantId
    wx.navigateTo({
      url: `/pages/shop/detail/detail?id=${merchantId}`
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
