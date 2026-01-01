const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    userInfo: {},
    form: {
      nickname: '',
      phone: '',
      email: '',
      address: ''
    },
    loading: false
  },

  onLoad() {
    this.loadUserInfo()
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        form: {
          nickname: userInfo.nickname || '',
          phone: userInfo.phone || '',
          email: userInfo.email || '',
          address: userInfo.address || ''
        }
      })
    }
  },

  onNicknameChange(e) {
    this.setData({
      'form.nickname': e.detail.value
    })
  },

  onPhoneChange(e) {
    this.setData({
      'form.phone': e.detail.value
    })
  },

  onEmailChange(e) {
    this.setData({
      'form.email': e.detail.value
    })
  },

  onAddressChange(e) {
    this.setData({
      'form.address': e.detail.value
    })
  },

  onChooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        this.uploadAvatar(tempFilePath)
      }
    })
  },

  uploadAvatar(filePath) {
    wx.uploadFile({
      url: API_BASE_URL + '/upload/avatar',
      filePath: filePath,
      name: 'avatar',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        const data = JSON.parse(res.data)
        if (data.code === 200) {
          this.setData({
            'userInfo.avatar': data.data.avatar_url
          })
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          })
        }
      }
    })
  },

  onSave() {
    const { nickname, phone, email, address } = this.data.form

    if (!nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    wx.request({
      url: API_BASE_URL + '/api/profile',
      method: 'PUT',
      data: {
        nickname: nickname,
        phone: phone,
        email: email,
        address: address
      },
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '保存成功',
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
