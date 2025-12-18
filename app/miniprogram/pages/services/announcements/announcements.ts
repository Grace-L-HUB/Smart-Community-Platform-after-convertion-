// pages/services/announcements/announcements.ts
Page({
    data: {
        searchValue: '',
        activeTab: 0,
        announcements: [
            {
                id: 1,
                isTop: true,
                category: '物业通知',
                title: '关于小区正在进行绿化维护的通知',
                summary: '尊敬的业主：为提升小区环境，物业将于本周三上午9点至12点进行绿化维护工作...',
                time: '2小时前',
                views: 256
            },
            {
                id: 2,
                isTop: false,
                category: '社区新闻',
                title: '阳光花园社区荣获"文明社区"称号',
                summary: '在市级文明社区评选中，我们社区凭借优秀的管理和服务，成功获评"文明社区"...',
                time: '1天前',
                views: 189
            },
            {
                id: 3,
                isTop: false,
                category: '温馨提示',
                title: '近期天气转凉，请注意保暖',
                summary: '根据天气预报，未来一周气温将明显下降，请各位业主注意添衣保暖...',
                time: '2天前',
                views: 142
            },
            {
                id: 4,
                isTop: false,
                category: '物业通知',
                title: '电梯年检通知',
                summary: '根据相关规定，小区电梯将于下周进行年度安全检查，届时部分电梯将暂停使用...',
                time: '3天前',
                views: 321
            }
        ],
        hasMore: true,
        loading: false,
        page: 1
    },

    onLoad() {
        this.loadAnnouncements();
    },

    loadAnnouncements() {
        // TODO: 从服务器加载公告列表
        console.log('Loading announcements...');
    },

    onSearchChange(event: any) {
        this.setData({ searchValue: event.detail });
    },

    onSearch() {
        console.log('Search:', this.data.searchValue);
        // TODO: 执行搜索
        this.loadAnnouncements();
    },

    onTabChange(event: any) {
        const activeTab = event.detail.index;
        this.setData({
            activeTab,
            page: 1,
            announcements: []
        });
        this.loadAnnouncements();
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

        this.setData({ loading: true });

        // TODO: 加载更多数据
        setTimeout(() => {
            this.setData({
                loading: false,
                page: this.data.page + 1
            });
        }, 1000);
    }
});
