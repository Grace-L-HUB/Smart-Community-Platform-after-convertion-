const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    houseInfo: {},
    loading: false,
    bindingId: null
  },

  onLoad(options) {
    const bindingId = options.id
    if (!bindingId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }
    this.setData({ bindingId })
    this.loadHouseInfo()
  },

  loadHouseInfo() {
    this.setData({ loading: true })

    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.user_id) {
      this.setData({ loading: false })
      wx.showToast({
        title: '用户未登录',
        icon: 'none'
      })
      return
    }

    wx.request({
      url: `${API_BASE_URL}/property/house/my-houses?user_id=${userInfo.user_id}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          const houseList = res.data.data || []
          const houseInfo = houseList.find(item => item.id === parseInt(this.data.bindingId))
          if (houseInfo) {
            // 格式化数据以匹配页面显示
            const formattedInfo = {
              id: houseInfo.id,
              building: houseInfo.house_info?.building_name || '',
              unit: houseInfo.house_info?.unit || '',
              floor: houseInfo.house_info?.floor || '',
              room: houseInfo.house_info?.room || '',
              area: houseInfo.house_info?.area || '',
              status: houseInfo.status === 1 ? '已认证' : houseInfo.status === 0 ? '审核中' : '已拒绝',
              identity: houseInfo.identity_display || '',
              applicantName: houseInfo.applicant_info?.name || '',
              applicantPhone: houseInfo.applicant_info?.phone || '',
              bindingTime: this.formatDate(houseInfo.created_at)
            }
            this.setData({
              houseInfo: formattedInfo,
              loading: false
            })
          } else {
            this.setData({ loading: false })
            wx.showToast({
              title: '房屋信息不存在',
              icon: 'none'
            })
          }
        } else {
          this.setData({ loading: false })
          wx.showToast({
            title: res.data.message || '加载失败',
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

  formatDate(dateStr) {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  },

  onRefresh() {
    this.loadHouseInfo()
  },

  onRebind() {
    wx.navigateTo({
      url: '/pages/house/binding/binding'
    })
  },

  onUnbind() {
    wx.showModal({
      title: '确认解绑',
      content: '确定要解除房屋绑定吗？解绑后您将失去相关权限。',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${API_BASE_URL}/property/house/binding/unbind/${this.data.bindingId}`,
            method: 'DELETE',
            header: {
              'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
            },
            success: (res) => {
              if (res.statusCode === 200 && res.data.code === 200) {
                wx.showToast({
                  title: '解绑成功',
                  icon: 'success'
                })
                setTimeout(() => {
                  wx.navigateBack()
                }, 1500)
              } else {
                wx.showToast({
                  title: res.data.message || '解绑失败',
                  icon: 'none'
                })
              }
            },
            fail: () => {
              wx.showToast({
                title: '解绑失败',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  }
})
