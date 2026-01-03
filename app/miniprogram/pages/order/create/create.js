const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    // 基本信息
    orderType: '',
    productId: '',
    merchantId: '',
    quantity: 1,
    loading: false,

    // 商品和商户信息
    product: {},
    shop: {},

    // 取餐方式
    pickupType: 'pickup', // pickup: 到店自提, delivery: 外卖配送
    showPickupTypeModal: false,

    // 表单数据
    contactName: '',
    contactPhone: '',
    address: '',
    note: '',

    // 优惠券相关
    showCouponModal: false,
    availableCoupons: [],
    selectedCoupon: null,
    discountAmount: 0,

    // 价格计算
    totalAmount: '0.00',
    actualAmount: '0.00',

    // 提交状态
    submitting: false,
    canSubmit: false
  },

  onLoad(options) {
    if (options.type) {
      this.setData({ orderType: options.type })
    }
    if (options.productId) {
      this.setData({ productId: options.productId })
      this.loadProductDetail(options.productId)
    }
    if (options.merchantId) {
      this.setData({ merchantId: options.merchantId })
    }
    if (options.quantity) {
      this.setData({ quantity: parseInt(options.quantity) })
    }
    this.loadUserInfo()
    // 加载可用优惠券
    this.loadAvailableCoupons()
  },

  // 加载商品详情
  loadProductDetail(productId) {
    this.setData({ loading: true })

    wx.request({
      url: `${API_BASE_URL}/merchant/product/public/${productId}/`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          const product = res.data.data || {}
          this.setData({
            product: product,
            totalAmount: (product.price || 0) * this.data.quantity,
            actualAmount: (product.price || 0) * this.data.quantity,
            loading: false
          })
          // 如果有商户ID，加载商户信息
          if (product.merchant) {
            this.loadMerchantInfo(product.merchant)
          }
        } else {
          this.setData({ loading: false })
          wx.showToast({
            title: res.data.message || '加载商品信息失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
      }
    })
  },

  // 加载商户信息
  loadMerchantInfo(merchantId) {
    wx.request({
      url: `${API_BASE_URL}/merchant/profile/${merchantId}/`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          const merchant = res.data.data || {}
          this.setData({
            shop: {
              id: merchant.id,
              name: merchant.shop_name,
              address: merchant.shop_address,
              phone: merchant.shop_phone
            }
          })
        }
      }
    })
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        contactName: userInfo.name || '',
        contactPhone: userInfo.phone || '',
        address: userInfo.address || ''
      })
    }
  },

  // 显示取餐方式弹窗
  showPickupTypePopup() {
    this.setData({ showPickupTypeModal: true })
  },

  // 隐藏取餐方式弹窗
  hidePickupTypePopup() {
    this.setData({ showPickupTypeModal: false })
  },

  // 选择取餐方式
  onPickupTypeSelect(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ pickupType: type })
    this.hidePickupTypePopup()
  },

  // 取餐方式变更
  onPickupTypeChange(e) {
    this.setData({ pickupType: e.detail })
  },

  // 表单输入处理
  onContactNameChange(e) {
    this.setData({ contactName: e.detail })
    this.checkCanSubmit()
  },

  onContactPhoneChange(e) {
    this.setData({ contactPhone: e.detail })
    this.checkCanSubmit()
  },

  onAddressChange(e) {
    this.setData({ address: e.detail })
    this.checkCanSubmit()
  },

  onNoteChange(e) {
    this.setData({ note: e.detail })
  },

  // 数量变更
  onQuantityChange(e) {
    const quantity = parseInt(e.detail) || 1
    this.setData({ quantity })
    this.calculateAmount()
  },

  // 加载可用优惠券
  loadAvailableCoupons() {
    const token = wx.getStorageSync('token')
    if (!token) {
      return
    }

    wx.request({
      url: `${API_BASE_URL}/merchant/user/coupons/`,
      method: 'GET',
      data: {
        status: 'valid'  // 获取有效的（未使用的）优惠券
      },
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        console.log('可用优惠券响应:', res.data)
        if (res.statusCode === 200 && res.data.success) {
          const coupons = res.data.data || []
          console.log('可用优惠券列表:', coupons)
          this.setData({ availableCoupons: coupons })
        }
      },
      fail: (err) => {
        console.error('加载优惠券失败:', err)
      }
    })
  },

  // 计算金额
  calculateAmount() {
    const { product, quantity, selectedCoupon } = this.data
    const price = parseFloat(product.price) || 0
    const total = price * quantity
    // 优惠券数据是嵌套结构，需要从 coupon_info 中获取金额
    const discount = selectedCoupon && selectedCoupon.coupon_info
      ? parseFloat(selectedCoupon.coupon_info.amount || 0)
      : 0
    this.setData({
      totalAmount: total.toFixed(2),
      discountAmount: discount.toFixed(2),
      actualAmount: Math.max(0, total - discount).toFixed(2)
    })
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { pickupType, contactName, contactPhone, address } = this.data
    let canSubmit = false

    if (pickupType === 'pickup') {
      canSubmit = contactName && contactPhone
    } else {
      canSubmit = contactName && contactPhone && address
    }

    this.setData({ canSubmit })
  },

  // 显示优惠券弹窗
  showCouponPopup() {
    this.setData({ showCouponModal: true })
  },

  // 隐藏优惠券弹窗
  hideCouponPopup() {
    this.setData({ showCouponModal: false })
  },

  // 选择优惠券
  onCouponSelect(e) {
    const coupon = e.currentTarget.dataset.coupon
    this.setData({
      selectedCoupon: coupon || null
    })
    this.calculateAmount()
    this.hideCouponPopup()
  },

  // 提交订单
  onSubmitOrder() {
    const { productId, quantity, pickupType, contactName, contactPhone, address, note, selectedCoupon, shop, product } = this.data

    // 验证表单
    if (!contactName || !contactPhone) {
      wx.showToast({
        title: '请填写联系人信息',
        icon: 'none'
      })
      return
    }

    if (pickupType === 'delivery' && !address) {
      wx.showToast({
        title: '请填写配送地址',
        icon: 'none'
      })
      return
    }

    // 检查商户ID
    const merchantId = shop.id || product.merchant
    if (!merchantId) {
      wx.showToast({
        title: '商户信息缺失',
        icon: 'none'
      })
      return
    }

    this.setData({ submitting: true })

    // 构建订单数据 - 按照后端 API 格式
    const orderData = {
      merchant_id: merchantId,
      order_items: [
        {
          product_id: productId,
          product_name: product.name || '未知商品',
          quantity: quantity,
          price: product.price || 0
        }
      ],
      pickup_type: pickupType,
      contact_name: contactName,
      contact_phone: contactPhone,
      address: pickupType === 'delivery' ? address : shop.address,
      note: note || ''
    }

    if (selectedCoupon && selectedCoupon.id) {
      orderData.user_coupon_id = selectedCoupon.id
    }

    console.log('提交订单数据:', orderData)

    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/login/login'
        })
      }, 1500)
      this.setData({ submitting: false })
      return
    }

    wx.request({
      url: `${API_BASE_URL}/merchant/orders/create/`,
      method: 'POST',
      data: orderData,
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('订单创建响应:', res.data)
        console.log('响应状态码:', res.statusCode)

        if (res.statusCode === 401 || res.statusCode === 403) {
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          })
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/login/login'
            })
          }, 1500)
          return
        }

        if (res.statusCode === 201 && res.data.success) {
          wx.showToast({
            title: '下单成功',
            icon: 'success'
          })
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/profile/orders/orders'
            })
          }, 1500)
        } else {
          const errorMsg = res.data.message || '下单失败'
          if (res.data.errors) {
            console.error('验证错误:', res.data.errors)
          }
          wx.showToast({
            title: errorMsg,
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('订单创建失败:', err)
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      },
      complete: () => {
        this.setData({ submitting: false })
      }
    })
  }
})
