// pages/services/announcement-detail/announcement-detail.ts
import { API_BASE_URL } from '../../../config/api'

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
        status: '',
        target_buildings: [] as string[],
        // 用户房屋绑定信息
        userBuildings: [] as string[]
    },

    onLoad(options: any) {
        if (options.id) {
            const announcementId = parseInt(options.id);
            this.setData({ id: announcementId });
            this.loadUserBuildings();
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
            url: `${API_BASE_URL}/property/announcements/${id}`,
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const announcement = res.data.data;
                    
                    // 权限校验：检查用户是否有权限查看此公告
                    if (!this.canViewBuildingAnnouncement(announcement.scope, announcement.target_buildings || [])) {
                        wx.showModal({
                            title: '无权限',
                            content: '您无权查看此公告，可能是因为您未绑定相关楼栋。',
                            showCancel: false,
                            success: () => {
                                wx.navigateBack();
                            }
                        });
                        this.setData({ loading: false });
                        return;
                    }
                    
                    this.setData({
                        id: announcement.id,
                        title: announcement.title,
                        content: announcement.content,
                        publishTime: this.formatDateTime(announcement.published_at || announcement.created_at),
                        views: announcement.read_count || 0,
                        author: announcement.author || '系统',
                        publisher: announcement.author || '物业管理处',
                        category: this.getCategoryName(announcement.category, announcement.category_text),
                        scope: announcement.scope,
                        status: announcement.status,
                        target_buildings: announcement.target_buildings || [],
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

    // 加载用户房屋绑定信息
    loadUserBuildings() {
        // 获取用户信息
        const userInfo = wx.getStorageSync('userInfo');
        if (!userInfo || !userInfo.user_id) {
            console.log('用户未登录，无法获取房屋绑定信息');
            return;
        }

        wx.request({
            url: `${API_BASE_URL}/property/house/my-houses?user_id=${userInfo.user_id}`,
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const bindings = res.data.data || [];
                    // 提取用户绑定的楼栋名称
                    const userBuildings = bindings.map((binding: any) => 
                        binding.house_info?.building_name
                    ).filter((building: string) => building);
                    
                    this.setData({ userBuildings });
                    console.log('详情页-用户绑定的楼栋:', userBuildings);
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
