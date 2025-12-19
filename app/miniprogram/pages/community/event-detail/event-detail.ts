// pages/community/event-detail/event-detail.ts
const API_BASE_URL = 'http://127.0.0.1:8000/api/community'

Page({
    data: {
        id: 0,
        loading: false,
        
        // 活动基本信息
        banner: '',
        title: '',
        description: '',
        location: '',
        start_time: '',
        end_time: '',
        
        // 显示格式化的时间
        time: '',
        
        // 报名信息
        enrolledCount: 0,
        maxCount: 0,
        status: 'upcoming',
        
        // 活动状态
        can_register: false,
        user_registered: false,
        is_active: true,
        
        // 组织者信息
        organizer: {
            name: '',
            logo: '',
            description: ''
        },
        
        // 报名用户列表
        participants: [],
        
        // UI状态
        isEnrolled: false,
        isFull: false,
        isFavorite: false,
        
        // 活动状态显示
        status_text: '',
        status_color: 'primary'
    },

    onLoad(options: any) {
        if (options.id) {
            this.setData({ id: options.id });
            this.loadEventDetail(options.id);
        }
    },

    // 获取用户token
    getUserToken() {
        const userInfo = wx.getStorageSync('userInfo');
        return userInfo ? userInfo.token : null;
    },

    loadEventDetail(id: string) {
        this.setData({ loading: true });

        wx.request({
            url: `${API_BASE_URL}/activities/${id}/`,
            method: 'GET',
            header: {
                'Content-Type': 'application/json'
                // 暂时不需要Authorization，因为后端使用AllowAny权限
            },
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const activity = res.data.data;
                    
                    this.setData({
                        // 基本信息
                        title: activity.title,
                        description: activity.description,
                        location: activity.location,
                        start_time: activity.start_time,
                        end_time: activity.end_time,
                        
                        // 格式化时间显示
                        time: this.formatDateTime(activity.start_time, activity.end_time),
                        
                        // 报名信息
                        enrolledCount: activity.current_participants,
                        maxCount: activity.max_participants,
                        status: activity.status,
                        
                        // 活动状态
                        can_register: activity.can_register,
                        user_registered: activity.user_registered,
                        is_active: activity.is_active,
                        
                        // 组织者信息
                        organizer: {
                            name: activity.organizer?.display_name || activity.organizer?.nickname || '社区管理员',
                            logo: activity.organizer?.avatar || '',
                            description: '社区活动组织者'
                        },
                        
                        // 生成活动banner
                        banner: `https://picsum.photos/seed/${activity.id}/800/400`,
                        
                        // UI状态
                        isEnrolled: activity.user_registered,
                        isFull: activity.current_participants >= activity.max_participants,
                        
                        // 状态显示
                        status_text: this.getStatusText(activity.status),
                        status_color: this.getStatusColor(activity.status)
                    });
                    
                    // 加载报名用户列表
                    this.loadParticipants(id);
                    
                } else {
                    wx.showToast({ title: res.data.message || '加载失败', icon: 'none' });
                }
            },
            fail: (error) => {
                console.error('加载活动详情失败:', error);
                wx.showToast({ title: '网络错误', icon: 'none' });
            },
            complete: () => {
                this.setData({ loading: false });
            }
        });
    },

    // 加载报名用户列表
    loadParticipants(activityId: string) {
        wx.request({
            url: `${API_BASE_URL}/activities/${activityId}/participants/`,
            method: 'GET',
            header: {
                'Content-Type': 'application/json'
                // 暂时不需要Authorization，因为后端使用AllowAny权限
            },
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const participants = res.data.data.map((item: any) => ({
                        id: item.id,
                        avatar: item.user.avatar || '/image/default-avatar.png',
                        name: item.user.display_name || item.user.nickname
                    }));
                    
                    this.setData({ participants });
                }
            },
            fail: (error) => {
                console.error('加载报名列表失败:', error);
            }
        });
    },

    // 格式化日期时间显示
    formatDateTime(startTime: string, endTime: string): string {
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        const startMonth = start.getMonth() + 1;
        const startDay = start.getDate();
        const startHour = start.getHours().toString().padStart(2, '0');
        const startMin = start.getMinutes().toString().padStart(2, '0');
        const endHour = end.getHours().toString().padStart(2, '0');
        const endMin = end.getMinutes().toString().padStart(2, '0');
        
        return `${startMonth}月${startDay}日 ${startHour}:${startMin}-${endHour}:${endMin}`;
    },

    // 获取活动状态文本
    getStatusText(status: string): string {
        const statusMap: any = {
            'upcoming': '即将开始',
            'ongoing': '进行中',
            'ended': '已结束',
            'cancelled': '已取消'
        };
        return statusMap[status] || status;
    },

    // 获取活动状态颜色
    getStatusColor(status: string): string {
        const colorMap: any = {
            'upcoming': 'primary',
            'ongoing': 'success',
            'ended': 'default',
            'cancelled': 'danger'
        };
        return colorMap[status] || 'default';
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
            // 如果已报名，询问是否取消
            this.cancelRegistration();
            return;
        }

        if (this.data.isFull) {
            wx.showToast({
                title: '名额已满',
                icon: 'none'
            });
            return;
        }

        if (!this.data.can_register) {
            wx.showToast({
                title: '暂不可报名',
                icon: 'none'
            });
            return;
        }

        wx.showModal({
            title: '确认报名',
            content: `确定要报名参加"${this.data.title}"吗？`,
            success: (res) => {
                if (res.confirm) {
                    this.submitRegistration();
                }
            }
        });
    },

    // 提交报名
    submitRegistration() {
        const token = this.getUserToken();
        if (!token) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        wx.showLoading({ title: '报名中...' });

        wx.request({
            url: `${API_BASE_URL}/activities/${this.data.id}/register/`,
            method: 'POST',
            header: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: {
                note: '', // 可以添加报名备注
                contact_phone: '' // 可以添加联系电话
            },
            success: (res: any) => {
                wx.hideLoading();
                if (res.statusCode === 200 && res.data.code === 200) {
                    wx.showToast({
                        title: res.data.message || '报名成功',
                        icon: 'success'
                    });

                    this.setData({
                        isEnrolled: true,
                        user_registered: true,
                        enrolledCount: this.data.enrolledCount + 1
                    });

                    // 重新加载参与者列表
                    this.loadParticipants(this.data.id.toString());
                } else {
                    wx.showToast({
                        title: res.data.message || '报名失败',
                        icon: 'none'
                    });
                }
            },
            fail: (error) => {
                wx.hideLoading();
                console.error('报名失败:', error);
                wx.showToast({ title: '网络错误', icon: 'none' });
            }
        });
    },

    // 取消报名
    cancelRegistration() {
        wx.showModal({
            title: '取消报名',
            content: '确定要取消报名吗？',
            success: (res) => {
                if (res.confirm) {
                    const token = this.getUserToken();
                    if (!token) {
                        wx.showToast({ title: '请先登录', icon: 'none' });
                        return;
                    }

                    wx.showLoading({ title: '取消中...' });

                    wx.request({
                        url: `${API_BASE_URL}/activities/${this.data.id}/cancel/`,
                        method: 'DELETE',
                        header: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        success: (res: any) => {
                            wx.hideLoading();
                            if (res.statusCode === 200 && res.data.code === 200) {
                                wx.showToast({
                                    title: res.data.message || '已取消报名',
                                    icon: 'success'
                                });

                                this.setData({
                                    isEnrolled: false,
                                    user_registered: false,
                                    enrolledCount: Math.max(0, this.data.enrolledCount - 1)
                                });

                                // 重新加载参与者列表
                                this.loadParticipants(this.data.id.toString());
                            } else {
                                wx.showToast({
                                    title: res.data.message || '取消失败',
                                    icon: 'none'
                                });
                            }
                        },
                        fail: (error) => {
                            wx.hideLoading();
                            console.error('取消报名失败:', error);
                            wx.showToast({ title: '网络错误', icon: 'none' });
                        }
                    });
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
