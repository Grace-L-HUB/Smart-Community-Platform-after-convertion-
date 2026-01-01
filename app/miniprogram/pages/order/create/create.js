const API_BASE_URL = require('../../config/api.js').API_BASE_URL

Page({
  data: {
    orderType: '',
    serviceId: '',
    productId: '',
    quantity: 1,
    form: {
      address: '',
      phone: '',
      remark: '',
      appointmentDate: '',
      appointmentTime: ''
    },
    loading: false
  },

  onLoad(options) {
    if (options.type) {
      this.setData({ orderType: options.type })
    }
    if (options.serviceId) {
      this.setData({ serviceId: options.serviceId })
    }
    if (options.productId) {
      this.setData({ productId: options.productId })
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
      'form.address': e.detail.value
    })
  },

  onPhoneChange(e) {
    this.setData({
      'form.phone': e.detail.value
    })
  },

  onRemarkChange(e) {
    this.setData({
      'form.remark': e.detail.value
    })
  },

  onDateChange(e) {
    this.setData({
      'form.appointmentDate': e.detail.value
    })
  },

  onTimeChange(e) {
    this.setData({
      'form.appointmentTime': e.detail.value
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

  onSubmit() {
    const { orderType, serviceId, productId, quantity, form } = this.data

    if (!form.address || !form.phone) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    let url = ''
    let data = {
      address: form.address,
      phone: form.phone,
      remark: form.remark,
      appointment_date: form.appointmentDate,
      appointment_time: form.appointmentTime
    }

    if (orderType === 'decoration') {
      url = API_BASE_URL + '/orders/decoration/'
      data.service_id = serviceId
    } else if (orderType === 'housekeeping') {
      url = API_BASE_URL + '/orders/housekeeping/'
      data.service_id = serviceId
    } else if (orderType === 'shop') {
      url = API_BASE_URL + '/orders/shop/'
      data.product_id = productId
      data.quantity = quantity
    }

    wx.request({
      url: url,
      method: 'POST',
      data: data,
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
        }
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  }
})
