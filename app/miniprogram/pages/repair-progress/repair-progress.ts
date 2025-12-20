// pages/repair-progress/repair-progress.ts
Page({
  data: {
    // 搜索和筛选
    keyword: '',
    statusFilter: '',
    typeFilter: '',
    statusOptions: [
      { text: '全部状态', value: '' },
      { text: '待受理', value: 'pending' },
      { text: '处理中', value: 'processing' },
      { text: '已完成', value: 'completed' },
      { text: '已驳回', value: 'rejected' }
    ],
    typeOptions: [
      { text: '全部类型', value: '' },
      { text: '水电', value: 'water' },
      { text: '电气', value: 'electric' },
      { text: '门窗', value: 'door' },
      { text: '公区', value: 'public' },
      { text: '其他', value: 'other' }
    ],
    
    // 工单列表
    orderList: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    
    // 详情弹窗
    showDetail: false,
    selectedOrder: null,
    
    // 评价相关
    rating: 5,
    ratingComment: ''
  },

  onLoad() {
    this.loadOrderList(true);
  },

  // 加载工单列表
  loadOrderList(refresh = false) {
    if (this.data.loading) return;
    
    if (refresh) {
      this.setData({ page: 1, hasMore: true, orderList: [] });
    }
    
    // 获取用户信息
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
    
    this.setData({ loading: true });
    
    // 构建请求参数
    let queryParams = `page=${this.data.page}&page_size=${this.data.pageSize}&user_id=${userInfo.user_id}`;
    if (this.data.statusFilter) {
      queryParams += `&status=${this.data.statusFilter}`;
    }
    if (this.data.typeFilter) {
      queryParams += `&type=${this.data.typeFilter}`;
    }
    if (this.data.keyword) {
      queryParams += `&keyword=${encodeURIComponent(this.data.keyword)}`;
    }
    
    wx.request({
      url: `http://127.0.0.1:8000/api/property/repair-orders?${queryParams}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res: any) => {
        console.log('工单列表响应:', res.data);
        
        if (res.statusCode === 200 && res.data.code === 200) {
          const data = res.data.data;
          // 格式化时间显示
          const formattedList = data.list.map(order => ({
            ...order,
            created_at: this.formatTime(order.created_at),
            assigned_at: order.assigned_at ? this.formatTime(order.assigned_at) : '',
            completed_at: order.completed_at ? this.formatTime(order.completed_at) : '',
            rated_at: order.rated_at ? this.formatTime(order.rated_at) : ''
          }));
          
          const newList = refresh ? formattedList : [...this.data.orderList, ...formattedList];
          
          this.setData({
            orderList: newList,
            hasMore: this.data.page < data.total_pages,
            page: this.data.page + 1,
            loading: false
          });
        } else {
          console.error('获取工单列表失败:', res.data);
          // 使用备用数据
          const mockData = this.getMockOrderList();
          const newList = refresh ? mockData.list : [...this.data.orderList, ...mockData.list];
          this.setData({
            orderList: newList,
            hasMore: mockData.hasMore,
            page: this.data.page + 1,
            loading: false
          });
        }
      },
      fail: (err) => {
        console.error('获取工单列表网络请求失败:', err);
        // 使用备用数据
        const mockData = this.getMockOrderList();
        const newList = refresh ? mockData.list : [...this.data.orderList, ...mockData.list];
        this.setData({
          orderList: newList,
          hasMore: mockData.hasMore,
          page: this.data.page + 1,
          loading: false
        });
      }
    });
  },

  // 格式化时间显示
  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    
    const time = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - time.getTime();
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // 今天，显示时:分
      return time.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (diffDays === 1) {
      // 昨天
      return '昨天 ' + time.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (diffDays < 7) {
      // 一周内，显示星期
      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      return `周${weekdays[time.getDay()]} ${time.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })}`;
    } else {
      // 超过一周，显示完整日期
      return time.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
  },

  // 模拟数据
  getMockOrderList() {
    const mockOrders = [
      {
        id: 1,
        order_no: 'WO20241220001',
        category: 'household',
        category_display: '入户维修',
        repair_type: 'water',
        type_display: '水电',
        priority: 'medium',
        priority_display: '紧急',
        summary: '厨房水龙头漏水',
        description: '厨房洗菜盆水龙头漏水严重，需要及时维修',
        location: '1号楼1单元101室厨房',
        status: 'processing',
        status_display: '处理中',
        assignee: '张师傅',
        assigned_at: '2024-12-20 10:30',
        created_at: this.formatTime('2024-12-20 09:15'),
        reporter_name: '张三',
        reporter_phone: '13800138000'
      },
      {
        id: 2,
        order_no: 'WO20241219002',
        category: 'public',
        category_display: '公共区域',
        repair_type: 'electric',
        type_display: '电气',
        priority: 'low',
        priority_display: '一般',
        summary: '楼道灯不亮',
        description: '2楼楼道灯泡坏了，晚上很暗',
        location: '1号楼2楼楼道',
        status: 'completed',
        status_display: '已完成',
        assignee: '李师傅',
        assigned_at: '2024-12-19 14:20',
        completed_at: '2024-12-19 16:45',
        result: '已更换LED灯泡，测试正常',
        cost: '25.00',
        created_at: this.formatTime('2024-12-19 13:45'),
        reporter_name: '李四',
        reporter_phone: '13900139000',
        is_rated: false
      }
    ];
    
    return {
      list: mockOrders,
      hasMore: false
    };
  },

  // 搜索
  onSearch() {
    this.loadOrderList(true);
  },

  onSearchChange(event: any) {
    this.setData({ keyword: event.detail });
  },

  // 筛选
  onStatusFilterChange(event: any) {
    this.setData({ statusFilter: event.detail });
    this.loadOrderList(true);
  },

  onTypeFilterChange(event: any) {
    this.setData({ typeFilter: event.detail });
    this.loadOrderList(true);
  },

  // 加载更多
  loadMore() {
    if (!this.data.hasMore || this.data.loading) return;
    this.loadOrderList();
  },

  // 点击工单
  onOrderTap(event: any) {
    const order = event.currentTarget.dataset.order;
    this.setData({
      selectedOrder: order,
      showDetail: true,
      rating: 5,
      ratingComment: ''
    });
  },

  // 关闭详情
  closeDetail() {
    this.setData({ showDetail: false, selectedOrder: null });
  },

  // 评价相关
  onRatingChange(event: any) {
    this.setData({ rating: event.detail });
  },

  onRatingCommentChange(event: any) {
    this.setData({ ratingComment: event.detail });
  },

  // 提交评价
  submitRating() {
    const { selectedOrder, rating, ratingComment } = this.data;
    
    if (!selectedOrder) return;
    
    wx.showLoading({ title: '提交中...' });
    
    wx.request({
      url: `http://127.0.0.1:8000/api/property/repair-orders/${selectedOrder.id}/rating`,
      method: 'POST',
      data: {
        rating,
        comment: ratingComment.trim()
      },
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res: any) => {
        wx.hideLoading();
        console.log('评价响应:', res.data);
        
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({ title: '评价成功' });
          
          // 更新本地数据
          const updatedOrder = {
            ...selectedOrder,
            is_rated: true,
            rating,
            rating_comment: ratingComment.trim(),
            rated_at: new Date().toLocaleString()
          };
          
          this.setData({ selectedOrder: updatedOrder });
          
          // 更新列表中的数据
          const orderList = this.data.orderList.map(item => 
            item.id === selectedOrder.id ? updatedOrder : item
          );
          this.setData({ orderList });
        } else {
          wx.showToast({
            title: res.data.message || '评价失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('提交评价失败:', err);
        wx.showToast({
          title: '网络请求失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadOrderList(true);
    wx.stopPullDownRefresh();
  },

  // 跳转到新报修页面
  goToRepair() {
    wx.navigateTo({
      url: '/pages/repair/repair'
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '我的报修记录',
      path: '/pages/repair-progress/repair-progress'
    };
  }
});
