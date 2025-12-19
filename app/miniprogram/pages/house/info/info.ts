// pages/house/info/info.ts
interface HouseInfo {
  id: number
  building: string
  unit: string
  room: string
  area: string
  status: string
  identity: string
  applicantName: string
  applicantPhone: string
  bindingTime: string
}

Page({
  data: {
    houseInfo: null as HouseInfo | null,
    loading: true,
    showUnbindDialog: false
  },

  onLoad() {
    this.loadHouseInfo();
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadHouseInfo();
  },

  // 获取用户房屋信息
  loadHouseInfo() {
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

    wx.showLoading({ title: '加载中...' });

    wx.request({
      url: `http://127.0.0.1:8000/api/property/house/my-houses?user_id=${userInfo.user_id}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res: any) => {
        wx.hideLoading();
        console.log('房屋信息响应:', res.data);
        
        if (res.statusCode === 200 && res.data.code === 200) {
          const houses = res.data.data;
          if (houses && houses.length > 0) {
            // 取第一个绑定的房屋
            const house = houses[0];
            this.setData({
              houseInfo: {
                id: house.id,
                building: (house.house_info && house.house_info.building_name) || house.building_name || '-',
                unit: (house.house_info && house.house_info.unit_name) || house.unit_name || '-', 
                room: (house.house_info && house.house_info.room_number) || house.room_number || '-',
                area: (house.house_info && house.house_info.area) || '-',
                status: this.getStatusText(house.status_display || house.status),
                identity: this.getIdentityText(house.identity_display || house.identity),
                applicantName: (house.applicant_info && house.applicant_info.name) || house.applicant_name || '-',
                applicantPhone: (house.applicant_info && house.applicant_info.phone) || house.applicant_phone || '-',
                bindingTime: this.formatTime(house.created_at)
              },
              loading: false
            });
          } else {
            // 没有绑定房屋，跳转到绑定页面
            wx.redirectTo({
              url: '/pages/house/binding/binding'
            });
          }
        } else {
          wx.showToast({
            title: res.data.message || '获取房屋信息失败',
            icon: 'none'
          });
          this.setData({ loading: false });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('获取房屋信息失败:', err);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    });
  },

  // 状态文本转换
  getStatusText(status: any): string {
    if (typeof status === 'string') return status;
    const statusMap: Record<number, string> = {
      1: '已绑定',
      2: '已解绑'
    };
    return statusMap[status] || '未知';
  },

  // 身份文本转换
  getIdentityText(identity: any): string {
    if (typeof identity === 'string') return identity;
    const identityMap: Record<number, string> = {
      1: '业主',
      2: '家属',
      3: '租客'
    };
    return identityMap[identity] || '未知';
  },

  // 时间格式化
  formatTime(timeStr: string): string {
    if (!timeStr) return '-';
    const date = new Date(timeStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  // 重新绑定
  onRebind() {
    wx.navigateTo({
      url: '/pages/house/binding/binding'
    });
  },

  // 显示解绑确认对话框
  onUnbind() {
    this.setData({ showUnbindDialog: true });
  },

  // 确认解绑
  onConfirmUnbind() {
    if (!this.data.houseInfo) return;

    wx.showLoading({ title: '解绑中...' });

    wx.request({
      url: `http://127.0.0.1:8000/api/property/house/binding/unbind/${this.data.houseInfo.id}`,
      method: 'PATCH',
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res: any) => {
        wx.hideLoading();
        console.log('解绑响应:', res.data);
        
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '解绑成功',
            icon: 'success'
          });
          this.setData({ showUnbindDialog: false });
          // 解绑成功后跳转到绑定页面
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/house/binding/binding'
            });
          }, 1500);
        } else {
          wx.showToast({
            title: res.data.message || '解绑失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('解绑失败:', err);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
  },

  // 取消解绑
  onCancelUnbind() {
    this.setData({ showUnbindDialog: false });
  }
});