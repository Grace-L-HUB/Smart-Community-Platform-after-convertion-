// pages/services/announcements/announcements.ts
Page({
    data: {
        searchValue: '',
        activeTab: 0,
        announcements: [] as any[],
        filteredAnnouncements: [] as any[],
        hasMore: false,
        loading: false,
        page: 1,
        // 分类标签
        categories: ['全部', '物业通知', '社区新闻', '温馨提示'],
        // 原始数据存储
        allAnnouncements: [] as any[]
    },

    onLoad() {
        this.loadAnnouncements();
    },

    loadAnnouncements() {
        if (this.data.loading) return;
        
        this.setData({ loading: true });

        wx.request({
            url: 'http://127.0.0.1:8000/api/property/announcements',
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const announcements = res.data.data || [];
                    
                    // 处理公告数据格式
                    const processedAnnouncements = announcements
                        .filter((item: any) => item.status === 'published') // 只显示已发布的
                        .map((item: any) => ({
                            id: item.id,
                            isTop: false, // 后端暂未实现置顶功能，可后续添加
                            category: this.getCategoryName(item.scope, item.target_buildings),
                            title: item.title,
                            summary: this.stripHtml(item.content).substring(0, 100) + '...',
                            time: this.formatTime(item.created_at),
                            views: item.read_count || 0,
                            status: item.status,
                            scope: item.scope,
                            created_at: item.created_at,
                            content: item.content
                        }))
                        .sort((a: any, b: any) => {
                            // 按创建时间倒序排列
                            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                        });

                    this.setData({
                        allAnnouncements: processedAnnouncements,
                        loading: false
                    });

                    // 应用当前的筛选条件
                    this.applyFilter();
                } else {
                    console.error('获取公告列表失败:', res.data);
                    this.setData({ loading: false });
                    wx.showToast({
                        title: '获取公告失败',
                        icon: 'none'
                    });
                }
            },
            fail: (err) => {
                console.error('获取公告列表网络请求失败:', err);
                this.setData({ loading: false });
                wx.showToast({
                    title: '网络请求失败',
                    icon: 'none'
                });
            }
        });
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

    // 去除HTML标签
    stripHtml(html: string): string {
        if (!html) return '';
        return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
    },

    // 格式化时间
    formatTime(timeStr: string): string {
        if (!timeStr) return '';
        
        const now = new Date();
        const time = new Date(timeStr);
        const diff = now.getTime() - time.getTime();
        
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        
        if (diff < hour) {
            return Math.floor(diff / minute) + '分钟前';
        } else if (diff < day) {
            return Math.floor(diff / hour) + '小时前';
        } else if (diff < 7 * day) {
            return Math.floor(diff / day) + '天前';
        } else {
            return time.getFullYear() + '-' + 
                   String(time.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(time.getDate()).padStart(2, '0');
        }
    },

    // 应用筛选条件
    applyFilter() {
        let filtered = [...this.data.allAnnouncements];
        
        // 按分类筛选
        if (this.data.activeTab > 0) {
            const activeCategory = this.data.categories[this.data.activeTab];
            filtered = filtered.filter((item: any) => item.category === activeCategory);
        }
        
        // 按搜索关键字筛选
        if (this.data.searchValue.trim()) {
            const keyword = this.data.searchValue.trim().toLowerCase();
            filtered = filtered.filter((item: any) => 
                item.title.toLowerCase().includes(keyword) ||
                item.summary.toLowerCase().includes(keyword)
            );
        }
        
        this.setData({
            announcements: filtered,
            hasMore: false // 暂时不支持分页加载
        });
    },

    onSearchChange(event: any) {
        this.setData({ searchValue: event.detail });
    },

    onSearch() {
        console.log('Search:', this.data.searchValue);
        this.applyFilter();
    },

    onTabChange(event: any) {
        const activeTab = event.detail.index;
        this.setData({ activeTab });
        this.applyFilter();
    },

    onAnnouncementClick(event: any) {
        const id = event.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/services/announcement-detail/announcement-detail?id=${id}`
        });
    },

    onLoadMore() {
        if (this.data.loading || !this.data.hasMore) {
            return;
        }
        
        // 暂时不支持分页，显示提示
        wx.showToast({
            title: '已显示全部公告',
            icon: 'none'
        });
    }
});
