const API_BASE_URL = require('../../config/api.js').API_BASE_URL

Page({
  data: {
    form: {
      plateNumber: '',
      carModel: '',
      ownerName: '',
      ownerPhone: ''
    },
    loading: false
  },

  onLoad() {
  },

  onPlateNumberChange(e) {
    this.setData({
      'form.plateNumber': e.detail.value
    })
  },

  onCarModelChange(e) {
    this.setData({
      'form.carModel': e.detail.value
    })
  },

  onOwnerNameChange(e) {
    this.setData({
      'form.ownerName': e.detail.value
    })
  },

  onOwnerPhoneChange(e) {
    this.setData({
      'form.ownerPhone': e.detail.value
    })
  },

  onSubmit() {
    const { plateNumber, carModel, ownerName, ownerPhone } = this.data.form

    if (!plateNumber || !ownerName || !ownerPhone) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    wx.request({
      url: API_BASE_URL + '/parking/bind/',
      method: 'POST',
      data: {
        plate_number: plateNumber,
        car_model: carModel,
        owner_name: ownerName,
        owner_phone: ownerPhone
      },
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '绑定成功',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  }
})
