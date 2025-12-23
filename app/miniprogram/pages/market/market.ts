// 市场页面 - 智慧社区小程序
const API_BASE_URL = 'http://127.0.0.1:8000/api'

Page({
  data: {
    currentCategory: 'all',
    products: [],
    merchants: [],
    categories: [],
    sortOptions: [
      { id: 'newest', name: '最新发布' },
      { id: 'sales', name: '销量最多' },
      { id: 'price_asc', name: '价格最低' },
      { id: 'price_desc', name: '价格最高' },
    ],
    currentSort: 'newest',
    loading: false,
    page: 1,
    hasMore: true
  },

  onLoad() {
    this.loadCategories()
    this.loadProducts()
    this.loadMerchants()
  },

  // 加载分类数据
  loadCategories() {
    wx.request({
      url: `${API_BASE_URL}/merchant/categories/`,
      method: 'GET',
      success: (res) => {
        console.log('分类数据加载成功:', res.data)
        if (res.statusCode === 200 && res.data.success) {
          const categories = res.data.data || []
          // 添加"全部"分类
          this.setData({
            categories: [{ id: 'all', name: '全部' }, ...categories]
          })
        } else {
          console.error('获取分类失败:', res.data)
          // 如果获取分类失败，使用默认分类
          this.setData({
            categories: [
              { id: 'all', name: '全部' },
              { id: 'electronics', name: '数码' },
              { id: 'home', name: '家居' },
              { id: 'clothing', name: '服装' },
              { id: 'food', name: '美食' },
            ]
          })
        }
      },
      fail: (error) => {
        console.error('请求分类数据失败:', error)
        // 如果请求失败，使用默认分类
        this.setData({
          categories: [
            { id: 'all', name: '全部' },
            { id: 'electronics', name: '数码' },
            { id: 'home', name: '家居' },
            { id: 'clothing', name: '服装' },
            { id: 'food', name: '美食' },
          ]
        })
      }
    })
  },

  onPullDownRefresh() {
    this.setData({ products: [], merchants: [], page: 1, hasMore: true })
    this.loadProducts()
    this.loadMerchants()
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadProducts()
    }
  },

  // 加载商品数据
  loadProducts() {
    if (this.data.loading || !this.data.hasMore) return
    
    this.setData({ loading: true })

    const { currentCategory, currentSort, page } = this.data
    const params = new URLSearchParams()
    
    if (currentCategory !== 'all') {
      params.append('category', currentCategory)
    }
    params.append('page', page.toString())
    params.append('page_size', '20')

    wx.request({
      url: `${API_BASE_URL}/merchant/products/public/`,
      method: 'GET',
      data: Object.fromEntries(params),
      success: (res) => {
        console.log('商品数据加载成功:', res.data)
        if (res.statusCode === 200 && res.data.success) {
          const newProducts = res.data.data
          const products = page === 1 ? newProducts : [...this.data.products, ...newProducts]
          
          this.setData({
            products: products,
            page: page + 1,
            hasMore: newProducts.length === 20,
            loading: false
          })
        } else {
          console.error('获取商品失败:', res.data)
          this.setData({ loading: false })
          wx.showToast({ title: '获取商品失败', icon: 'error' })
        }
      },
      fail: (error) => {
        console.error('请求商品数据失败:', error)
        this.setData({ loading: false })
        wx.showToast({ title: '网络请求失败', icon: 'error' })
      }
    })
  },

  // 加载商户数据
  loadMerchants() {
    wx.request({
      url: `${API_BASE_URL}/merchant/profiles/`,
      method: 'GET',
      success: (res) => {
        console.log('商户数据加载成功:', res.data)
        if (res.statusCode === 200 && res.data.success) {
          this.setData({
            merchants: res.data.data
          })
        } else {
          console.error('获取商户失败:', res.data)
          wx.showToast({ title: '获取商户失败', icon: 'error' })
        }
      },
      fail: (error) => {
        console.error('请求商户数据失败:', error)
        wx.showToast({ title: '网络请求失败', icon: 'error' })
      }
    })
  },

  // 选择分类
  onCategoryChange(e: any) {
    const category = e.currentTarget.dataset.category
    this.setData({
      currentCategory: category,
      products: [],
      page: 1,
      hasMore: true
    })
    this.loadProducts()
  },

  // 选择排序
  onSortChange(e: any) {
    const sort = e.currentTarget.dataset.sort
    this.setData({
      currentSort: sort,
      products: [],
      page: 1,
      hasMore: true
    })
    this.loadProducts()
  },

  // 查看商品详情
  viewProduct(e: any) {
    const productId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/market/product-detail/product-detail?id=${productId}`
    })
  },

  // 查看商户详情
  viewMerchant(e: any) {
    const merchantId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/market/merchant-detail/merchant-detail?id=${merchantId}`
    })
  },

  // 搜索商品
  onSearch(e: any) {
    const keyword = e.detail
    // 这里可以添加搜索功能
    console.log('搜索关键词:', keyword)
  }
})