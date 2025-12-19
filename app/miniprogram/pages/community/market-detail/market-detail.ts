// pages/community/market-detail/market-detail.ts
const API_BASE_URL = 'http://127.0.0.1:8000/api/community'

Page({
    data: {
        id: 0,
        images: [],
        price: '',
        title: '',
        condition: '',
        seller: {
            id: 0,
            name: '',
            avatar: '',
            location: ''
        },
        description: '',
        category: '',
        publishTime: '',
        viewCount: 0,
        favoriteCount: 0,

        isFavorite: false,
        loading: true,
        showContactSheet: false,
        contactActions: [
            { name: '私聊', color: '#07c160' },
            { name: '拨打电话' },
            { name: '复制微信号' }
        ]
    },

    onLoad(options: any) {
        if (options.id) {
            this.setData({ id: parseInt(options.id) });
            this.loadGoodsDetail(options.id);
        }
    },

    // 获取用户token
    getUserToken() {
        const userInfo = wx.getStorageSync('userInfo');
        return userInfo ? userInfo.token : null;
    },

    loadGoodsDetail(id: string) {
        const token = this.getUserToken();
        if (!token) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        wx.showLoading({ title: '加载中...' });

        wx.request({
            url: `${API_BASE_URL}/market-items/${id}/`,
            method: 'GET',
            header: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            success: (res: any) => {
                if (res.statusCode === 200) {
                    const data = res.data;
                    this.setData({
                        title: data.title,
                        description: data.description,
                        price: data.price.toString(),
                        condition: data.condition,
                        category: data.category,
                        publishTime: data.time_ago,
                        viewCount: data.view_count,
                        favoriteCount: data.favorite_count,
                        isFavorite: data.is_favorite,
                        images: data.images.map((img: any) => img.image),
                        seller: {
                            id: data.seller.id,
                            name: data.seller.display_name || data.seller.nickname,
                            avatar: data.seller.avatar || '',
                            location: '阳光花园' // 这里需要从用户信息中获取
                        }
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
                wx.hideLoading();
            }
        });
    },

    onContact() {
        this.setData({ showContactSheet: true });
    },

    onCloseContact() {
        this.setData({ showContactSheet: false });
    },

    onSelectContact(event: any) {
        const { name } = event.detail;
        if (name === '私聊') {
            this.goToChat();
        } else if (name === '拨打电话') {
            this.makeCall();
        } else if (name === '复制微信号') {
            this.copyWeChat();
        }
    },

    goToChat() {
        const { id, seller } = this.data;
        const token = this.getUserToken();
        if (!token) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        // 开始新会话
        wx.showLoading({ title: '加载中...' });
        
        wx.request({
            url: `${API_BASE_URL}/conversations/start/`,
            method: 'POST',
            header: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: {
                target_user_id: seller.id,
                market_item_id: id
            },
            success: (res: any) => {
                wx.hideLoading();
                if (res.statusCode === 200) {
                    // 跳转到聊天页面
                    wx.navigateTo({
                        url: `/pages/message/chat/chat?conversationId=${res.data.id}&targetName=${seller.name}&itemId=${id}`
                    });
                } else {
                    wx.showToast({ title: '操作失败', icon: 'none' });
                }
            },
            fail: () => {
                wx.hideLoading();
                wx.showToast({ title: '网络错误', icon: 'none' });
            }
        });
    },

    makeCall() {
        wx.makePhoneCall({
            phoneNumber: '13800000000' // Mock phone number
        });
    },

    copyWeChat() {
        wx.setClipboardData({
            data: 'wxid_mock123456', // Mock WeChat ID
            success: () => {
                wx.showToast({
                    title: '微信号已复制',
                    icon: 'success'
                });
            }
        });
    },

    onWant() {
        // "I want this" can directly go to chat with pre-filled message
        const { id, seller } = this.data;
        wx.navigateTo({
            url: `/pages/message/chat/chat?targetId=${seller.name}&targetName=${seller.name}&itemId=${id}`
        });
    },

    onFavorite() {
        const token = this.getUserToken();
        if (!token) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        wx.request({
            url: `${API_BASE_URL}/market-items/${this.data.id}/favorite/`,
            method: 'POST',
            header: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            success: (res: any) => {
                if (res.statusCode === 200) {
                    this.setData({ 
                        isFavorite: res.data.favorited,
                        favoriteCount: res.data.favorited ? 
                            this.data.favoriteCount + 1 : 
                            this.data.favoriteCount - 1
                    });
                    wx.showToast({
                        title: res.data.message,
                        icon: 'success'
                    });
                } else {
                    wx.showToast({ title: '操作失败', icon: 'none' });
                }
            },
            fail: () => {
                wx.showToast({ title: '网络错误', icon: 'none' });
            }
        });
    }
});
