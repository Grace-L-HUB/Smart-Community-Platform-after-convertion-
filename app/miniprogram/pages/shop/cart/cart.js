const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    loading: false,
    cartItems: [],
    selectedItems: [],
    selectedCount: 0,
    totalPrice: '0.00',
    isEmpty: true
  },

  onLoad() {
    this.loadCart()
  },

  onShow() {
    this.loadCart()
  },

  // 加载购物车
  loadCart() {
    this.setData({ loading: true })

    wx.request({
      url: `${API_BASE_URL}/merchant/cart/`,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          const data = res.data.data || []

          // 初始化选中状态和格式化价格
          data.forEach(merchant => {
            merchant.allSelected = false
            merchant.items.forEach(item => {
              item.selected = false
              // 确保价格是数字类型，并格式化为字符串
              const price = parseFloat(item.productPrice) || 0
              item.productPrice = price.toFixed(2)
              item.subtotal = parseFloat(item.subtotal) || 0
            })
          })

          this.setData({
            cartItems: data,
            isEmpty: data.length === 0,
            loading: false,
            totalPrice: '0.00',
            selectedCount: 0
          })
        } else {
          this.setData({ loading: false })
          wx.showToast({
            title: res.data?.message || '加载失败',
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

  // 选中商品
  onSelectItem(e) {
    const { merchantIndex, itemIndex } = e.currentTarget.dataset
    const cartItems = this.data.cartItems
    cartItems[merchantIndex].items[itemIndex].selected = !cartItems[merchantIndex].items[itemIndex].selected

    // 检查该商户下的商品是否全部选中
    const merchant = cartItems[merchantIndex]
    const allSelected = merchant.items.every(item => item.selected)
    merchant.allSelected = allSelected

    this.setData({ cartItems })
    this.calculateTotal()
  },

  // 全选商户商品
  onSelectMerchant(e) {
    const { merchantIndex } = e.currentTarget.dataset
    const cartItems = this.data.cartItems
    const merchant = cartItems[merchantIndex]
    const newSelected = !merchant.allSelected

    merchant.items.forEach(item => {
      item.selected = newSelected
    })
    merchant.allSelected = newSelected

    this.setData({ cartItems })
    this.calculateTotal()
  },

  // 计算总价和选中数量
  calculateTotal() {
    let total = 0
    let count = 0
    this.data.cartItems.forEach(merchant => {
      merchant.items.forEach(item => {
        if (item.selected) {
          total += item.subtotal
          count++
        }
      })
    })
    this.setData({
      totalPrice: total.toFixed(2),
      selectedCount: count
    })
  },

  // 修改数量
  onQuantityChange(e) {
    const { merchantIndex, itemIndex } = e.currentTarget.dataset
    const quantity = parseInt(e.detail) || 1
    const item = this.data.cartItems[merchantIndex].items[itemIndex]

    if (quantity <= 0) {
      this.onDeleteItem(e)
      return
    }

    wx.request({
      url: `${API_BASE_URL}/merchant/cart/${item.id}/update/`,
      method: 'PUT',
      data: { quantity },
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          item.quantity = quantity
          // productPrice 现在是字符串，需要先转为数字
          const price = parseFloat(item.productPrice) || 0
          item.subtotal = parseFloat((price * quantity).toFixed(2))
          this.setData({ cartItems: this.data.cartItems })
          this.calculateTotal()
        }
      }
    })
  },

  // 删除商品
  onDeleteItem(e) {
    const { merchantIndex, itemIndex } = e.currentTarget.dataset
    const item = this.data.cartItems[merchantIndex].items[itemIndex]

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个商品吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${API_BASE_URL}/merchant/cart/${item.id}/delete/`,
            method: 'DELETE',
            header: {
              'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
              if (res.statusCode === 200 && res.data.success) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                })
                this.loadCart()
              }
            }
          })
        }
      }
    })
  },

  // 清空购物车
  onClearCart() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${API_BASE_URL}/merchant/cart/clear/`,
            method: 'POST',
            header: {
              'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
              if (res.statusCode === 200 && res.data.success) {
                wx.showToast({
                  title: '购物车已清空',
                  icon: 'success'
                })
                this.loadCart()
              }
            }
          })
        }
      }
    })
  },

  // 去结算
  onCheckout() {
    const selectedProducts = []

    this.data.cartItems.forEach(merchant => {
      merchant.items.forEach(item => {
        if (item.selected) {
          selectedProducts.push({
            productId: item.productId,
            quantity: item.quantity
          })
        }
      })
    })

    if (selectedProducts.length === 0) {
      wx.showToast({
        title: '请选择要结算的商品',
        icon: 'none'
      })
      return
    }

    // 跳转到订单创建页面，传递商品信息
    const orderData = JSON.stringify(selectedProducts)
    wx.navigateTo({
      url: `/pages/order/create/create?type=cart&data=${encodeURIComponent(orderData)}`
    })
  },

  // 去购物
  onGoShop() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadCart()
    wx.stopPullDownRefresh()
  }
})
