import { API_BASE_URL } from '../../../config/api'

Page({
    data: {
        activeTab: 0,
        orders: [] as any[],
        loading: false,
        error: '',
        hasMore: true,
        page: 1,
        pageSize: 10
    },

    onLoad() {
        this.loadOrders();
    },

    onShow() {
        // 页面显示时刷新数据
        this.refreshOrders();
    },

    onPullDownRefresh() {
        this.refreshOrders();
    },

    onReachBottom() {
        if (!this.data.loading && this.data.hasMore) {
            this.loadOrders();
        }
    },

    // 刷新订单列表
    refreshOrders() {
        this.setData({
            page: 1,
            orders: [],
            hasMore: true
        }, () => {
            this.loadOrders();
        });
    },

    // 加载订单数据
    loadOrders() {
        this.setData({ loading: true, error: '' });

        const status = this.getStatusByTab(this.data.activeTab);

        wx.request({
            url: `${API_BASE_URL}/user/orders/`,
            method: 'GET',
            data: {
                status: status,
                page: this.data.page,
                page_size: this.data.pageSize
            },
            header: {
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`,
                'content-type': 'application/json'
            },
            success: (res: any) => {
                console.log('订单列表响应:', res.data);

                if (res.statusCode === 200 && res.data.success) {
                    const newOrders = res.data.data.items;
                    const hasMore = res.data.data.page < res.data.data.total_pages;

                    this.setData({
                        orders: this.data.page === 1 ? newOrders : [...this.data.orders, ...newOrders],
                        hasMore,
                        loading: false
                    });

                    wx.stopPullDownRefresh();
                } else {
                    console.error('获取订单列表失败:', res.data);
                    this.setData({
                        error: res.data.message || '获取订单列表失败',
                        loading: false
                    });
                    wx.stopPullDownRefresh();
                }
            },
            fail: (err) => {
                console.error('获取订单列表网络请求失败:', err);
                this.setData({
                    error: '网络请求失败',
                    loading: false
                });
                wx.stopPullDownRefresh();
            }
        });
    },

    // 根据tab获取状态
    getStatusByTab(tabIndex: number): string {
        switch (tabIndex) {
            case 0: // 全部
                return '';
            case 1: // 待接单
                return 'new';
            case 2: // 进行中
                return 'accepted,preparing,ready';
            case 3: // 已完成
                return 'completed';
            case 4: // 已取消
                return 'cancelled';
            default:
                return '';
        }
    },

    // tab切换
    onTabChange(e: any) {
        const activeTab = e.detail.index;
        this.setData({ activeTab }, () => {
            this.refreshOrders();
        });
    },

    // 查看订单详情
    onDetail(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/profile/order-detail/order-detail?id=${id}`
        });
    },

    // 联系商家
    onContactMerchant(e: any) {
        const merchantId = e.currentTarget.dataset.merchantId;
        // 从API获取商家联系电话
        wx.request({
            url: `${API_BASE_URL}/merchant/profiles/${merchantId}`,
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.success) {
                    const phone = res.data.data.phone || '400-123-4567';
                    wx.showModal({
                        title: '联系商家',
                        content: `是否拨打${phone}`,
                        confirmText: '拨打',
                        cancelText: '不拨打',
                        success: (modalRes) => {
                            if (modalRes.confirm) {
                                wx.makePhoneCall({
                                    phoneNumber: phone
                                });
                            }
                        }
                    });
                } else {
                    wx.showToast({ title: '获取商家电话失败', icon: 'none' });
                }
            },
            fail: (error) => {
                console.error('获取商家电话失败:', error);
                wx.showToast({ title: '获取商家电话失败', icon: 'none' });
            }
        });
    },

    // 取消订单
    onCancelOrder(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.showModal({
            title: '取消订单',
            content: '确定要取消这个订单吗？',
            success: (res) => {
                if (res.confirm) {
                    this.cancelOrder(id);
                }
            }
        });
    },

    // 取消订单请求
    cancelOrder(id: number) {
        wx.showLoading({ title: '取消中...' });

        wx.request({
            url: `${API_BASE_URL}/user/orders/${id}/cancel/`,
            method: 'POST',
            header: {
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`,
                'content-type': 'application/json'
            },
            success: (res: any) => {
                wx.hideLoading();
                if (res.statusCode === 200 && res.data.success) {
                    wx.showToast({
                        title: '订单已取消',
                        icon: 'success'
                    });
                    this.refreshOrders();
                } else {
                    wx.showToast({
                        title: res.data.message || '取消失败',
                        icon: 'none'
                    });
                }
            },
            fail: (err) => {
                wx.hideLoading();
                wx.showToast({
                    title: '网络请求失败',
                    icon: 'none'
                });
            }
        });
    },

    // 格式化时间
    formatTime(timeStr: string): string {
        const date = new Date(timeStr);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${month}-${day} ${hours}:${minutes}`;
    }
});
