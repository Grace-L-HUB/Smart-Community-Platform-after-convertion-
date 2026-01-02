const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    userId: '',
    avatarList: [],
    nickname: '',
    gender: 0,
    genderText: '男',
    phone: '',
    realName: '',
    province: '',
    city: '',
    district: '',
    address: '',
    showGender: false,
    genders: [
      { text: '男', value: 0 },
      { text: '女', value: 1 }
    ],
    loading: false
  },

  onLoad() {
    this.loadUserInfo()
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userId: userInfo.id || userInfo.user_id,
        avatarList: userInfo.avatar ? [{ url: userInfo.avatar }] : [],
        nickname: userInfo.nickname || '',
        gender: userInfo.gender !== undefined ? userInfo.gender : 0,
        genderText: userInfo.gender === 1 ? '女' : '男',
        phone: userInfo.phone || '',
        realName: userInfo.real_name || '',
        province: userInfo.province || '',
        city: userInfo.city || '',
        district: userInfo.district || '',
        address: userInfo.address || ''
      })
    }
  },

  onAvatarRead(e) {
    const { file } = e.detail
    this.setData({
      avatarList: [file]
    })
    this.uploadAvatar(file.url || file.path)
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
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        })
      }
    })
  },

  onNicknameChange(e) {
    this.setData({
      nickname: e.detail
    })
  },

  onRealNameChange(e) {
    this.setData({
      realName: e.detail
    })
  },

  onProvinceChange(e) {
    this.setData({
      province: e.detail
    })
  },

  onCityChange(e) {
    this.setData({
      city: e.detail
    })
  },

  onDistrictChange(e) {
    this.setData({
      district: e.detail
    })
  },

  onAddressChange(e) {
    this.setData({
      address: e.detail
    })
  },

  showGenderPicker() {
    this.setData({
      showGender: true
    })
  },

  closeGenderPicker() {
    this.setData({
      showGender: false
    })
  },

  onGenderConfirm(e) {
    const { value, index } = e.detail
    this.setData({
      gender: value,
      genderText: this.data.genders[index].text,
      showGender: false
    })
  },

  onSave() {
    if (!this.data.nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    console.log('保存用户信息:', {
      user_id: this.data.userId,
      nickname: this.data.nickname,
      gender: this.data.gender,
      real_name: this.data.realName,
      province: this.data.province,
      city: this.data.city,
      district: this.data.district,
      address: this.data.address
    })

    this.setData({ loading: true })

    wx.request({
      url: API_BASE_URL + '/profile',
      method: 'PUT',
      data: {
        user_id: this.data.userId,
        nickname: this.data.nickname,
        gender: this.data.gender,
        real_name: this.data.realName,
        province: this.data.province,
        city: this.data.city,
        district: this.data.district,
        address: this.data.address
      },
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        console.log('保存响应:', res)
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({
            title: res.data.message || '保存失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('保存失败:', err)
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
