// pages/notification/notification.js
const { API_BASE_URL } = require('../../config/api.js')

Page({
  data: {
    notifications: [],
    loading: false,
    unreadCount: 0
  },

  onLoad() {
    this.loadNotifications()
  },

  onShow() {
    // 每次显示时刷新通知列表和未读数
    this.loadNotifications()
    this.updateHomeNotificationBadge()
  },

  getUserInfo() {
    return wx.getStorageSync('userInfo') || {}
  },

  loadNotifications() {
    const userInfo = this.getUserInfo()
    if (!userInfo.user_id) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    wx.request({
      url: API_BASE_URL + '/notifications',
      method: 'GET',
      data: { user_id: userInfo.user_id },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          const notifications = res.data.data.list.map(item => ({
            ...item,
            is_read: !!item.is_read
          }))
          this.setData({
            notifications: notifications,
            unreadCount: res.data.data.unread_count
          })
        } else {
          wx.showToast({ title: res.data.message || '加载失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => {
        this.setData({ loading: false })
        // 停止下拉刷新
        wx.stopPullDownRefresh()
      }
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadNotifications()
  },

  // 点击通知项
  onNotificationTap(e) {
    const { id, isread } = e.currentTarget.dataset
    const notification = this.data.notifications.find(n => n.id === id)
    if (!notification) return

    // 如果未读，标记为已读
    if (!isread) {
      this.markAsRead(id)
    }

    // 如果是账单相关通知，跳转到缴费页面
    if (notification.related_object_type === 'bill') {
      wx.navigateTo({
        url: '/pages/payment/payment'
      })
    }
  },

  // 标记为已读
  markAsRead(id) {
    const userInfo = this.getUserInfo()
    wx.request({
      url: API_BASE_URL + '/notifications/' + id + '/mark-read',
      method: 'POST',
      data: { user_id: userInfo.user_id },
      header: {
        'Content-Type': 'application/json'
      },
      success: () => {
        // 更新本地数据
        const notifications = this.data.notifications.map(n => {
          if (n.id === id) {
            return { ...n, is_read: true }
          }
          return n
        })
        const unreadCount = Math.max(0, this.data.unreadCount - 1)
        this.setData({ notifications, unreadCount })
        this.updateHomeNotificationBadge()
      }
    })
  },

  // 全部标记为已读
  markAllAsRead() {
    const userInfo = this.getUserInfo()
    if (this.data.unreadCount === 0) {
      wx.showToast({ title: '没有未读消息', icon: 'none' })
      return
    }

    wx.showLoading({ title: '处理中...' })

    wx.request({
      url: API_BASE_URL + '/notifications/mark-all-read',
      method: 'POST',
      data: { user_id: userInfo.user_id },
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({ title: '已全部标记为已读', icon: 'success' })
          // 刷新列表
          this.loadNotifications()
        } else {
          wx.showToast({ title: res.data.message || '操作失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  // 更新首页通知角标
  updateHomeNotificationBadge() {
    // 通过全局数据或事件通知首页更新未读数
    const app = getApp()
    if (app.globalData) {
      app.globalData.notificationUnreadCount = this.data.unreadCount
    }
  },

  // 获取通知类型图标
  getNotificationIcon(type) {
    const iconMap = {
      'bill_reminder': 'bill-o',
      'system_notice': 'notice',
      'activity': 'gift-o',
      'repair': 'todo-list-o'
    }
    return iconMap[type] || 'bell'
  },

  // 获取通知类型颜色
  getNotificationColor(type) {
    const colorMap = {
      'bill_reminder': '#ff9800',  // 橙色 - 催缴
      'system_notice': '#1989fa',  // 蓝色 - 系统通知
      'activity': '#07c160',       // 绿色 - 活动
      'repair': '#ff4444'          // 红色 - 报修
    }
    return colorMap[type] || '#999'
  }
})