// pages/index/index.js
const { API_BASE_URL } = require('../../config/api')
const API_PROPERTY_URL = API_BASE_URL + '/property'

Page({
    data: {
        userInfo: {
            nickName: "业主",
        },
        latestNotice: {
            title: '',
            content: '',
            id: 0
        },
        showNotice: false,
        userBuildings: [],
        systemConfig: {
            customerServicePhone: '400-123-4567'
        },
        communityInfo: {
            name: '智慧社区',
            address: '阳光花园'
        },
        weatherInfo: {
            condition: '晴',
            temperature: '26'
        }
    },

    onLoad() {
        this.loadUserBuildings();
        this.loadLatestNotice();
    },

    loadLatestNotice() {
        wx.request({
            url: API_PROPERTY_URL + '/announcements',
            method: 'GET',
            success: (res) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const announcements = res.data.data || [];
                    const latestNotice = announcements.find((item) => 
                        item.status === 'published' && 
                        this.canViewBuildingAnnouncement(item.scope, item.target_buildings)
                    );
                    
                    if (latestNotice) {
                        const plainText = this.stripHtml(latestNotice.content);
                        const shortText = plainText.length > 50 
                            ? plainText.substring(0, 50) + '...' 
                            : plainText;
                        
                        this.setData({
                            latestNotice: {
                                title: latestNotice.title,
                                content: shortText,
                                id: latestNotice.id
                            },
                            showNotice: true
                        });
                    } else {
                        this.setData({ showNotice: false });
                    }
                } else {
                    console.error('获取最新通知失败:', res.data);
                    this.setData({ showNotice: false });
                }
            },
            fail: (err) => {
                console.error('获取最新通知网络请求失败:', err);
                this.setData({ showNotice: false });
            }
        });
    },

    loadUserBuildings() {
        const userInfo = wx.getStorageSync('userInfo');
        if (!userInfo || !userInfo.user_id) {
            console.log('用户未登录，无法获取房屋绑定信息');
            return;
        }

        wx.request({
            url: API_BASE_URL + '/property/house/my-houses?user_id=' + userInfo.user_id,
            method: 'GET',
            success: (res) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const bindings = res.data.data || [];
                    const userBuildings = bindings.map((binding) => 
                        binding.house_info?.building_name
                    ).filter((building) => building);
                    
                    this.setData({ userBuildings });
                    console.log('首页-用户绑定的楼栋:', userBuildings);
                } else {
                    console.error('获取用户房屋绑定信息失败:', res.data);
                }
            },
            fail: (err) => {
                console.error('获取用户房屋绑定信息网络请求失败:', err);
            }
        });
    },

    canViewBuildingAnnouncement(scope, targetBuildings) {
        if (scope === 'all') {
            return true;
        }
        
        if (scope === 'building' && targetBuildings && targetBuildings.length > 0) {
            return this.data.userBuildings.some((userBuilding) => 
                targetBuildings.includes(userBuilding)
            );
        }
        
        return true;
    },

    stripHtml(html) {
        if (!html) return '';
        return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
    },

    showQRCode() {
        wx.navigateTo({
            url: '/pages/qrcode/qrcode?type=identity'
        });
    },

    onNoticeClick() {
        if (this.data.latestNotice.id > 0) {
            wx.navigateTo({
                url: '/pages/services/announcement-detail/announcement-detail?id=' + this.data.latestNotice.id
            });
        } else {
            wx.navigateTo({
                url: '/pages/services/announcements/announcements'
            });
        }
    },

    onQuickAction(e) {
        const action = e.currentTarget.dataset.action;
        if (action === 'repair') {
            wx.navigateTo({
                url: '/pages/repair/repair'
            });
        } else if (action === 'call') {
            wx.navigateTo({
                url: '/pages/services/contacts/contacts'
            });
        }
    }
});
