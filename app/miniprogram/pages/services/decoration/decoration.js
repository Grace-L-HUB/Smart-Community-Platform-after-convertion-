const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    services: [
      {
        id: 1,
        name: '装修申请',
        price: 0,
        unit: '次',
        description: '提交装修申请，获取装修许可证',
        image: '/images/decoration/application.jpg'
      },
      {
        id: 2,
        name: '装修验收',
        price: 200,
        unit: '次',
        description: '装修完成后进行验收',
        image: '/images/decoration/inspection.jpg'
      },
      {
        id: 3,
        name: '装修咨询',
        price: 100,
        unit: '次',
        description: '专业装修咨询服务',
        image: '/images/decoration/consult.jpg'
      },
      {
        id: 4,
        name: '垃圾清运',
        price: 300,
        unit: '次',
        description: '装修垃圾清运服务',
        image: '/images/decoration/disposal.jpg'
      }
    ],
    loading: false,
    decorationType: '',
    decorationTypeText: '',
    startDate: '',
    endDate: '',
    company: '',
    contact: '',
    phone: '',
    description: '',
    fileList: [],
    showType: false,
    showStart: false,
    showEnd: false,
    types: [
      { text: '室内装修', value: 'indoor' },
      { text: '室外装修', value: 'outdoor' },
      { text: '其他', value: 'other' }
    ],
    currentDate: new Date().getTime(),
    startDateValue: new Date().getTime(),
    endDateValue: new Date().getTime(),
    minDate: new Date().getTime(),
    maxDate: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).getTime()
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
      url: '/pages/services/decoration-detail/decoration-detail?id=' + serviceId
    })
  },

  onBookService(e) {
    const serviceId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/order/create/create?type=decoration&serviceId=' + serviceId
    })
  },

  onPullDownRefresh() {
    this.loadServices()
    wx.stopPullDownRefresh()
  },

  showTypePicker() {
    console.log('showTypePicker called')
    this.setData({ showType: true })
  },

  showStartPicker() {
    console.log('showStartPicker called')
    this.setData({ showStart: true })
  },

  showEndPicker() {
    console.log('showEndPicker called')
    this.setData({ showEnd: true })
  },

  closeTypePicker() {
    this.setData({ showType: false })
  },

  closeStartPicker() {
    this.setData({ showStart: false })
  },

  closeEndPicker() {
    this.setData({ showEnd: false })
  },

  onTypeConfirm(e) {
    console.log('onTypeConfirm called, e.detail:', e.detail)
    const { value, index } = e.detail
    console.log('value:', value)
    console.log('index:', index)
    
    let selectedValue = value
    let selectedText = ''
    
    if (typeof value === 'object' && value !== null) {
      selectedValue = value.value || value.text || ''
      selectedText = value.text || ''
    }
    
    console.log('selectedValue:', selectedValue)
    console.log('selectedText:', selectedText)
    
    this.setData({
      decorationType: selectedValue,
      decorationTypeText: selectedText,
      showType: false
    })
  },

  onStartConfirm(e) {
    const date = new Date(e.detail)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = year + '-' + month + '-' + day
    
    this.setData({
      startDate: dateStr,
      startDateValue: e.detail,
      showStart: false
    })
  },

  onEndConfirm(e) {
    const date = new Date(e.detail)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = year + '-' + month + '-' + day
    
    this.setData({
      endDate: dateStr,
      endDateValue: e.detail,
      showEnd: false
    })
  },

  onCompanyChange(e) {
    this.setData({
      company: e.detail
    })
  },

  onContactChange(e) {
    this.setData({
      contact: e.detail
    })
  },

  onPhoneChange(e) {
    this.setData({
      phone: e.detail
    })
  },

  onDescChange(e) {
    this.setData({
      description: e.detail
    })
  },

  afterRead(e) {
    const { file } = e.detail
    const fileList = this.data.fileList || []
    fileList.push({ 
      url: file.path,
      name: file.name
    })
    this.setData({
      fileList: fileList
    })
  },

  deleteFile(e) {
    const { index } = e.detail
    const fileList = this.data.fileList || []
    fileList.splice(index, 1)
    this.setData({
      fileList: fileList
    })
  },

  onSubmit() {
    const { decorationType, startDate, endDate, company, contact, phone, description } = this.data

    if (!decorationType) {
      wx.showToast({
        title: '请选择装修类型',
        icon: 'none'
      })
      return
    }

    if (!startDate) {
      wx.showToast({
        title: '请选择开始时间',
        icon: 'none'
      })
      return
    }

    if (!endDate) {
      wx.showToast({
        title: '请选择结束时间',
        icon: 'none'
      })
      return
    }

    if (!company) {
      wx.showToast({
        title: '请输入施工单位名称',
        icon: 'none'
      })
      return
    }

    if (!contact) {
      wx.showToast({
        title: '请输入负责人姓名',
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

    wx.showLoading({ title: '提交中...' })

    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '提交成功',
        icon: 'success'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }, 1000)
  }
})
