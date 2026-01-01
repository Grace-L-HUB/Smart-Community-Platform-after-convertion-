const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    contacts: [
      {
        id: 1,
        name: '物业服务中心',
        phone: '400-123-4567',
        address: '小区物业中心一楼',
        hours: '8:00-20:00'
      },
      {
        id: 2,
        name: '保安室',
        phone: '400-123-4568',
        address: '小区北门',
        hours: '24小时'
      },
      {
        id: 3,
        name: '维修服务',
        phone: '400-123-4569',
        address: '物业中心二楼',
        hours: '8:30-17:30'
      },
      {
        id: 4,
        name: '快递驿站',
        phone: '400-123-4570',
        address: '小区东门',
        hours: '9:00-21:00'
      },
      {
        id: 5,
        name: '社区医院',
        phone: '400-123-4571',
        address: '社区服务中心',
        hours: '8:00-18:00'
      }
    ],
    loading: false
  },

  onLoad() {
    this.loadContacts()
  },

  loadContacts() {
    this.setData({ loading: true })
    setTimeout(() => {
      this.setData({ loading: false })
    }, 500)
  },

  onCallPhone(e) {
    const phone = e.currentTarget.dataset.phone
    if (phone) {
      wx.makePhoneCall({
        phoneNumber: phone
      })
    }
  },

  onPullDownRefresh() {
    this.loadContacts()
    wx.stopPullDownRefresh()
  }
})
