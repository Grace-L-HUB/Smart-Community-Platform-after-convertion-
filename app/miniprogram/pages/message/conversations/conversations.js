// pages/message/conversations/conversations.js
const { API_BASE_URL } = require('../../../config/api.js')

Page({
  data: {
    conversations: [],
    loading: false
  },

  onLoad() {
    this.loadConversations()
  },

  onShow() {
    // 每次显示时刷新列表
    this.loadConversations()
  },

  onPullDownRefresh() {
    this.loadConversations()
  },

  getUserInfo() {
    return wx.getStorageSync('userInfo') || {}
  },

  loadConversations() {
    const userInfo = this.getUserInfo()
    if (!userInfo.user_id) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    wx.request({
      url: API_BASE_URL + '/community/conversations/',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (userInfo.token || '')
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const results = res.data.results || res.data || []
          const conversations = results.map(item => {
            // 获取对方用户信息
            const otherUser = item.participant1.id === userInfo.user_id ? item.participant2 : item.participant1

            return {
              id: item.id,
              userName: otherUser.username || otherUser.display_name || '用户',
              userAvatar: otherUser.avatar || '',
              lastMessage: item.last_message ? item.last_message.content : '暂无消息',
              lastMessageTime: item.last_message_time || item.updated_at,
              unreadCount: item.unread_count_p1 === 0 && item.unread_count_p2 === 0
                ? 0
                : (item.participant1.id === userInfo.user_id ? item.unread_count_p1 : item.unread_count_p2),
              marketItem: item.market_item,
              marketItemId: item.market_item?.id
            }
          })
          this.setData({ conversations })
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => {
        this.setData({ loading: false })
        wx.stopPullDownRefresh()
      }
    })
  },

  // 格式化时间
  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now - date

    // 今天
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return date.getHours().toString().padStart(2, '0') + ':' +
             date.getMinutes().toString().padStart(2, '0')
    }
    // 昨天
    if (diff < 48 * 60 * 60 * 1000) {
      return '昨天'
    }
    // 更早
    return (date.getMonth() + 1) + '-' + date.getDate()
  },

  // 点击会话进入聊天
  onConversationTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: '/pages/message/chat/chat?id=' + id
    })
  },

  // 开始新会话（从商品详情进入）
  startNewConversation(targetUserId, marketItemId) {
    const userInfo = this.getUserInfo()
    if (!userInfo.user_id) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    wx.showLoading({ title: '加载中...' })

    wx.request({
      url: API_BASE_URL + '/community/conversations/start/',
      method: 'POST',
      data: {
        target_user_id: targetUserId,
        market_item_id: marketItemId
      },
      header: {
        'Authorization': 'Bearer ' + (userInfo.token || ''),
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          wx.hideLoading()
          // 跳转到聊天页面
          wx.navigateTo({
            url: '/pages/message/chat/chat?id=' + res.data.id
          })
        } else {
          wx.hideLoading()
          wx.showToast({ title: '创建会话失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  }
})