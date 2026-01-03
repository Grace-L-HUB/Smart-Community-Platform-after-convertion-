const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    // 帖子数据
    id: null,
    title: '',
    content: '',
    images: [],
    location: '',
    phone: '',
    reward: null,
    category: '',
    isUrgent: false,

    // 发布者信息
    publisher: {
      name: '',
      avatar: ''
    },
    publishTime: '',

    // 响应列表
    responses: [],
    isOwner: false,

    // 当前用户ID
    currentUserId: null,

    loading: false
  },

  onLoad(options) {
    const userId = wx.getStorageSync('userId')
    this.setData({ currentUserId: userId })

    if (options.id) {
      this.setData({ id: options.id })
      this.loadPostDetail(options.id)
    }
  },

  loadPostDetail(id) {
    this.setData({ loading: true })

    wx.request({
      url: API_BASE_URL + '/community/help-posts/' + id + '/',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        console.log('互助详情响应:', res.data)
        // DRF 直接返回数据对象，没有 code 包装
        if (res.statusCode === 200) {
          const post = res.data || {}
          const publisher = post.publisher || {}

          // 判断是否是发布者
          const isOwner = this.data.currentUserId === publisher.id

          // 处理图片
          const images = (post.images || []).map(img => img.image)

          // 处理头像：将 localhost 替换为空字符串
          let avatarUrl = publisher.avatar || ''
          if (avatarUrl.includes('localhost')) {
            avatarUrl = ''  // 本地开发时头像无法访问，使用默认图标
          }

          // 判断是否紧急
          const isUrgent = post.category === '紧急求助' || post.title?.includes('紧急')

          this.setData({
            title: post.title || '',
            content: post.content || '',
            images: images,
            location: post.location || '',
            phone: post.phone || '',
            reward: post.reward || null,
            category: post.category || 'help',
            isUrgent: isUrgent,

            publisher: {
              name: publisher.nickname || publisher.display_name || '未知用户',
              avatar: avatarUrl
            },
            publishTime: post.time_ago || post.created_at || '',

            responses: post.responses || [],
            isOwner: isOwner,

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

  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      current: url,
      urls: this.data.images
    })
  },

  // 我来帮忙
  onHelp() {
    const { id, publisher, phone, location } = this.data

    // 构建回复消息
    let message = `你好，我看到你发布的求助"${this.data.title}"`
    if (location) {
      message += `，我在${location}附近`
    }
    message += '，可以帮你。'

    // 显示提示
    wx.showModal({
      title: '我来帮忙',
      content: '是否确认响应此求助？',
      success: (res) => {
        if (res.confirm) {
          // 这里应该调用API创建响应记录
          // 暂时只显示提示
          wx.showToast({
            title: '响应成功',
            icon: 'success'
          })
          // 重新加载数据
          this.loadPostDetail(id)
        }
      }
    })
  },

  // 联系
  onContact(e) {
    const { phone } = this.data
    if (phone) {
      wx.makePhoneCall({
        phoneNumber: phone
      })
    } else {
      wx.showToast({
        title: '未留联系方式',
        icon: 'none'
      })
    }
  },

  // 编辑
  onEdit() {
    wx.showToast({
      title: '编辑功能开发中',
      icon: 'none'
    })
  },

  // 删除
  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条求助吗？',
      success: (res) => {
        if (res.confirm) {
          const { id } = this.data
          wx.request({
            url: API_BASE_URL + '/community/help-posts/' + id + '/',
            method: 'DELETE',
            header: {
              'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
              if (res.statusCode === 204) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                })
                setTimeout(() => {
                  wx.navigateBack()
                }, 1500)
              }
            },
            fail: () => {
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },

  // 已解决
  onResolve() {
    wx.showModal({
      title: '标记为已解决',
      content: '确定标记此求助为已解决吗？',
      success: (res) => {
        if (res.confirm) {
          const { id } = this.data
          wx.request({
            url: API_BASE_URL + '/community/help-posts/' + id + '/',
            method: 'PATCH',
            data: {
              status: 'resolved'
            },
            header: {
              'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
              if (res.statusCode === 200) {
                wx.showToast({
                  title: '已标记为解决',
                  icon: 'success'
                })
                this.loadPostDetail(id)
              }
            },
            fail: () => {
              wx.showToast({
                title: '操作失败',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },

  // 分享
  onShare() {
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  onShareAppMessage() {
    const { title } = this.data
    return {
      title: title || '社区求助',
      path: `/pages/community/help-detail/help-detail?id=${this.data.id}`
    }
  }
})
