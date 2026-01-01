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
  }
})
