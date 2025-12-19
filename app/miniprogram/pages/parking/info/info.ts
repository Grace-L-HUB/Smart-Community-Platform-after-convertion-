// pages/parking/info/info.ts
interface ParkingInfo {
  id: number
  area: string
  parkingNo: string
  parkingType: string
  carNo: string
  carBrand: string
  carColor: string
  ownerName: string
  ownerPhone: string
  identity: string
  status: string
  bindingTime: string
}

Page({
  data: {
    parkingInfo: null as ParkingInfo | null,
    loading: true,
    showUnbindDialog: false
  },

  onLoad() {
    this.loadParkingInfo();
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadParkingInfo();
  },

  // 获取用户车位信息
  loadParkingInfo() {
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
      url: `http://127.0.0.1:8000/api/parking/my-parkings?user_id=${userInfo.user_id}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res: any) => {
        wx.hideLoading();
        console.log('车位信息响应:', res.data);
        
        if (res.statusCode === 200 && res.data.code === 200) {
          const parkings = res.data.data;
          if (parkings && parkings.length > 0) {
            // 取第一个绑定的车位
            const parking = parkings[0];
            this.setData({
              parkingInfo: {
                id: parking.id,
                area: parking.parking_info?.parking_area || parking.parking_area || '-',
                parkingNo: parking.parking_info?.parking_no || parking.parking_no || '-',
                parkingType: this.getParkingTypeText(parking.parking_info?.parking_type || parking.parking_type),
                carNo: parking.parking_info?.car_no || parking.car_no || '-',
                carBrand: parking.parking_info?.car_brand || parking.car_brand || '-',
                carColor: parking.parking_info?.car_color || parking.car_color || '-',
                ownerName: parking.parking_info?.owner_name || parking.owner_name || '-',
                ownerPhone: parking.parking_info?.owner_phone || parking.owner_phone || '-',
                identity: this.getIdentityText(parking.identity_display || parking.identity),
                status: this.getStatusText(parking.status_display || parking.status),
                bindingTime: this.formatTime(parking.created_at)
              },
              loading: false
            });
          } else {
            // 没有绑定车位，跳转到绑定页面
            wx.redirectTo({
              url: '/pages/parking/binding/binding'
            });
          }
        } else {
          wx.showToast({
            title: res.data.message || '获取车位信息失败',
            icon: 'none'
          });
          this.setData({ loading: false });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('获取车位信息失败:', err);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    });
  },

  // 车位类型文本转换
  getParkingTypeText(type: any): string {
    if (typeof type === 'string') {
      return type === 'owned' ? '自有车位' : type === 'rented' ? '租赁车位' : type;
    }
    return '未知';
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
      url: '/pages/parking/binding/binding'
    });
  },

  // 显示解绑确认对话框
  onUnbind() {
    this.setData({ showUnbindDialog: true });
  },

  // 确认解绑
  onConfirmUnbind() {
    if (!this.data.parkingInfo) return;

    wx.showLoading({ title: '解绑中...' });

    wx.request({
      url: `http://127.0.0.1:8000/api/parking/binding/unbind/${this.data.parkingInfo.id}`,
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
              url: '/pages/parking/binding/binding'
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