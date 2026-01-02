const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    houseList: [],
    loading: false
  },

  onLoad() {
    this.loadHouseList()
  },

  onShow() {
    this.loadHouseList()
  },

  loadHouseList() {
    this.setData({ loading: true })
    
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.user_id) {
      this.setData({ loading: false })
      return
    }

    wx.request({
      url: API_BASE_URL + '/property/house/my-houses?user_id=' + userInfo.user_id,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            houseList: res.data.data || [],
            loading: false
          })
        } else {
          this.setData({ loading: false })
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

  onAddHouse() {
    wx.navigateTo({
      url: '/pages/house/binding/binding'
    })
  },

  onHouseClick(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/house/info/info?id=' + id
    })
  },

  onUnbind(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认解绑',
      content: '确定要解绑这个房屋吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: API_BASE_URL + '/property/house/binding/unbind/' + id,
            method: 'DELETE',
            header: {
              'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
              if (res.statusCode === 200) {
                wx.showToast({
                  title: '解绑成功',
                  icon: 'success'
                })
                this.loadHouseList()
              }
            }
          })
        }
      }
    })
  },

  onPullDownRefresh() {
    this.loadHouseList()
    wx.stopPullDownRefresh()
  }
})
