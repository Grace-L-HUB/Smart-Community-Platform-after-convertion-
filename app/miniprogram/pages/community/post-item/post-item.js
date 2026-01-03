const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    form: {
      title: '',
      description: '',
      price: '',
      category: '其他',
      condition: '全新',  // 添加默认成色
      images: []
    },
    loading: false,
    showCategory: false,
    showCondition: false,
    categoryText: '',
    conditionText: '全新',  // 添加默认成色文本
    categories: [
      { text: '家用电器', value: '家用电器' },
      { text: '家具', value: '家具' },
      { text: '数码产品', value: '数码产品' },
      { text: '图书音像', value: '图书音像' },
      { text: '服装鞋包', value: '服装鞋包' },
      { text: '母婴用品', value: '母婴用品' },
      { text: '运动户外', value: '运动户外' },
      { text: '其他', value: '其他' }
    ],
    conditions: [
      { text: '全新', value: '全新' },
      { text: '99新', value: '99新' },
      { text: '95新', value: '95新' },
      { text: '9成新', value: '9成新' },
      { text: '8成新', value: '8成新' },
      { text: '7成新', value: '7成新' }
    ],
    fileList: [],
    canSubmit: false
  },

  onLoad() {
  },

  onTitleChange(e) {
    const value = e.detail || ''
    this.setData({
      'form.title': value
    }, this.checkCanSubmit)
  },

  onDescChange(e) {
    const value = e.detail || ''
    this.setData({
      'form.description': value
    }, this.checkCanSubmit)
  },

  onPriceChange(e) {
    const value = e.detail || ''
    this.setData({
      'form.price': value
    }, this.checkCanSubmit)
  },

  showCategoryPicker() {
    this.setData({
      showCategory: true
    })
  },

  closeCategoryPicker() {
    this.setData({
      showCategory: false
    })
  },

  onCategoryConfirm(e) {
    console.log('分类选择事件:', e.detail)
    // van-picker 返回的 value 可能是对象或字符串
    let selectedValue = e.detail.value
    let index = e.detail.index

    // 如果 value 是对象，提取其 value 或 text 属性
    if (typeof selectedValue === 'object' && selectedValue !== null) {
      selectedValue = selectedValue.value || selectedValue.text
    }

    console.log('选择的分类值:', selectedValue)

    this.setData({
      'form.category': selectedValue,
      categoryText: typeof selectedValue === 'string' ? selectedValue : this.data.categories[index].text,
      showCategory: false
    }, this.checkCanSubmit)
  },

  showConditionPicker() {
    this.setData({
      showCondition: true
    })
  },

  closeConditionPicker() {
    this.setData({
      showCondition: false
    })
  },

  onConditionConfirm(e) {
    console.log('成色选择事件:', e.detail)
    // van-picker 返回的 value 可能是对象或字符串
    let selectedValue = e.detail.value
    let index = e.detail.index

    // 如果 value 是对象，提取其 value 或 text 属性
    if (typeof selectedValue === 'object' && selectedValue !== null) {
      selectedValue = selectedValue.value || selectedValue.text
    }

    console.log('选择的成色值:', selectedValue)

    this.setData({
      'form.condition': selectedValue,
      conditionText: typeof selectedValue === 'string' ? selectedValue : this.data.conditions[index].text,
      showCondition: false
    }, this.checkCanSubmit)
  },

  checkCanSubmit() {
    const { title, description, price, category } = this.data.form
    const canSubmit = !!(title && description && price && category)
    this.setData({ canSubmit })
  },

  uploadImage(filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: API_BASE_URL + '/upload/avatar',
        filePath: filePath,
        name: 'avatar',
        header: {
          'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
        },
        success: (res) => {
          if (res.statusCode === 200) {
            const data = JSON.parse(res.data)
            if (data.code === 200 && data.data && data.data.url) {
              resolve(data.data.url)
            } else {
              wx.showToast({
                title: '图片上传失败',
                icon: 'none'
              })
              resolve(null)
            }
          } else {
            wx.showToast({
              title: '图片上传失败',
              icon: 'none'
            })
            resolve(null)
          }
        },
        fail: (err) => {
          wx.showToast({
            title: '图片上传失败',
            icon: 'none'
          })
          reject(err)
        }
      })
    })
  },

  afterRead(e) {
    const { file } = e.detail
    const fileList = this.data.fileList.concat(file)
    this.setData({
      fileList,
      'form.images': fileList.map(item => item.url || item.path)
    })
  },

  deleteImage(e) {
    const { index } = e.detail
    const fileList = this.data.fileList
    fileList.splice(index, 1)
    this.setData({
      fileList,
      'form.images': fileList.map(item => item.url || item.path)
    })
  },

  async onSubmit() {
    const { title, description, price, category, condition, images } = this.data.form

    if (!title || !description || !price) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    try {
      const token = wx.getStorageSync('token') || ''

      console.log('提交的数据:', { title, description, price, category, condition, images })

      wx.uploadFile({
        url: API_BASE_URL + '/community/market-items/',
        filePath: images && images.length > 0 ? images[0] : '',
        name: 'uploaded_images',
        formData: {
          title: title,
          description: description,
          price: price.toString(),
          category: category,
          condition: condition || '全新'  // 确保condition有默认值
        },
        header: {
          'Authorization': 'Bearer ' + token
        },
        success: (res) => {
          console.log('发布响应:', res)
          if (res.statusCode === 201) {
            wx.showToast({
              title: '发布成功',
              icon: 'success'
            })
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          } else {
            try {
              const data = JSON.parse(res.data)
              console.error('发布失败:', data)
              wx.showToast({
                title: data.detail || data.message || '发布失败',
                icon: 'none',
                duration: 3000
              })
            } catch (e) {
              console.error('解析响应失败:', res.data)
              wx.showToast({
                title: '发布失败',
                icon: 'none'
              })
            }
          }
        },
        fail: (err) => {
          console.error('请求失败:', err)
          wx.showToast({
            title: '网络错误',
            icon: 'none'
          })
        },
        complete: () => {
          this.setData({ loading: false })
        }
      })
    } catch (error) {
      console.error('异常:', error)
      this.setData({ loading: false })
      wx.showToast({
        title: '发布失败',
        icon: 'none'
      })
    }
  }
})
