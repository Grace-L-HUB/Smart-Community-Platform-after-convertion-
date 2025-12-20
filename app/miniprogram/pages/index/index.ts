// pages/index/index.ts
Page({
    data: {
        userInfo: {
            nickName: "业主",
        },
        // 最新公告通知
        latestNotice: {
            title: '关于小区正在进行绿化维护的通知',
            content: '预计本周三上午9点到12点...',
            id: 0
        },
        showNotice: false,
        // 用户房屋绑定信息
        userBuildings: [] as string[]
    },

    onLoad() {
        // Check login status, etc.
        this.loadUserBuildings();
        this.loadLatestNotice();
    },

    // 加载最新全员通知
    loadLatestNotice() {
        wx.request({
            url: 'http://127.0.0.1:8000/api/property/announcements',
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
                    // 保持默认显示
                }
            },
            fail: (err) => {
                console.error('获取最新通知网络请求失败:', err);
                // 保持默认显示
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
        if (action === 'open') {
            wx.showToast({
                title: '开门中...',
                icon: 'loading'
            });
        } else if (action === 'call') {
            wx.makePhoneCall({
                phoneNumber: '400-123-4567'
            });
        }
    }
});
