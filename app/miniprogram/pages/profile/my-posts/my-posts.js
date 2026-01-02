const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    posts: [],
    loading: false,
    activeTab: 'market'
  },

  onLoad() {
    this.loadPosts()
  },

  onShow() {
    this.loadPosts()
  },

  onTabChange(e) {
    const index = e.detail.name
    const tabs = ['market', 'help']
    const tab = tabs[index] || 'market'
    this.setData({ activeTab: tab })
    this.loadPosts()
  },

  loadPosts() {
    this.setData({ loading: true })
    
    let url = ''
    if (this.data.activeTab === 'market') {
      url = API_BASE_URL + '/community/market-items/'
    } else if (this.data.activeTab === 'help') {
      url = API_BASE_URL + '/community/help-posts/'
    }
    
    wx.request({
      url: url,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200) {
          let posts = []
          if (this.data.activeTab === 'market' && res.data.results) {
            posts = res.data.results.map(item => ({
              id: item.id,
              title: item.title,
              image: item.first_image || '',
              price: item.price,
              time: item.time_ago,
              views: item.view_count,
              type: 'market'
            }))
          } else if (this.data.activeTab === 'help' && res.data.results) {
            posts = res.data.results.map(item => ({
              id: item.id,
              title: item.title,
              image: '',
              time: item.time_ago,
              views: item.view_count,
              type: 'help'
            }))
          }
          
          this.setData({
            posts: posts,
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

  onPostClick(e) {
    const postId = e.currentTarget.dataset.id
    const type = e.currentTarget.dataset.type
    
    if (type === 'market') {
      wx.navigateTo({
        url: '/pages/community/market-detail/market-detail?id=' + postId
      })
    } else if (type === 'help') {
      wx.navigateTo({
        url: '/pages/community/help-detail/help-detail?id=' + postId
      })
    }
  },

  onEdit(e) {
    const postId = e.currentTarget.dataset.id
    const type = e.currentTarget.dataset.type
    
    if (type === 'market') {
      wx.showToast({
        title: '编辑功能开发中',
        icon: 'none'
      })
    } else if (type === 'help') {
      wx.showToast({
        title: '编辑功能开发中',
        icon: 'none'
      })
    }
  },

  onDelete(e) {
    const postId = e.currentTarget.dataset.id
    const type = e.currentTarget.dataset.type
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条内容吗？',
      success: (res) => {
        if (res.confirm) {
          let url = ''
          if (type === 'market') {
            url = API_BASE_URL + '/community/market-items/' + postId + '/'
          } else if (type === 'help') {
            url = API_BASE_URL + '/community/help-posts/' + postId + '/'
          }
          
          wx.request({
            url: url,
            method: 'DELETE',
            header: {
              'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
              if (res.statusCode === 200 || res.statusCode === 204) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                })
                this.loadPosts()
              }
            }
          })
        }
      }
    })
  },

  onPullDownRefresh() {
    this.loadPosts()
    wx.stopPullDownRefresh()
  },

  stopPropagation() {
  }
})
