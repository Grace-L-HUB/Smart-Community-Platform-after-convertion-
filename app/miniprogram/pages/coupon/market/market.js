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
        console.log('优惠券数据:', res.data)
        if (res.statusCode === 200 && (res.data.code === 200 || res.data.success === true)) {
          // 格式化日期
          const coupons = (res.data.data || []).map(item => {
            // 处理 startDate - 支持驼峰和蛇形命名
            const startDate = item.startDate || item.start_date
            const endDate = item.endDate || item.end_date

            return {
              ...item,
              startDate: startDate ? this.formatDate(startDate) : '',
              endDate: endDate ? this.formatDate(endDate) : ''
            }
          })

          console.log('优惠券列表:', coupons)
          this.setData({
            coupons: coupons,
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
        console.log('领取优惠券响应:', res.data)
        if (res.statusCode === 200 && (res.data.success === true || res.data.code === 200)) {
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
  },

  // 格式化日期：将 ISO 格式转换为 YYYY-MM-DD
  formatDate(dateStr) {
    if (!dateStr) return ''
    // 去掉 T 和 Z，只保留日期部分
    return dateStr.split('T')[0]
  }
})
