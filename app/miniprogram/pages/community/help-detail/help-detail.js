const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    post: {},
    comments: [],
    form: {
      content: ''
    },
    loading: false
  },

  onLoad(options) {
    if (options.id) {
      this.loadPostDetail(options.id)
    }
  },

  loadPostDetail(id) {
    this.setData({ loading: true })
    
    wx.request({
      url: API_BASE_URL + '/community/posts/' + id + '/',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            post: res.data.data || {},
            loading: false
          })
          this.loadComments(id)
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

  loadComments(postId) {
    wx.request({
      url: API_BASE_URL + '/community/posts/' + postId + '/comments/',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            comments: res.data.data || []
          })
        }
      }
    })
  },

  onCommentChange(e) {
    this.setData({
      'form.content': e.detail.value
    })
  },

  onSubmitComment() {
    const { content } = this.data.form
    const postId = this.data.post.id

    if (!content) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      })
      return
    }

    wx.request({
      url: API_BASE_URL + '/community/posts/' + postId + '/comments/',
      method: 'POST',
      data: {
        content: content
      },
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '评论成功',
            icon: 'success'
          })
          this.setData({
            'form.content': ''
          })
          this.loadComments(postId)
        }
      }
    })
  },

  onLike() {
    const postId = this.data.post.id
    wx.request({
      url: API_BASE_URL + '/community/posts/' + postId + '/like/',
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.loadPostDetail(postId)
        }
      }
    })
  }
})
