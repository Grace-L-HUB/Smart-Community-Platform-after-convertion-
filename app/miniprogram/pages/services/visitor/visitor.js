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
    loading: false,
    activeTab: 0,
    showPicker: false,
    currentDate: new Date().getTime(),
    minDate: new Date().getTime(),
    formatter(type, value) {
      const types = {
        year: value + '年',
        month: value + '月',
        day: value + '日'
      }
      return types[type]
    }
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
    
    const userInfo = wx.getStorageSync('userInfo') || {}
    const userId = userInfo.user_id || userInfo.id
    
    console.log('userInfo:', userInfo)
    console.log('userId:', userId)
    
    if (!userId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      this.setData({ loading: false })
      return
    }
    
    wx.request({
      url: API_BASE_URL + '/property/visitor/list',
      method: 'GET',
      data: {
        user_id: userId
      },
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            visitors: res.data.data || [],
            loading: false
          })
        } else {
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none'
          })
          this.setData({ loading: false })
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

  onPullDownRefresh() {
    this.loadVisitors()
    wx.stopPullDownRefresh()
  },

  onTabChange(e) {
    this.setData({
      activeTab: e.detail.index
    })
  },

  showTimePicker() {
    this.setData({
      showPicker: true
    })
  },

  closeTimePicker() {
    this.setData({
      showPicker: false
    })
  },

  onTimeConfirm(e) {
    const date = new Date(e.detail)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = year + '-' + month + '-' + day
    
    this.setData({
      currentDate: e.detail,
      'form.visitDate': dateStr,
      showPicker: false
    })
  },

  onNameChange(e) {
    this.setData({
      'form.name': e.detail
    })
  },

  onPhoneChange(e) {
    this.setData({
      'form.phone': e.detail
    })
  },

  onCarChange(e) {
    this.setData({
      'form.carNumber': e.detail
    })
  },

  onRemarkChange(e) {
    this.setData({
      'form.reason': e.detail
    })
  },

  onInvite() {
    const { name, phone, visitDate, reason } = this.data.form

    if (!name || !phone || !visitDate) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    const userInfo = wx.getStorageSync('userInfo') || {}
    const userId = userInfo.user_id || userInfo.id
    
    console.log('发送访客邀请数据:', {
      user_id: userId,
      name: name,
      phone: phone,
      visit_time: visitDate,
      remark: reason
    })

    wx.request({
      url: API_BASE_URL + '/property/visitor/invite',
      method: 'POST',
      data: {
        user_id: userId,
        name: name,
        phone: phone,
        visit_time: visitDate,
        remark: reason
      },
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
          console.log('访客邀请响应:', res)
          if (res.statusCode === 200 && res.data.code === 200) {
            wx.showToast({
              title: '邀请成功',
              icon: 'success'
            })
            this.setData({
              form: {
                name: '',
                phone: '',
                visitDate: '',
                visitTime: '',
                reason: ''
              }
            })
            this.setData({ activeTab: 0 })
            this.loadVisitors()
          } else {
            console.error('邀请失败:', res.data)
            let errorMsg = res.data.message || '邀请失败'
            if (res.data.errors) {
              console.error('详细错误:', res.data.errors)
              for (let field in res.data.errors) {
                errorMsg += '\n' + field + ': ' + res.data.errors[field].join(', ')
              }
            }
            wx.showToast({
              title: errorMsg,
              icon: 'none',
              duration: 3000
            })
          }
        },
      fail: (err) => {
        console.error('邀请请求失败:', err)
        wx.showToast({
          title: '邀请失败',
          icon: 'none'
        })
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  onShowQR(e) {
    const visitorId = e.currentTarget.dataset.id
    wx.showToast({
      title: '二维码功能开发中',
      icon: 'none'
    })
  },

  onCancel(e) {
    const visitorId = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这次访客邀请吗？',
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
                  title: '取消成功',
                  icon: 'success'
                })
                this.loadVisitors()
              }
            }
          })
        }
      }
    })
  }
})
