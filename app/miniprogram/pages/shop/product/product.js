const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    products: [],
    loading: false,
    category: 'all'
  },

  onLoad() {
    this.loadProducts()
  },

  onCategoryChange(e) {
    this.setData({
      category: e.currentTarget.dataset.category
    })
    this.loadProducts()
  },

  loadProducts() {
    this.setData({ loading: true })
    
    wx.request({
      url: `${API_BASE_URL}/shop/products/`,
      method: 'GET',
      data: {
        category: this.data.category !== 'all' ? this.data.category : ''
      },
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            products: res.data.data || [],
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

  onProductClick(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/shop/detail/detail?id=${id}`
    })
  },

  onPullDownRefresh() {
    this.loadProducts()
    wx.stopPullDownRefresh()
  }
})
