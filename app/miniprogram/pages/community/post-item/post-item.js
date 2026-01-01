const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    form: {
      title: '',
      description: '',
      price: '',
      category: 'other',
      images: []
    },
    loading: false
  },

  onLoad() {
  },

  onTitleChange(e) {
    this.setData({
      'form.title': e.detail.value
    })
  },

  onDescriptionChange(e) {
    this.setData({
      'form.description': e.detail.value
    })
  },

  onPriceChange(e) {
    this.setData({
      'form.price': e.detail.value
    })
  },

  onCategoryChange(e) {
    this.setData({
      'form.category': e.detail.value
    })
  },

  onChooseImage() {
    wx.chooseImage({
      count: 3,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          'form.images': this.data.form.images.concat(res.tempFilePaths)
        })
      }
    })
  },

  onRemoveImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.form.images
    images.splice(index, 1)
    this.setData({
      'form.images': images
    })
  },

  onSubmit() {
    const { title, description, price, category, images } = this.data.form

    if (!title || !description || !price) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    wx.request({
      url: API_BASE_URL + '/market-items/',
      method: 'POST',
      data: {
        title: title,
        description: description,
        price: parseFloat(price),
        category: category,
        images: images
      },
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '发布成功',
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
