// pages/community/community.ts
const API_BASE_URL = 'http://127.0.0.1:8000/api/community'

Page({
    data: {
        active: 0,
        marketItems: [],
        helpPosts: [],
        activities: [], // 添加活动列表
        loading: false,
        hasMoreMarket: true,
        hasMoreHelp: true,
        hasMoreActivity: true, // 添加活动分页控制
        marketPage: 1,
        helpPage: 1,
        activityPage: 1 // 添加活动页码
    },

    onLoad() {
        this.loadMarketItems();
        this.loadHelpPosts();
        this.loadActivities(); // 添加加载活动列表
    },

    onShow() {
        // 页面显示时刷新数据
        if (this.data.active === 0) {
            this.loadMarketItems(true);
        } else if (this.data.active === 1) {
            this.loadHelpPosts(true);
        } else if (this.data.active === 2) {
            this.loadActivities(true);
        }
    },

    onTabChange(e: any) {
        const active = parseInt(e.detail.name);
        this.setData({ active });
        
        if (active === 0 && this.data.marketItems.length === 0) {
            this.loadMarketItems();
        } else if (active === 1 && this.data.helpPosts.length === 0) {
            this.loadHelpPosts();
        } else if (active === 2 && this.data.activities.length === 0) {
            this.loadActivities();
        }
    },

    // 获取用户token
    getUserToken() {
        const userInfo = wx.getStorageSync('userInfo');
        return userInfo ? userInfo.token : null;
    },

    // 加载二手商品列表
    loadMarketItems(refresh: boolean = false) {
        if (this.data.loading) return;
        
        const token = this.getUserToken();
        if (!token) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        if (refresh) {
            this.setData({ marketPage: 1, hasMoreMarket: true });
        }

        this.setData({ loading: true });

        wx.request({
            url: `${API_BASE_URL}/market-items/`,
            method: 'GET',
            header: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: {
                page: refresh ? 1 : this.data.marketPage,
                page_size: 10
            },
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.results) {
                    const newItems = res.data.results.map((item: any) => ({
                        id: item.id,
                        user: item.seller.display_name || item.seller.nickname,
                        avatar: item.seller.avatar || '',
                        time: item.time_ago,
                        title: item.title,
                        image: item.first_image || '',
                        price: item.price.toString()
                    }));

                    if (refresh) {
                        this.setData({ marketItems: newItems });
                    } else {
                        this.setData({ marketItems: [...this.data.marketItems, ...newItems] });
                    }

                    this.setData({
                        marketPage: this.data.marketPage + 1,
                        hasMoreMarket: res.data.next !== null
                    });
                } else {
                    wx.showToast({ title: '加载失败', icon: 'none' });
                }
            },
            fail: () => {
                wx.showToast({ title: '网络错误', icon: 'none' });
            },
            complete: () => {
                this.setData({ loading: false });
                wx.stopPullDownRefresh();
            }
        });
    },

    // 加载求助帖列表
    loadHelpPosts(refresh: boolean = false) {
        if (this.data.loading) return;
        
        const token = this.getUserToken();
        if (!token) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        if (refresh) {
            this.setData({ helpPage: 1, hasMoreHelp: true });
        }

        this.setData({ loading: true });

        wx.request({
            url: `${API_BASE_URL}/help-posts/`,
            method: 'GET',
            header: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: {
                page: refresh ? 1 : this.data.helpPage,
                page_size: 10
            },
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.results) {
                    if (refresh) {
                        this.setData({ helpPosts: res.data.results });
                    } else {
                        this.setData({ helpPosts: [...this.data.helpPosts, ...res.data.results] });
                    }

                    this.setData({
                        helpPage: this.data.helpPage + 1,
                        hasMoreHelp: res.data.next !== null
                    });
                } else {
                    wx.showToast({ title: '加载失败', icon: 'none' });
                }
            },
            fail: () => {
                wx.showToast({ title: '网络错误', icon: 'none' });
            },
            complete: () => {
                this.setData({ loading: false });
                wx.stopPullDownRefresh();
            }
        });
    },

    // 加载活动列表
    loadActivities(refresh: boolean = false) {
        if (this.data.loading) return;

        if (refresh) {
            this.setData({ activityPage: 1, hasMoreActivity: true });
        }

        this.setData({ loading: true });

        wx.request({
            url: `${API_BASE_URL}/activities/`,
            method: 'GET',
            header: {
                'Content-Type': 'application/json'
                // 暂时不需要Authorization，因为后端使用AllowAny权限
            },
            data: {
                page: refresh ? 1 : this.data.activityPage,
                page_size: 10
            },
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const newActivities = res.data.data.map((item: any) => ({
                        id: item.id,
                        title: item.title,
                        description: item.description,
                        location: item.location,
                        start_time: item.start_time,
                        end_time: item.end_time,
                        status: item.status,
                        current_participants: item.current_participants,
                        max_participants: item.max_participants,
                        registration_progress: item.registration_progress,
                        can_register: item.can_register,
                        user_registered: item.user_registered,
                        organizer: item.organizer,
                        // 格式化显示用的数据
                        banner: `https://picsum.photos/seed/${item.id}/400/200`,
                        time_display: this.formatDateTime(item.start_time, item.end_time),
                        status_text: this.getStatusText(item.status),
                        status_color: this.getStatusColor(item.status)
                    }));

                    if (refresh) {
                        this.setData({ activities: newActivities });
                    } else {
                        this.setData({ activities: [...this.data.activities, ...newActivities] });
                    }

                    this.setData({
                        activityPage: this.data.activityPage + 1,
                        hasMoreActivity: res.data.total > this.data.activities.length + newActivities.length
                    });
                } else {
                    wx.showToast({ title: '加载失败', icon: 'none' });
                }
            },
            fail: () => {
                wx.showToast({ title: '网络错误', icon: 'none' });
            },
            complete: () => {
                this.setData({ loading: false });
                wx.stopPullDownRefresh();
            }
        });
    },

    // 格式化日期时间显示
    formatDateTime(startTime: string, endTime: string): string {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const now = new Date();
        
        const startMonth = start.getMonth() + 1;
        const startDay = start.getDate();
        const startHour = start.getHours().toString().padStart(2, '0');
        const startMin = start.getMinutes().toString().padStart(2, '0');
        const endHour = end.getHours().toString().padStart(2, '0');
        const endMin = end.getMinutes().toString().padStart(2, '0');
        
        // 判断是今天、明天、本周还是其他
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const diffTime = startDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return `今天 ${startHour}:${startMin}-${endHour}:${endMin}`;
        } else if (diffDays === 1) {
            return `明天 ${startHour}:${startMin}-${endHour}:${endMin}`;
        } else if (diffDays >= 0 && diffDays <= 6) {
            const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            return `${weekdays[start.getDay()]} ${startHour}:${startMin}-${endHour}:${endMin}`;
        } else {
            return `${startMonth}月${startDay}日 ${startHour}:${startMin}-${endHour}:${endMin}`;
        }
    },

    // 获取活动状态文本
    getStatusText(status: string): string {
        const statusMap: any = {
            'upcoming': '即将开始',
            'ongoing': '进行中',
            'ended': '已结束',
            'cancelled': '已取消'
        };
        return statusMap[status] || status;
    },

    // 获取活动状态颜色
    getStatusColor(status: string): string {
        const colorMap: any = {
            'upcoming': 'primary',
            'ongoing': 'success',
            'ended': 'default',
            'cancelled': 'danger'
        };
        return colorMap[status] || 'default';
    },

    // 下拉刷新
    onPullDownRefresh() {
        if (this.data.active === 0) {
            this.loadMarketItems(true);
        } else if (this.data.active === 1) {
            this.loadHelpPosts(true);
        } else if (this.data.active === 2) {
            this.loadActivities(true);
        }
    },

    // 上拉加载更多
    onReachBottom() {
        if (this.data.active === 0 && this.data.hasMoreMarket) {
            this.loadMarketItems();
        } else if (this.data.active === 1 && this.data.hasMoreHelp) {
            this.loadHelpPosts();
        } else if (this.data.active === 2 && this.data.hasMoreActivity) {
            this.loadActivities();
        }
    },

    onMarketItemClick(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/community/market-detail/market-detail?id=${id}`
        });
    },

    onChatClick(_e: any) {
        wx.showToast({
            title: '打开聊天窗口',
            icon: 'none'
        });
    },

    onHelpClick(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/community/help-detail/help-detail?id=${id}`
        });
    },

    onHelpButtonClick(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/community/help-detail/help-detail?id=${id}`
        });
    },

    onEventClick(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/community/event-detail/event-detail?id=${id}`
        });
    },

    onEventEnrollClick(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/community/event-detail/event-detail?id=${id}`
        });
    },

    onPostClick() {
        if (this.data.active === 1) {
            wx.navigateTo({
                url: '/pages/community/help-publish/help-publish'
            });
        } else {
            wx.navigateTo({
                url: '/pages/community/post-item/post-item'
            });
        }
    }
});
