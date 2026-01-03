const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    form: {
      title: '',
      content: '',
      category: 'help',
      phone: '',
      location: '',
      images: []
    },
    tags: ['紧急求助', '物品借借', '技能互助', '拼车出行', '其他'],
    selectedTag: '紧急求助',
    loading: false
  },

  onLoad(options) {
    // 如果有预分类，使用预分类
    if (options.category) {
      this.setData({
        selectedTag: options.category
      })
    }
  },

  // 内容输入
  onInput(e) {
    this.setData({
      'form.content': e.detail.value
    })
  },

  // 电话输入
  onPhoneInput(e) {
    this.setData({
      'form.phone': e.detail.value
    })
  },

  // 位置输入
  onLocationInput(e) {
    this.setData({
      'form.location': e.detail.value
    })
  },

  // 标签选择
  onTagSelect(e) {
    const tag = e.currentTarget.dataset.tag
    this.setData({
      selectedTag: tag
    })
  },

  onSubmit() {
    const { content, phone, location } = this.data.form
    const { selectedTag } = this.data

    if (!content) {
      wx.showToast({
        title: '请填写求助内容',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    wx.request({
      url: API_BASE_URL + '/community/help-posts/',
      method: 'POST',
      data: {
        title: selectedTag, // 使用标签作为标题
        content: content,
        category: 'help',
        phone: phone,
        location: location
      },
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 201 || (res.statusCode === 200 && res.data.code === 200)) {
          wx.showToast({
            title: '发布成功',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({
            title: res.data?.message || '发布失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '发布失败',
          icon: 'none'
        })
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  }
})
