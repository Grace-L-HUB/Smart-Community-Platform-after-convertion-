const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    shop: {},
    products: [],
    loading: false,
    productsLoading: false,
    productsError: '',
    error: '',
    active: 0,
    merchantId: null
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ merchantId: options.id })
      this.loadMerchantDetail(options.id)
      this.loadProducts(options.id)
    }
  },

  // 加载商户详情
  loadMerchantDetail(merchantId) {
    this.setData({ loading: true })

    wx.request({
      url: `${API_BASE_URL}/merchant/profile/${merchantId}/`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          const merchant = res.data.data
          this.setData({
            shop: {
              id: merchant.id,
              name: merchant.shop_name,
              logo: merchant.shop_logo || 'https://img.yzcdn.cn/vant/logo.png',
              bgImage: merchant.shop_logo || 'https://img.yzcdn.cn/vant/logo.png',
              category: merchant.category_display,
              address: merchant.shop_address,
              phone: merchant.shop_phone,
              businessHours: `${merchant.business_hours_start}-${merchant.business_hours_end}`,
              description: merchant.shop_description,
              score: 4.8,
              monthlySales: 100,
              tags: ['优质商户', '诚信经营']
            },
            loading: false
          })
        } else {
          this.setData({
            error: res.data.message || '加载商户信息失败',
            loading: false
          })
        }
      },
      fail: () => {
        this.setData({
          error: '网络请求失败',
          loading: false
        })
      }
    })
  },

  // 加载商户商品列表
  loadProducts(merchantId) {
    this.setData({ productsLoading: true, productsError: '' })

    wx.request({
      url: `${API_BASE_URL}/merchant/products/public/${merchantId}/`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          this.setData({
            products: res.data.data || [],
            productsLoading: false
          })
        } else {
          this.setData({
            productsError: res.data.message || '加载商品失败',
            productsLoading: false
          })
        }
      },
      fail: () => {
        this.setData({
          productsError: '网络请求失败',
          productsLoading: false
        })
      }
    })
  },

  // 点击商品卡片 - 进入商品详情
  onProductClick(e) {
    const productId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/shop/product/product?id=${productId}`
    })
  },

  // 加购物车
  onAddToCart(e) {
    // TODO: 实现购物车功能
    wx.showToast({
      title: '购物车功能待实现',
      icon: 'none'
    })
  },

  // 立即购买 - 直接进入订单创建页面
  onBuyNow(e) {
    const productId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order/create/create?type=shop&productId=${productId}&quantity=1`
    })
  },

  // 联系商家
  callShop() {
    const { shop } = this.data
    if (shop.phone) {
      wx.makePhoneCall({
        phoneNumber: shop.phone
      })
    } else {
      wx.showToast({
        title: '商家暂无电话',
        icon: 'none'
      })
    }
  },

  onRefresh() {
    if (this.data.merchantId) {
      this.loadMerchantDetail(this.data.merchantId)
      this.loadProducts(this.data.merchantId)
    }
  }
})
