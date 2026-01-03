const API_BASE_URL = require('../../../config/api.js').API_BASE_URL
const API_COMMUNITY_URL = API_BASE_URL + '/community'

Page({
  data: {
    item: {},
    loading: false,
    quantity: 1,
    isFavorited: false
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
            isFavorited: item.is_favorited || false,
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
    const { item } = this.data

    if (!item.id) {
      wx.showToast({
        title: '商品信息错误',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认购买',
      content: `确认要购买「${item.title}」吗？\n确认后商品将被标记为已售，请联系卖家完成交易。`,
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: API_COMMUNITY_URL + '/market-items/' + item.id + '/sold/',
            method: 'POST',
            header: {
              'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
              if (res.statusCode === 200 && res.data.success) {
                wx.showModal({
                  title: '购买成功',
                  content: res.data.message || '请联系卖家完成交易',
                  showCancel: false,
                  success: () => {
                    wx.navigateBack()
                  }
                })
              } else {
                wx.showToast({
                  title: res.data?.message || '操作失败',
                  icon: 'none'
                })
              }
            },
            fail: () => {
              wx.showToast({
                title: '网络请求失败',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },

  onFavorite() {
    const { item, isFavorited } = this.data

    wx.request({
      url: API_COMMUNITY_URL + '/market-items/' + item.id + '/favorite/',
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const favorited = res.data.favorited
          this.setData({
            isFavorited: favorited
          })
          wx.showToast({
            title: favorited ? '已收藏' : '已取消收藏',
            icon: 'success'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        })
      }
    })
  },

  onShare() {
    wx.showShareMenu({
      withShareTicket: true
    })
  }
})
