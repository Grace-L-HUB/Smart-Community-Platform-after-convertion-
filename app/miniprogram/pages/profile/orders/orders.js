const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    orders: [],
    loading: false,
    activeTab: 'all'
  },

  onLoad() {
    this.loadOrders()
  },

  onShow() {
    this.loadOrders()
  },

  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    this.loadOrders()
  },

  loadOrders() {
    this.setData({ loading: true })

    const token = wx.getStorageSync('token')
    if (!token) {
      this.setData({ loading: false })
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    wx.request({
      url: API_BASE_URL + '/merchant/user/orders/',
      method: 'GET',
      data: {
        status: this.data.activeTab !== 'all' ? this.data.activeTab : ''
      },
      header: {
        'Authorization': 'Bearer ' + token
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          this.setData({
            orders: res.data.data.items || [],
            loading: false
          })
        } else {
          this.setData({ loading: false })
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  },

  onOrderClick(e) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/order/detail/detail?id=' + orderId
    })
  },

  onCancelOrder(e) {
    const orderId = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: API_BASE_URL + '/merchant/user/orders/' + orderId + '/',
            method: 'POST',
            header: {
              'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
              if (res.statusCode === 200 && res.data.success) {
                wx.showToast({
                  title: '取消成功',
                  icon: 'success'
                })
                this.loadOrders()
              } else {
                wx.showToast({
                  title: res.data.message || '取消失败',
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
        }
      }
    })
  },

  onPullDownRefresh() {
    this.loadOrders()
    wx.stopPullDownRefresh()
  }
})
