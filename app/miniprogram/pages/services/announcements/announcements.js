const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    announcements: [],
    loading: false,
    activeTab: 0,
    allAnnouncements: []
  },

  onLoad() {
    this.loadAnnouncements()
  },

  loadAnnouncements() {
    this.setData({ loading: true })
    
    wx.request({
      url: API_BASE_URL + '/property/announcements',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          const allData = res.data.data || []
          this.setData({
            allAnnouncements: allData,
            announcements: allData,
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

  onAnnouncementClick(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/services/announcement-detail/announcement-detail?id=' + id
    })
  },

  onPullDownRefresh() {
    this.loadAnnouncements()
    wx.stopPullDownRefresh()
  },

  onTabChange(e) {
    const index = e.detail.index
    this.setData({ activeTab: index })
    
    const categories = ['全部', 'property_notice', 'community_news', 'warm_tips']
    const selectedCategory = categories[index]
    
    if (selectedCategory === '全部') {
      this.setData({
        announcements: this.data.allAnnouncements
      })
    } else {
      const filtered = this.data.allAnnouncements.filter(item => {
        return item.category === selectedCategory
      })
      this.setData({
        announcements: filtered
      })
    }
  }
})
