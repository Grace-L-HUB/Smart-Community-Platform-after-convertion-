const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    product: {},
    loading: false,
    quantity: 1,
    selectedSpec: {}
  },

  onLoad(options) {
    if (options.id) {
      this.loadProductDetail(options.id)
    }
  },

  loadProductDetail(id) {
    this.setData({ loading: true })
    
    wx.request({
      url: `${API_BASE_URL}/shop/products/${id}/`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            product: res.data.data || {},
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

  onSpecChange(e) {
    const spec = e.currentTarget.dataset.spec
    this.setData({
      selectedSpec: spec
    })
  },

  onAddToCart() {
    const { product, quantity, selectedSpec } = this.data
    
    wx.request({
      url: `${API_BASE_URL}/shop/cart/`,
      method: 'POST',
      data: {
        product_id: product.id,
        quantity,
        spec: selectedSpec
      },
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '已加入购物车',
            icon: 'success'
          })
        }
      }
    })
  },

  onBuyNow() {
    const { product, quantity, selectedSpec } = this.data
    
    wx.navigateTo({
      url: `/pages/order/create/create?type=shop&productId=${product.id}&quantity=${quantity}`
    })
  },

  onShare() {
    wx.showShareMenu({
      withShareTicket: true
    })
  }
})
