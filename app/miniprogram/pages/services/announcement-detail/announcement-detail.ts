// pages/services/announcement-detail/announcement-detail.ts
Page({
    data: {
        id: 0,
        loading: true,
        isTop: false,
        category: '',
        title: '',
        publishTime: '',
        views: 0,
        content: '',
        attachments: [] as any[],
        publisher: '',
        author: '',
        scope: '',
        status: ''
    },

    onLoad(options: any) {
        if (options.id) {
            const announcementId = parseInt(options.id);
            this.setData({ id: announcementId });
            this.loadAnnouncementDetail(announcementId);
        } else {
            wx.showToast({
                title: '公告ID无效',
                icon: 'none'
            });
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
        }
    },

    loadAnnouncementDetail(id: number) {
        this.setData({ loading: true });

        wx.request({
            url: `http://127.0.0.1:8000/api/property/announcements/${id}`,
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const announcement = res.data.data;
                    
                    this.setData({
                        id: announcement.id,
                        title: announcement.title,
                        content: announcement.content,
                        publishTime: this.formatDateTime(announcement.published_at || announcement.created_at),
                        views: announcement.read_count || 0,
                        author: announcement.author || '系统',
                        publisher: announcement.author || '物业管理处',
                        category: this.getCategoryName(announcement.scope, announcement.target_buildings),
                        scope: announcement.scope,
                        status: announcement.status,
                        isTop: false, // 暂未实现置顶功能
                        attachments: [], // 暂未实现附件功能
                        loading: false
                    });

                    // 设置页面标题
                    wx.setNavigationBarTitle({
                        title: announcement.title.length > 10 
                            ? announcement.title.substring(0, 10) + '...' 
                            : announcement.title
                    });
                } else {
                    console.error('获取公告详情失败:', res.data);
                    this.setData({ loading: false });
                    wx.showToast({
                        title: res.data.message || '获取公告详情失败',
                        icon: 'none'
                    });
                    setTimeout(() => {
                        wx.navigateBack();
                    }, 1500);
                }
            },
            fail: (err) => {
                console.error('获取公告详情网络请求失败:', err);
                this.setData({ loading: false });
                wx.showToast({
                    title: '网络请求失败',
                    icon: 'none'
                });
                setTimeout(() => {
                    wx.navigateBack();
                }, 1500);
            }
        });
    },

    // 格式化日期时间
    formatDateTime(timeStr: string): string {
        if (!timeStr) return '';
        
        const time = new Date(timeStr);
        return time.getFullYear() + '-' + 
               String(time.getMonth() + 1).padStart(2, '0') + '-' + 
               String(time.getDate()).padStart(2, '0') + ' ' +
               String(time.getHours()).padStart(2, '0') + ':' + 
               String(time.getMinutes()).padStart(2, '0');
    },

    // 根据scope和target_buildings生成分类名称
    getCategoryName(scope: string, targetBuildings: string[]): string {
        if (scope === 'all') {
            return '物业通知';
        } else if (scope === 'building' && targetBuildings && targetBuildings.length > 0) {
            return '楼栋通知';
        }
        return '社区公告';
    },

    increaseViews() {
        // 浏览量已在后端API中自动处理
        console.log('Views increased automatically by backend');
    },

    onDownload(event: any) {
        const url = event.currentTarget.dataset.url;
        wx.showToast({
            title: '下载功能开发中',
            icon: 'none'
        });
        // TODO: 下载附件
        console.log('Download:', url);
    },

    onShareAppMessage() {
        return {
            title: this.data.title,
            path: `/pages/services/announcement-detail/announcement-detail?id=${this.data.id}`
        };
    }
});
