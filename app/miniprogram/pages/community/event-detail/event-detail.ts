// pages/community/event-detail/event-detail.ts
Page({
    data: {
        id: 0,
        banner: 'https://img.yzcdn.cn/vant/apple-1.jpg',
        title: '周末亲子绘画比赛报名啦！',
        time: '本周六 下午2:00-5:00',
        location: '社区活动中心2楼',
        enrolledCount: 15,
        maxCount: 30,
        isFree: true,
        isHot: true,
        deadline: '周五18:00',
        description: '亲爱的家长和小朋友们：\n\n社区将于本周六举办亲子绘画比赛活动，欢迎3-12岁的小朋友和家长一起参加！\n\n活动内容：\n• 亲子共同完成一幅绘画作品\n• 专业老师现场指导\n• 优秀作品将在社区展示\n• 所有参与者都有精美礼品\n\n我们提供：\n✓ 画纸、画笔、颜料等绘画工具\n✓ 茶点饮料\n✓ 精美奖品\n\n快来报名，让我们一起度过一个愉快的周末！',
        schedule: [
            { time: '14:00-14:30', content: '签到、领取绘画工具' },
            { time: '14:30-15:00', content: '活动介绍、主题讲解' },
            { time: '15:00-16:30', content: '亲子绘画创作时间' },
            { time: '16:30-17:00', content: '作品展示、评选、颁奖' }
        ],
        requirements: '1. 请提前10分钟到场签到\n2. 建议穿着不怕弄脏的衣服\n3. 家长需全程陪同孩子\n4. 请爱护活动场地和设施\n5. 如有特殊情况无法参加，请提前一天取消报名',
        enrolledUsers: [
            { id: 1, avatar: '' },
            { id: 2, avatar: '' },
            { id: 3, avatar: '' },
            { id: 4, avatar: '' },
            { id: 5, avatar: '' }
        ],
        organizer: {
            name: '阳光花园社区居委会',
            logo: '',
            description: '致力于为居民提供优质的社区服务'
        },
        isEnrolled: false,
        isFull: false,
        isFavorite: false
    },

    onLoad(options: any) {
        if (options.id) {
            this.setData({ id: options.id });
            this.loadEventDetail(options.id);
        }
    },

    loadEventDetail(id: string) {
        // TODO: 加载活动详情
        console.log('Loading event detail:', id);

        // 检查是否已满
        const isFull = this.data.enrolledCount >= this.data.maxCount;
        this.setData({ isFull });
    },

    onFavorite() {
        const isFavorite = !this.data.isFavorite;
        this.setData({ isFavorite });
        wx.showToast({
            title: isFavorite ? '已收藏' : '已取消收藏',
            icon: 'success'
        });
    },

    onShare() {
        wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline']
        });
    },

    onEnroll() {
        if (this.data.isEnrolled) {
            return;
        }

        if (this.data.isFull) {
            wx.showToast({
                title: '名额已满',
                icon: 'none'
            });
            return;
        }

        wx.showModal({
            title: '确认报名',
            content: '确定要报名参加这个活动吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.showLoading({ title: '报名中...' });

                    // TODO: 提交报名
                    setTimeout(() => {
                        wx.hideLoading();
                        wx.showToast({
                            title: '报名成功',
                            icon: 'success'
                        });

                        this.setData({
                            isEnrolled: true,
                            enrolledCount: this.data.enrolledCount + 1
                        });
                    }, 1000);
                }
            }
        });
    },

    onShareAppMessage() {
        return {
            title: this.data.title,
            path: `/pages/community/event-detail/event-detail?id=${this.data.id}`,
            imageUrl: this.data.banner
        };
    }
});
