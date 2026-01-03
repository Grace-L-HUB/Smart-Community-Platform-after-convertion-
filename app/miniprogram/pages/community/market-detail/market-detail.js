const API_BASE_URL = require('../../../config/api.js').API_BASE_URL
const API_COMMUNITY_URL = API_BASE_URL + '/community'

Page({
  data: {
    item: {},
    loading: false,
    quantity: 1
  },

  onLoad(options) {
    if (options.id) {
      this.loadItemDetail(options.id)
    }
  },

  loadItemDetail(id) {
    this.setData({ loading: true })

    wx.request({
      url: API_COMMUNITY_URL + '/market-items/' + id + '/',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        console.log('商品详情响应:', res.data)
        // DRF 的 RetrieveAPIView 直接返回数据对象，没有 success/code 包装
        if (res.statusCode === 200) {
          const item = res.data || {}
          // 处理图片数组 - 提取 URL
          const images = (item.images || []).map(img => img.image)
          // 提取卖家信息
          const seller = item.seller || {}
          // 处理头像：将 localhost 替换为实际 IP，或使用默认头像
          let avatarUrl = seller.avatar || ''
          if (avatarUrl.includes('localhost')) {
            avatarUrl = ''  // 本地开发时头像可能无法访问，使用默认
          }

          console.log('处理后的数据:', {
            title: item.title,
            price: item.price,
            images: images,
            sellerName: seller.nickname || seller.display_name
          })

          this.setData({
            item: item,
            images: images,
            price: item.price,
            title: item.title,
            description: item.description,
            category: item.category,
            condition: item.condition,
            isNew: item.condition === '全新',
            publishTime: item.time_ago || item.created_at,
            seller: {
              avatar: avatarUrl,
              name: seller.nickname || seller.display_name || '未知用户',
              phone: seller.phone
            },
            loading: false
          })
        } else {
          this.setData({ loading: false })
          wx.showToast({
            title: '加载失败',
            icon: 'none'
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

  onQuantityChange(e) {
    this.setData({
      quantity: parseInt(e.detail.value) || 1
    })
  },

  onDecrease() {
    if (this.data.quantity > 1) {
      this.setData({
        quantity: this.data.quantity - 1
      })
    }
  },

  onIncrease() {
    this.setData({
      quantity: this.data.quantity + 1
    })
  },

  onContact() {
    const phone = this.data.seller?.phone
    if (phone) {
      wx.makePhoneCall({
        phoneNumber: phone
      })
    } else {
      wx.showToast({
        title: '卖家未设置联系电话',
        icon: 'none'
      })
    }
  },

  onWant() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  onFavorite() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  onShare() {
    wx.showShareMenu({
      withShareTicket: true
    })
  }
})
