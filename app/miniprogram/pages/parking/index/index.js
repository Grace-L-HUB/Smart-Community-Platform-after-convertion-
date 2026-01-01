const API_BASE_URL = require('../../config/api.js').API_BASE_URL

Page({
  data: {
    parkingList: [],
    loading: false
  },

  onLoad() {
    this.loadParkingList()
  },

  onShow() {
    this.loadParkingList()
  },

  loadParkingList() {
    this.setData({ loading: true })
    
    wx.request({
      url: API_BASE_URL + '/parking/list/',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            parkingList: res.data.data || [],
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

  onAddParking() {
    wx.navigateTo({
      url: '/pages/parking/binding/binding'
    })
  },

  onParkingClick(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/parking/info/info?id=' + id
    })
  },

  onUnbind(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认解绑',
      content: '确定要解绑这个车位吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: API_BASE_URL + '/parking/unbind/' + id + '/',
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
                this.loadParkingList()
              }
            }
          })
        }
      }
    })
  },

  onPullDownRefresh() {
    this.loadParkingList()
    wx.stopPullDownRefresh()
  }
})
