const API_BASE_URL = require('../../config/api.js').API_BASE_URL

Page({
  data: {
    form: {
      building: '',
      unit: '',
      floor: '',
      room: '',
      ownerName: '',
      ownerPhone: '',
      area: ''
    },
    loading: false
  },

  onLoad() {
  },

  onBuildingChange(e) {
    this.setData({
      'form.building': e.detail.value
    })
  },

  onUnitChange(e) {
    this.setData({
      'form.unit': e.detail.value
    })
  },

  onFloorChange(e) {
    this.setData({
      'form.floor': e.detail.value
    })
  },

  onRoomChange(e) {
    this.setData({
      'form.room': e.detail.value
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

  onAreaChange(e) {
    this.setData({
      'form.area': e.detail.value
    })
  },

  onSubmit() {
    const { building, unit, floor, room, ownerName, ownerPhone, area } = this.data.form

    if (!building || !unit || !floor || !room || !ownerName || !ownerPhone) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    wx.request({
      url: `${API_BASE_URL}/house/bind/`,
      method: 'POST',
      data: {
        building,
        unit,
        floor,
        room,
        owner_name: ownerName,
        owner_phone: ownerPhone,
        area: parseFloat(area) || 0
      },
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
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
