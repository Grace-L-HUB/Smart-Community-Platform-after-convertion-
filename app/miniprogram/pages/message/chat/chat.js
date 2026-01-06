// pages/message/chat/chat.js
const { API_BASE_URL } = require('../../../config/api.js')

Page({
  data: {
    conversationId: null,
    messages: [],
    inputContent: '',
    loading: false,
    otherUser: null,
    marketItem: null,
    pollingTimer: null
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ conversationId: options.id })
      this.loadMessages()
      this.startPolling()
    }
  },

  onUnload() {
    this.stopPolling()
  },

  onHide() {
    this.stopPolling()
  },

  onShow() {
    if (this.data.conversationId) {
      this.loadMessages()
      this.startPolling()
    }
  },

  getUserInfo() {
    return wx.getStorageSync('userInfo') || {}
  },

  loadMessages() {
    const userInfo = this.getUserInfo()
    if (!userInfo.user_id) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    wx.request({
      url: API_BASE_URL + '/community/conversations/' + this.data.conversationId + '/messages/',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (userInfo.token || '')
      },
      success: (res) => {
        if (res.statusCode === 200) {
          console.log('完整响应数据:', res.data)
          const results = res.data.results || res.data || []
          console.log('原始消息数据:', results)
          const messages = results.map(item => ({
            id: item.id,
            content: item.content,
            isSelf: item.sender && item.sender.id === userInfo.user_id,
            senderId: item.sender && item.sender.id,
            senderName: (item.sender && (item.sender.nickname || item.sender.display_name)) || '未知用户',
            senderAvatar: (item.sender && item.sender.avatar) || '',
            time: item.created_at,
            messageType: item.message_type
          }))
          console.log('处理后的消息数据:', messages)

          // 获取对方用户信息
          let otherUser = null
          let marketItem = null
          if (results.length > 0) {
            const firstMsg = results[0]
            otherUser = firstMsg.sender.id === userInfo.user_id ? firstMsg.receiver : firstMsg.sender
            if (firstMsg.market_item) {
              // market_item 现在是完整的 MarketItemListSerializer 对象
              marketItem = firstMsg.market_item
            }
          }

          this.setData({
            messages,
            otherUser,
            marketItem
          })
          console.log('setData后的messages:', this.data.messages)
          this.scrollToBottom()
        }
      },
      fail: () => {
        wx.showToast({ title: '加载失败', icon: 'none' })
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  // 轮询新消息
  startPolling() {
    this.stopPolling()
    this.data.pollingTimer = setInterval(() => {
      this.pollNewMessages()
    }, 3000)
  },

  stopPolling() {
    if (this.data.pollingTimer) {
      clearInterval(this.data.pollingTimer)
      this.setData({ pollingTimer: null })
    }
  },

  pollNewMessages() {
    const userInfo = this.getUserInfo()
    if (!userInfo.user_id || !this.data.conversationId) return

    const lastMessage = this.data.messages[this.data.messages.length - 1]
    if (!lastMessage) return

    wx.request({
      url: API_BASE_URL + '/community/conversations/' + this.data.conversationId + '/poll/',
      method: 'GET',
      data: {
        since: lastMessage.time
      },
      header: {
        'Authorization': 'Bearer ' + (userInfo.token || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.length > 0) {
          const newMessages = res.data.map(item => ({
            id: item.id,
            content: item.content,
            isSelf: item.sender && item.sender.id === userInfo.user_id,
            senderId: item.sender && item.sender.id,
            senderName: (item.sender && (item.sender.nickname || item.sender.display_name)) || '未知用户',
            senderAvatar: (item.sender && item.sender.avatar) || '',
            time: item.created_at,
            messageType: item.message_type
          }))

          this.setData({
            messages: [...this.data.messages, ...newMessages]
          })
          this.scrollToBottom()
        }
      }
    })
  },

  onInputChange(e) {
    this.setData({
      inputContent: e.detail.value
    })
  },

  onSend() {
    const { inputContent, conversationId } = this.data

    if (!inputContent.trim()) {
      wx.showToast({
        title: '请输入消息内容',
        icon: 'none'
      })
      return
    }

    const userInfo = this.getUserInfo()
    wx.request({
      url: API_BASE_URL + '/community/conversations/' + conversationId + '/send/',
      method: 'POST',
      data: {
        content: inputContent,
        message_type: 'text'
      },
      header: {
        'Authorization': 'Bearer ' + (userInfo.token || ''),
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          this.setData({
            inputContent: ''
          })
          this.loadMessages()
        }
      },
      fail: () => {
        wx.showToast({
          title: '发送失败',
          icon: 'none'
        })
      }
    })
  },

  scrollToBottom() {
    setTimeout(() => {
      wx.pageScrollTo({
        selector: '.message-list',
        scrollTop: 999999
      })
    }, 100)
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    return date.getHours().toString().padStart(2, '0') + ':' +
           date.getMinutes().toString().padStart(2, '0')
  },

  // 查看商品详情
  viewProduct() {
    if (this.data.marketItem) {
      wx.navigateTo({
        url: '/pages/community/market-detail/market-detail?id=' + this.data.marketItem.id
      })
    }
  }
})