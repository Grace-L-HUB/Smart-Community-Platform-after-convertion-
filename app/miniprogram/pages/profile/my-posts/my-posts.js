const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    posts: [],
    loading: false,
    activeTab: 'all'
  },

  onLoad() {
    this.loadPosts()
  },

  onShow() {
    this.loadPosts()
  },

  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    this.loadPosts()
  },

  loadPosts() {
    this.setData({ loading: true })
    
    wx.request({
      url: API_BASE_URL + '/community/posts/',
      method: 'GET',
      data: {
        tab: this.data.activeTab
      },
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            posts: res.data.data || [],
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
    wx.navigateTo({
      url: '/pages/community/help-detail/help-detail?id=' + postId
    })
  },

  onDeletePost(e) {
    const postId = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条帖子吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: API_BASE_URL + '/community/posts/' + postId + '/',
            method: 'DELETE',
            header: {
              'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
              if (res.statusCode === 200) {
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
  }
})
