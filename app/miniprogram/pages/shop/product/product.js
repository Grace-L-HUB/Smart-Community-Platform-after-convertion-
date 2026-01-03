const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    product: {},
    loading: false,
    quantity: 1,
    showSku: false,
    showCoupon: false,
    buyCount: 1,
    coupons: []
  },

  onLoad(options) {
    if (options.id) {
      this.loadProductDetail(options.id)
    }
  },

  loadProductDetail(productId) {
    this.setData({ loading: true })

    wx.request({
      url: `${API_BASE_URL}/merchant/product/public/${productId}/`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          this.setData({
            product: res.data.data || {},
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
          title: '网络请求失败',
          icon: 'none'
        })
      }
    })
  },

  // 数量变化
  onQuantityChange(e) {
    this.setData({
      quantity: parseInt(e.detail.value) || 1
    })
  },

  // 减少数量
  onDecrease() {
    if (this.data.quantity > 1) {
      this.setData({
        quantity: this.data.quantity - 1
      })
    }
  },

  // 增加数量
  onIncrease() {
    this.setData({
      quantity: this.data.quantity + 1
    })
  },

  // 规格选择
  onSpecChange(e) {
    const spec = e.currentTarget.dataset.spec
    this.setData({
      selectedSpec: spec
    })
  },

  // 显示优惠券弹窗
  showCouponPopup() {
    this.loadCoupons()
    this.setData({ showCoupon: true })
  },

  // 关闭优惠券弹窗
  onCloseCoupon() {
    this.setData({ showCoupon: false })
  },

  // 加载优惠券列表
  loadCoupons() {
    const { product } = this.data
    if (!product.merchant) {
      return
    }

    wx.request({
      url: `${API_BASE_URL}/merchant/coupons/public/${product.merchant}/`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          this.setData({
            coupons: res.data.data || []
          })
        }
      }
    })
  },

  // 显示SKU弹窗
  onShowSku() {
    this.setData({ showSku: true })
  },

  // 关闭SKU弹窗
  onCloseSku() {
    this.setData({ showSku: false })
  },

  // 确认SKU
  onConfirmSku() {
    this.onCloseSku()
    this.onBuyNow()
  },

  // 领取优惠券
  onGetCoupon(e) {
    const couponId = e.currentTarget.dataset.id

    wx.request({
      url: `${API_BASE_URL}/merchant/coupons/receive/`,
      method: 'POST',
      data: {
        coupon_id: couponId
      },
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          wx.showToast({
            title: '领取成功',
            icon: 'success'
          })
          // 重新加载优惠券列表以更新状态
          this.loadCoupons()
        } else {
          wx.showToast({
            title: res.data?.message || '领取失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '领取失败',
          icon: 'none'
        })
      }
    })
  },

  // 加购物车
  onAddToCart() {
    // TODO: 实现购物车功能
    wx.showToast({
      title: '购物车功能待实现',
      icon: 'none'
    })
  },

  // 立即购买
  onBuyNow() {
    const { product, quantity } = this.data
    wx.navigateTo({
      url: `/pages/order/create/create?type=shop&productId=${product.id}&quantity=${quantity}`
    })
  },

  // 联系客服
  onContact() {
    wx.showToast({
      title: '客服功能待实现',
      icon: 'none'
    })
  },

  // 返回店铺
  onGoShop() {
    const { product } = this.data
    if (product.merchant) {
      wx.navigateTo({
        url: `/pages/shop/detail/detail?id=${product.merchant}`
      })
    }
  },

  onPullDownRefresh() {
    if (this.data.product.id) {
      this.loadProductDetail(this.data.product.id)
    }
    wx.stopPullDownRefresh()
  }
})
