// pages/index/index.ts
const API_BASE_URL = 'http://127.0.0.1:8000/api'
const API_PROPERTY_URL = 'http://127.0.0.1:8000/api/property'

Page({
    data: {
        userInfo: {
            nickName: "业主",
        },
        // 最新公告通知
        latestNotice: {
            title: '',
            content: '',
            id: 0
        },
        showNotice: false,
        // 用户房屋绑定信息
        userBuildings: [] as string[],
        // 系统配置信息
        systemConfig: {
            customerServicePhone: ''
        },
        // 社区信息
        communityInfo: {
            name: '',
            address: ''
        },
        // 天气信息
        weatherInfo: {
            condition: '晴',
            temperature: '26'
        }
    },

    onLoad() {
        // Check login status, etc.
        this.loadUserBuildings();
        this.loadLatestNotice();
        this.loadCustomerServicePhone();
        this.loadCommunityInfo();
        this.loadWeatherInfo();
    },

    // 加载最新全员通知
    loadLatestNotice() {
        wx.request({
            url: `${API_PROPERTY_URL}/announcements`,
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const announcements = res.data.data || [];
                    // 找出最新的已发布通知（包括全员和用户有权限查看的楼栋通知）
                    const latestNotice = announcements.find((item: any) => 
                        item.status === 'published' && 
                        this.canViewBuildingAnnouncement(item.scope, item.target_buildings)
                    );
                    
                    if (latestNotice) {
                        // 处理通知文本，去除HTML标签并截取前50字符
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
                        // 没有全员通知时隐藏通知栏
                        this.setData({ showNotice: false });
                    }
                } else {
                    console.error('获取最新通知失败:', res.data);
                    // 没有通知时隐藏通知栏
                    this.setData({ showNotice: false });
                }
            },
            fail: (err) => {
                console.error('获取最新通知网络请求失败:', err);
                // 网络失败时隐藏通知栏
                this.setData({ showNotice: false });
            }
        });
    },

    // 加载客服电话配置
    loadCustomerServicePhone() {
        wx.request({
            url: `${API_BASE_URL}/system/config`,
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const config = res.data.data || {};
                    this.setData({
                        systemConfig: {
                            customerServicePhone: config.customer_service_phone || '400-123-4567'
                        }
                    });
                } else {
                    console.error('获取系统配置失败:', res.data);
                    // 使用默认客服电话
                    this.setData({
                        systemConfig: {
                            customerServicePhone: '400-123-4567'
                        }
                    });
                }
            },
            fail: (err) => {
                console.error('获取系统配置网络请求失败:', err);
                // 使用默认客服电话
                this.setData({
                    systemConfig: {
                        customerServicePhone: '400-123-4567'
                    }
                });
            }
        });
    },

    // 加载社区信息
    loadCommunityInfo() {
        wx.request({
            url: `${API_PROPERTY_URL}/community/info`,
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const community = res.data.data || {};
                    this.setData({
                        communityInfo: {
                            name: community.name || '阳光花园社区',
                            address: community.address || ''
                        }
                    });
                } else {
                    console.error('获取社区信息失败:', res.data);
                    // 使用默认社区名称
                    this.setData({
                        communityInfo: {
                            name: '阳光花园社区',
                            address: ''
                        }
                    });
                }
            },
            fail: (err) => {
                console.error('获取社区信息网络请求失败:', err);
                // 使用默认社区名称
                this.setData({
                    communityInfo: {
                        name: '阳光花园社区',
                        address: ''
                    }
                });
            }
        });
    },

    // 加载天气信息
    loadWeatherInfo() {
        wx.request({
            url: `${API_PROPERTY_URL}/weather`,
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const weather = res.data.data || {};
                    this.setData({
                        weatherInfo: {
                            condition: weather.condition || '晴',
                            temperature: weather.temperature || '26'
                        }
                    });
                } else {
                    console.error('获取天气信息失败:', res.data);
                }
            },
            fail: (err) => {
                console.error('获取天气信息网络请求失败:', err);
            }
        });
    },

    // 加载用户房屋绑定信息
    loadUserBuildings() {
        // 获取用户信息
        const userInfo = wx.getStorageSync('userInfo');
        if (!userInfo || !userInfo.user_id) {
            console.log('用户未登录，无法获取房屋绑定信息');
            return;
        }

        wx.request({
            url: `http://127.0.0.1:8000/api/property/house/my-houses?user_id=${userInfo.user_id}`,
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const bindings = res.data.data || [];
                    // 提取用户绑定的楼栋名称
                    const userBuildings = bindings.map((binding: any) => 
                        binding.house_info?.building_name
                    ).filter((building: string) => building);
                    
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

    // 校验用户是否有权限查看指定楼栋的公告
    canViewBuildingAnnouncement(scope: string, targetBuildings: string[]): boolean {
        if (scope === 'all') {
            return true; // 全员公告，所有人都可以看
        }
        
        if (scope === 'building' && targetBuildings && targetBuildings.length > 0) {
            // 检查用户绑定的楼栋是否与公告目标楼栋有交集
            return this.data.userBuildings.some((userBuilding: string) => 
                targetBuildings.includes(userBuilding)
            );
        }
        
        return true;
    },

    // 去除HTML标签的辅助方法
    stripHtml(html: string): string {
        if (!html) return '';
        return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
    },

    showQRCode() {
        wx.navigateTo({
            url: '/pages/qrcode/qrcode?type=identity'
        });
    },

    onNoticeClick() {
        // 如果有具体的公告ID，跳转到详情页；否则跳转到列表页
        if (this.data.latestNotice.id > 0) {
            wx.navigateTo({
                url: `/pages/services/announcement-detail/announcement-detail?id=${this.data.latestNotice.id}`
            });
        } else {
            wx.navigateTo({
                url: '/pages/services/announcements/announcements'
            });
        }
    },

    onQuickAction(e: any) {
        const action = e.currentTarget.dataset.action;
        if (action === 'repair') {
            // 跳转到报事报修页面
            wx.navigateTo({
                url: '/pages/repair/repair'
            });
        } else if (action === 'call') {
            // 跳转到常用电话页面
            wx.navigateTo({
                url: '/pages/services/contacts/contacts'
            });
        }
    }
});
