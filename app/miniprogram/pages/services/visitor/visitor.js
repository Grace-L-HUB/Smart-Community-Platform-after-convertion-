const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    visitors: [],
    form: {
      name: '',
      phone: '',
      visitDate: '',
      visitTime: '',
      reason: ''
    },
    loading: false
  },

  onLoad() {
    this.loadVisitors()
    this.setTodayDate()
  },

  onShow() {
    this.loadVisitors()
  },

  setTodayDate() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    this.setData({
      'form.visitDate': year + '-' + month + '-' + day
    })
  },

  loadVisitors() {
    this.setData({ loading: true })
    
    wx.request({
      url: API_BASE_URL + '/property/visitor/list',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            visitors: res.data.data || [],
            loading: false
          })
        }
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    })
  },

  onNameChange(e) {
    this.setData({
      'form.name': e.detail.value
    })
  },

  onPhoneChange(e) {
    this.setData({
      'form.phone': e.detail.value
    })
  },

  onDateChange(e) {
    this.setData({
      'form.visitDate': e.detail.value
    })
  },

  onTimeChange(e) {
    this.setData({
      'form.visitTime': e.detail.value
    })
  },

  onReasonChange(e) {
    this.setData({
      'form.reason': e.detail.value
    })
  },

  onSubmit() {
    const { name, phone, visitDate, visitTime, reason } = this.data.form

    if (!name || !phone || !visitDate || !visitTime) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    wx.request({
      url: API_BASE_URL + '/property/visitor/invite',
      method: 'POST',
      data: {
        visitor_name: name,
        visitor_phone: phone,
        visit_date: visitDate,
        visit_time: visitTime,
        reason: reason
      },
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '登记成功',
            icon: 'success'
          })
          this.setData({
            form: {
              name: '',
              phone: '',
              visitDate: this.data.form.visitDate,
              visitTime: '',
              reason: ''
            }
          })
          this.loadVisitors()
        }
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  onDeleteVisitor(e) {
    const visitorId = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条访客记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: API_BASE_URL + '/property/visitor/' + visitorId,
            method: 'DELETE',
            header: {
              'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
              if (res.statusCode === 200) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                })
                this.loadVisitors()
              }
            }
          })
        }
      }
    })
  },

  onPullDownRefresh() {
    this.loadVisitors()
    wx.stopPullDownRefresh()
  }
})
