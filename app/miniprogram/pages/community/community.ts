// pages/community/community.ts
const API_BASE_URL = 'http://127.0.0.1:8000/api/community'

Page({
    data: {
        active: 0,
        marketItems: [],
        helpPosts: [],
        loading: false,
        hasMoreMarket: true,
        hasMoreHelp: true,
        marketPage: 1,
        helpPage: 1
    },

    onLoad() {
        this.loadMarketItems();
        this.loadHelpPosts();
    },

    onShow() {
        // 页面显示时刷新数据
        if (this.data.active === 0) {
            this.loadMarketItems(true);
        } else if (this.data.active === 1) {
            this.loadHelpPosts(true);
        }
    },

    onTabChange(e: any) {
        const active = parseInt(e.detail.name);
        this.setData({ active });
        
        if (active === 0 && this.data.marketItems.length === 0) {
            this.loadMarketItems();
        } else if (active === 1 && this.data.helpPosts.length === 0) {
            this.loadHelpPosts();
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

    // 下拉刷新
    onPullDownRefresh() {
        if (this.data.active === 0) {
            this.loadMarketItems(true);
        } else if (this.data.active === 1) {
            this.loadHelpPosts(true);
        }
    },

    // 上拉加载更多
    onReachBottom() {
        if (this.data.active === 0 && this.data.hasMoreMarket) {
            this.loadMarketItems();
        } else if (this.data.active === 1 && this.data.hasMoreHelp) {
            this.loadHelpPosts();
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

    onEventEnrollClick(_e: any) {
        wx.navigateTo({
            url: `/pages/community/event-detail/event-detail?id=1`
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
