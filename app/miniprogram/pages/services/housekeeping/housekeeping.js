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
    loading: false
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
  }
})
