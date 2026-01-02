const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    services: [
      {
        id: 1,
        name: '日常保洁',
        price: 80,
        unit: '次',
        description: '家庭日常清洁服务',
        image: '/images/housekeeping/cleaning.jpg'
      },
      {
        id: 2,
        name: '深度保洁',
        price: 200,
        unit: '次',
        description: '全方位深度清洁',
        image: '/images/housekeeping/deep-cleaning.jpg'
      },
      {
        id: 3,
        name: '家电清洗',
        price: 120,
        unit: '台',
        description: '空调、洗衣机等家电清洗',
        image: '/images/housekeeping/appliance.jpg'
      },
      {
        id: 4,
        name: '玻璃清洁',
        price: 100,
        unit: '次',
        description: '窗户玻璃专业清洁',
        image: '/images/housekeeping/glass.jpg'
      }
    ],
    loading: false,
    selectedService: '',
    selectedServiceId: '',
    serviceTime: '',
    address: '',
    phone: '',
    remark: '',
    showService: false,
    showTime: false,
    serviceNames: [
      { text: '日常保洁', value: 'daily' },
      { text: '深度保洁', value: 'deep' },
      { text: '家电清洗', value: 'appliance' },
      { text: '玻璃清洁', value: 'glass' }
    ],
    currentDate: new Date().getTime(),
    minDate: new Date().getTime(),
    submitting: false
  },

  onLoad() {
    this.loadServices()
  },

  loadServices() {
    this.setData({ loading: true })
    setTimeout(() => {
      this.setData({ loading: false })
    }, 500)
  },

  onServiceClick(e) {
    const serviceId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/services/housekeeping-detail/housekeeping-detail?id=' + serviceId
    })
  },

  onBookService(e) {
    const serviceId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/order/create/create?type=housekeeping&serviceId=' + serviceId
    })
  },

  onPullDownRefresh() {
    this.loadServices()
    wx.stopPullDownRefresh()
  },

  showServicePicker() {
    this.setData({ showService: true })
  },

  showTimePicker() {
    this.setData({ showTime: true })
  },

  closeServicePicker() {
    this.setData({ showService: false })
  },

  closeTimePicker() {
    this.setData({ showTime: false })
  },

  onServiceConfirm(e) {
    const { value, index } = e.detail
    let selectedValue = value
    let selectedText = ''
    
    if (typeof value === 'object' && value !== null) {
      selectedValue = value.value || value.text || ''
      selectedText = value.text || ''
    }
    
    this.setData({
      selectedService: selectedText,
      selectedServiceId: selectedValue,
      showService: false
    })
  },

  onTimeConfirm(e) {
    const date = new Date(e.detail)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    const dateStr = year + '-' + month + '-' + day + ' ' + hour + ':' + minute
    
    this.setData({
      serviceTime: dateStr,
      currentDate: e.detail,
      showTime: false
    })
  },

  onAddressChange(e) {
    this.setData({
      address: e.detail
    })
  },

  onPhoneChange(e) {
    this.setData({
      phone: e.detail
    })
  },

  onRemarkChange(e) {
    this.setData({
      remark: e.detail
    })
  },

  onSubmit() {
    const { selectedServiceId, serviceTime, address, phone } = this.data

    if (!selectedServiceId) {
      wx.showToast({
        title: '请选择服务类型',
        icon: 'none'
      })
      return
    }

    if (!serviceTime) {
      wx.showToast({
        title: '请选择服务时间',
        icon: 'none'
      })
      return
    }

    if (!address) {
      wx.showToast({
        title: '请输入服务地址',
        icon: 'none'
      })
      return
    }

    if (!phone) {
      wx.showToast({
        title: '请输入联系电话',
        icon: 'none'
      })
      return
    }

    this.setData({ submitting: true })

    setTimeout(() => {
      this.setData({ submitting: false })
      wx.showToast({
        title: '预约成功',
        icon: 'success'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }, 1000)
  }
})
