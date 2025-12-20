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
        showNotice: false
    },

    onLoad() {
        // Check login status, etc.
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
                    // 找出最新的已发布全员通知
                    const latestAllNotice = announcements.find((item: any) => 
                        item.status === 'published' && item.scope === 'all'
                    );
                    
                    if (latestAllNotice) {
                        // 处理通知文本，去除HTML标签并截取前50字符
                        const plainText = this.stripHtml(latestAllNotice.content);
                        const shortText = plainText.length > 50 
                            ? plainText.substring(0, 50) + '...' 
                            : plainText;
                        
                        this.setData({
                            latestNotice: {
                                title: latestAllNotice.title,
                                content: shortText,
                                id: latestAllNotice.id
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
