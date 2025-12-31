// pages/house/index/index.ts
import { API_BASE_URL } from '../../../config/api'

Page({
  data: {
    loading: true
  },

  onLoad() {
    this.checkHouseBinding();
  },

  // 检查用户是否已绑定房屋
  checkHouseBinding() {
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
      url: `${API_BASE_URL}/property/house/my-houses?user_id=${userInfo.user_id}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res: any) => {
        console.log('房屋绑定检查响应:', res.data);
        
        if (res.statusCode === 200 && res.data.code === 200) {
          const houses = res.data.data;
          if (houses && houses.length > 0) {
            // 用户已绑定房屋，跳转到信息页面
            wx.redirectTo({
              url: '/pages/house/info/info'
            });
          } else {
            // 用户未绑定房屋，跳转到绑定页面
            wx.redirectTo({
              url: '/pages/house/binding/binding'
            });
          }
        } else {
          // 接口错误，默认跳转到绑定页面
          wx.redirectTo({
            url: '/pages/house/binding/binding'
          });
        }
      },
      fail: (err) => {
        console.error('检查房屋绑定失败:', err);
        // 网络错误，默认跳转到绑定页面
        wx.redirectTo({
          url: '/pages/house/binding/binding'
        });
      }
    });
  }
});