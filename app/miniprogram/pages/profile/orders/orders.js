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
    
    wx.request({
      url: API_BASE_URL + '/orders/',
      method: 'GET',
      data: {
        status: this.data.activeTab !== 'all' ? this.data.activeTab : ''
      },
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            orders: res.data.data || [],
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
            url: API_BASE_URL + '/orders/' + orderId + '/cancel/',
            method: 'POST',
            header: {
              'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
              if (res.statusCode === 200) {
                wx.showToast({
                  title: '取消成功',
                  icon: 'success'
                })
                this.loadOrders()
              }
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
