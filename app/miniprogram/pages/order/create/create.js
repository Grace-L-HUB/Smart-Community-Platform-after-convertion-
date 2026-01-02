const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    orderType: '',
    productId: '',
    merchantId: '',
    quantity: 1,
    form: {
      address: '',
      phone: '',
      remark: ''
    },
    loading: false
  },

  onLoad(options) {
    if (options.type) {
      this.setData({ orderType: options.type })
    }
    if (options.productId) {
      this.setData({ productId: options.productId })
    }
    if (options.merchantId) {
      this.setData({ merchantId: options.merchantId })
    }
    if (options.quantity) {
      this.setData({ quantity: parseInt(options.quantity) })
    }
    this.loadUserInfo()
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        'form.phone': userInfo.phone || '',
        'form.address': userInfo.address || ''
      })
    }
  },

  onAddressChange(e) {
    this.setData({
      'form.address': e.detail
    })
  },

  onPhoneChange(e) {
    this.setData({
      'form.phone': e.detail
    })
  },

  onRemarkChange(e) {
    this.setData({
      'form.remark': e.detail
    })
  },

  onQuantityChange(e) {
    this.setData({
      quantity: parseInt(e.detail) || 1
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

  onSubmit() {
    const { productId, merchantId, quantity, form } = this.data

    if (!form.address || !form.phone) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (!productId) {
      wx.showToast({
        title: '缺少商品信息',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    wx.request({
      url: API_BASE_URL + '/merchant/orders/create/',
      method: 'POST',
      data: {
        product_id: productId,
        quantity: quantity,
        address: form.address,
        phone: form.phone,
        remark: form.remark
      },
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '下单成功',
            icon: 'success'
          })
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/profile/orders/orders'
            })
          }, 1500)
        } else {
          wx.showToast({
            title: res.data.message || '下单失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  }
})
