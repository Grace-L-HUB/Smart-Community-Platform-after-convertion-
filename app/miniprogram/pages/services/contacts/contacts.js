const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    searchValue: '',
    categories: [
      {
        category: '物业服务',
        contacts: [
          { id: 1, name: '物业服务中心', phone: '010-88880001', desc: '24小时服务热线', isFavorite: false },
          { id: 2, name: '前台接待', phone: '010-88880002', desc: '8:00-20:00', isFavorite: false },
          { id: 3, name: '投诉建议', phone: '010-88880003', desc: '工作日 9:00-18:00', isFavorite: false }
        ]
      },
      {
        category: '生活服务',
        contacts: [
          { id: 4, name: '送水服务', phone: '010-88880004', desc: '30分钟送达', isFavorite: false },
          { id: 5, name: '快递代收', phone: '010-88880005', desc: '东门快递驿站', isFavorite: false },
          { id: 6, name: '家政服务', phone: '010-88880006', desc: '保洁、维修等', isFavorite: false },
          { id: 7, name: '开锁换锁', phone: '010-88880007', desc: '24小时应急', isFavorite: false }
        ]
      },
      {
        category: '安全应急',
        contacts: [
          { id: 8, name: '安保值班室', phone: '010-88880008', desc: '24小时值班', isFavorite: false },
          { id: 9, name: '消防控制室', phone: '010-88880009', desc: '24小时值班', isFavorite: false },
          { id: 10, name: '急救电话', phone: '120', desc: '医疗急救', isFavorite: false }
        ]
      }
    ],
    loading: false
  },

  onLoad() {
    this.loadContacts()
  },

  loadContacts() {
    // 从本地存储加载收藏状态
    const favorites = wx.getStorageSync('favoriteContacts') || {}
    const categories = this.data.categories.map(cat => ({
      ...cat,
      contacts: cat.contacts.map(contact => ({
        ...contact,
        isFavorite: favorites[contact.id] || false
      }))
    }))
    this.setData({ categories })
  },

  onSearchChange(e) {
    this.setData({ searchValue: e.detail })
  },

  onFavorite(e) {
    const id = e.currentTarget.dataset.id
    const favorites = wx.getStorageSync('favoriteContacts') || {}
    favorites[id] = !favorites[id]
    wx.setStorageSync('favoriteContacts', favorites)

    const categories = this.data.categories.map(cat => ({
      ...cat,
      contacts: cat.contacts.map(contact => ({
        ...contact,
        isFavorite: contact.id === id ? !contact.isFavorite : contact.isFavorite
      }))
    }))
    this.setData({ categories })
  },

  onCall(e) {
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
