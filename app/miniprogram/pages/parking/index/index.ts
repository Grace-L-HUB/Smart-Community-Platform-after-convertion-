// pages/parking/index/index.ts
Page({
  data: {
    loading: true
  },

  onLoad() {
    this.checkParkingBinding();
  },

  // 检查用户是否已绑定车位
  checkParkingBinding() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.user_id) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false,
        success: () => {
          wx.reLaunch({
            url: '/pages/login/login'
          });
        }
      });
      return;
    }

    wx.request({
      url: `http://127.0.0.1:8000/api/parking/my-parkings?user_id=${userInfo.user_id}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res: any) => {
        console.log('车位绑定检查响应:', res.data);
        
        if (res.statusCode === 200 && res.data.code === 200) {
          const parkings = res.data.data;
          if (parkings && parkings.length > 0) {
            // 用户已绑定车位，跳转到信息页面
            wx.redirectTo({
              url: '/pages/parking/info/info'
            });
          } else {
            // 用户未绑定车位，跳转到绑定页面
            wx.redirectTo({
              url: '/pages/parking/binding/binding'
            });
          }
        } else {
          // 接口错误，默认跳转到绑定页面
          wx.redirectTo({
            url: '/pages/parking/binding/binding'
          });
        }
      },
      fail: (err) => {
        console.error('检查车位绑定失败:', err);
        // 网络错误，默认跳转到绑定页面
        wx.redirectTo({
          url: '/pages/parking/binding/binding'
        });
      }
    });
  }
});