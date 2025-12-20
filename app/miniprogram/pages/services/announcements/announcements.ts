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
        // 分类标签（与后端保持一致）
        categories: ['全部', '物业通知', '社区新闻', '温馨提示'],
        categoryMapping: {
            '物业通知': 'property_notice',
            '社区新闻': 'community_news', 
            '温馨提示': 'warm_tips'
        } as Record<string, string>,
        // 原始数据存储
        allAnnouncements: [] as any[],
        // 用户房屋绑定信息
        userBuildings: [] as string[]
    },

    onLoad() {
        this.loadUserBuildings();
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
                            category: this.getCategoryName(item.category, item.category_text),
                            categoryValue: item.category, // 存储原始分类值用于筛选
                            title: item.title,
                            summary: this.stripHtml(item.content).substring(0, 100) + '...',
                            time: this.formatTime(item.created_at),
                            views: item.read_count || 0,
                            status: item.status,
                            scope: item.scope,
                            target_buildings: item.target_buildings || [], // 存储目标楼栋信息
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

    // 根据category字段获取分类名称
    getCategoryName(category: string, categoryText?: string): string {
        // 优先使用后端返回的分类文本
        if (categoryText) {
            return categoryText;
        }
        
        // 备用映射
        const categoryMap: Record<string, string> = {
            'property_notice': '物业通知',
            'community_news': '社区新闻', 
            'warm_tips': '温馨提示'
        };
        
        return categoryMap[category] || '物业通知';
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
                    console.log('用户绑定的楼栋:', userBuildings);
                    
                    // 重新应用筛选条件（包含身份校验）
                    this.applyFilter();
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
    canViewBuildingAnnouncement(targetBuildings: string[]): boolean {
        if (!targetBuildings || targetBuildings.length === 0) {
            return true; // 没有指定楼栋，默认可以查看
        }
        
        // 检查用户绑定的楼栋是否与公告目标楼栋有交集
        return this.data.userBuildings.some(userBuilding => 
            targetBuildings.includes(userBuilding)
        );
    },

    // 应用筛选条件
    applyFilter() {
        let filtered = [...this.data.allAnnouncements];
        
        // 身份校验：过滤掉用户无权查看的楼栋公告
        filtered = filtered.filter((item: any) => {
            if (item.scope === 'all') {
                return true; // 全员公告，所有人都可以看
            } else if (item.scope === 'building') {
                return this.canViewBuildingAnnouncement(item.target_buildings);
            }
            return true;
        });
        
        // 按分类筛选
        if (this.data.activeTab > 0) {
            const activeCategoryName = this.data.categories[this.data.activeTab];
            const activeCategoryValue = this.data.categoryMapping[activeCategoryName];
            if (activeCategoryValue) {
                filtered = filtered.filter((item: any) => item.categoryValue === activeCategoryValue);
            }
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
