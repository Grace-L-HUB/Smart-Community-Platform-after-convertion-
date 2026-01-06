// pages/community/community.js
const API_BASE_URL = require('../../config/api.js').API_BASE_URL
const API_COMMUNITY_URL = API_BASE_URL + '/community'

Page({
    data: {
        active: 0,
        marketItems: [],
        helpPosts: [],
        activities: [],
        loading: false,
        hasMoreMarket: true,
        hasMoreHelp: true,
        hasMoreActivity: true,
        marketPage: 1,
        helpPage: 1,
        activityPage: 1
    },

    onLoad() {
        this.loadMarketItems();
        this.loadHelpPosts();
        this.loadActivities();
    },

    onShow() {
        this.refreshCurrentTab();
    },

    onTabChange(e) {
        const active = parseInt(e.detail.name);
        this.setData({ active: active });

        // 切换到空数据的tab时加载数据
        const tabDataMap = [
            { hasMore: 'hasMoreMarket', items: 'marketItems', loader: 'loadMarketItems' },
            { hasMore: 'hasMoreHelp', items: 'helpPosts', loader: 'loadHelpPosts' },
            { hasMore: 'hasMoreActivity', items: 'activities', loader: 'loadActivities' }
        ];

        const tabConfig = tabDataMap[active];
        if (this.data[tabConfig.items].length === 0) {
            this[tabConfig.loader]();
        }
    },

    refreshCurrentTab() {
        const refreshMap = {
            0: () => this.loadMarketItems(true),
            1: () => this.loadHelpPosts(true),
            2: () => this.loadActivities(true)
        };
        refreshMap[this.data.active]?.();
    },

    getUserToken() {
        const userInfo = wx.getStorageSync('userInfo');
        return userInfo ? userInfo.token : null;
    },

    // ========== 二手闲置 ==========
    loadMarketItems(refresh = false) {
        this.loadData({
            url: API_COMMUNITY_URL + '/market-items/',
            refresh: refresh,
            pageKey: 'marketPage',
            hasMoreKey: 'hasMoreMarket',
            itemsKey: 'marketItems',
            processData: (res) => res.data.results.map((item) => ({
                id: item.id,
                user: item.seller.display_name || item.seller.nickname,
                avatar: item.seller.avatar || '',
                time: item.time_ago,
                title: item.title,
                image: item.first_image || '',
                price: item.price.toString()
            })),
            needToken: true
        });
    },

    // ========== 邻居互助 ==========
    loadHelpPosts(refresh = false) {
        this.loadData({
            url: API_BASE_URL + '/community/help-posts/',
            refresh: refresh,
            pageKey: 'helpPage',
            hasMoreKey: 'hasMoreHelp',
            itemsKey: 'helpPosts',
            processData: (res) => res.data.results,
            needToken: true
        });
    },

    // ========== 社区活动 ==========
    loadActivities(refresh = false) {
        this.loadData({
            url: API_BASE_URL + '/community/activities/',
            refresh: refresh,
            pageKey: 'activityPage',
            hasMoreKey: 'hasMoreActivity',
            itemsKey: 'activities',
            processData: (res) => res.data.data.map((item) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                location: item.location,
                start_time: item.start_time,
                end_time: item.end_time,
                status: item.status,
                current_participants: item.current_participants || 0,
                max_participants: item.max_participants || 0,
                registration_progress: item.registration_progress || 0,
                can_register: item.can_register || false,
                user_registered: item.user_registered || false,
                organizer: item.organizer,
                banner: 'https://picsum.photos/seed/' + item.id + '/400/200',
                time_display: this.formatDateTime(item.start_time, item.end_time),
                status_text: this.getStatusText(item.status),
                status_color: this.getStatusColor(item.status)
            })),
            needToken: true,
            isPublic: true  // 活动列表是公开的，不需要token也能访问
        });
    },

    // ========== 通用加载方法 ==========
    loadData(config) {
        if (this.data.loading) return;

        const token = this.getUserToken();
        if (config.needToken && !token && !config.isPublic) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        if (config.refresh) {
            this.setData({ [config.pageKey]: 1, [config.hasMoreKey]: true });
        }

        this.setData({ loading: true });

        const header = { 'Content-Type': 'application/json' };
        if (token) {
            header['Authorization'] = 'Bearer ' + token;
        }

        wx.request({
            url: config.url,
            method: 'GET',
            header: header,
            data: {
                page: config.refresh ? 1 : this.data[config.pageKey],
                page_size: 10
            },
            success: (res) => {
                const isSuccess = res.statusCode === 200 &&
                    (res.data.code === 200 || res.data.results !== undefined);

                if (isSuccess && config.processData) {
                    const newItems = config.processData(res);
                    const currentItems = this.data[config.itemsKey];

                    this.setData({
                        [config.itemsKey]: config.refresh ? newItems : [...currentItems, ...newItems],
                        [config.pageKey]: this.data[config.pageKey] + 1
                    });

                    // 判断是否还有更多数据
                    const hasMore = res.data.next !== null ||
                        (res.data.total && res.data.total > this.data[config.itemsKey].length);
                    this.setData({ [config.hasMoreKey]: hasMore });
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

    // ========== 工具方法 ==========
    formatDateTime(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const now = new Date();

        const startMonth = start.getMonth() + 1;
        const startDay = start.getDate();
        const startHour = start.getHours().toString().padStart(2, '0');
        const startMin = start.getMinutes().toString().padStart(2, '0');
        const endHour = end.getHours().toString().padStart(2, '0');
        const endMin = end.getMinutes().toString().padStart(2, '0');

        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const diffTime = startDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return '今天 ' + startHour + ':' + startMin + '-' + endHour + ':' + endMin;
        } else if (diffDays === 1) {
            return '明天 ' + startHour + ':' + startMin + '-' + endHour + ':' + endMin;
        } else if (diffDays >= 0 && diffDays <= 6) {
            const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            return weekdays[start.getDay()] + ' ' + startHour + ':' + startMin + '-' + endHour + ':' + endMin;
        } else {
            return startMonth + '月' + startDay + '日 ' + startHour + ':' + startMin + '-' + endHour + ':' + endMin;
        }
    },

    getStatusText(status) {
        const statusMap = {
            'upcoming': '即将开始',
            'ongoing': '进行中',
            'ended': '已结束',
            'cancelled': '已取消'
        };
        return statusMap[status] || status;
    },

    getStatusColor(status) {
        const colorMap = {
            'upcoming': 'primary',
            'ongoing': 'success',
            'ended': 'default',
            'cancelled': 'danger'
        };
        return colorMap[status] || 'default';
    },

    // ========== 下拉刷新 & 上拉加载 ==========
    onPullDownRefresh() {
        this.refreshCurrentTab();
    },

    onReachBottom() {
        const tabActionMap = [
            { hasMore: 'hasMoreMarket', loader: 'loadMarketItems' },
            { hasMore: 'hasMoreHelp', loader: 'loadHelpPosts' },
            { hasMore: 'hasMoreActivity', loader: 'loadActivities' }
        ];

        const config = tabActionMap[this.data.active];
        if (this.data[config.hasMore]) {
            this[config.loader]();
        }
    },

    // ========== 事件处理 ==========
    onMarketItemClick(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: '/pages/community/market-detail/market-detail?id=' + id
        });
    },

    onHelpClick(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: '/pages/community/help-detail/help-detail?id=' + id
        });
    },

    onHelpButtonClick(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: '/pages/community/help-detail/help-detail?id=' + id
        });
    },

    onEventClick(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: '/pages/community/event-detail/event-detail?id=' + id
        });
    },

    onEventEnrollClick(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: '/pages/community/event-detail/event-detail?id=' + id
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
