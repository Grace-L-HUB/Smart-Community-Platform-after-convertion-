const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
    data: {
        event: {},
        loading: false,
        isRegistered: false,
        canRegister: false
    },

    onLoad(options) {
        if (options.id) {
            this.loadEventDetail(options.id);
        }
    },

    getUserToken() {
        const userInfo = wx.getStorageSync('userInfo');
        return userInfo ? userInfo.token : null;
    },

    loadEventDetail(id) {
        const token = this.getUserToken();
        this.setData({ loading: true });

        const header = { 'Content-Type': 'application/json' };
        if (token) {
            header['Authorization'] = 'Bearer ' + token;
        }

        wx.request({
            url: API_BASE_URL + '/community/activities/' + id + '/',
            method: 'GET',
            header: header,
            success: (res) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const eventData = res.data.data;
                    this.setData({
                        event: this.processEventData(eventData),
                        isRegistered: eventData.user_registered || false,
                        canRegister: eventData.can_register || false,
                        loading: false
                    });
                } else {
                    wx.showToast({
                        title: res.data?.message || '加载失败',
                        icon: 'none'
                    });
                    this.setData({ loading: false });
                }
            },
            fail: (err) => {
                console.error('加载活动详情失败:', err);
                wx.showToast({
                    title: '网络错误',
                    icon: 'none'
                });
                this.setData({ loading: false });
            }
        });
    },

    processEventData(data) {
        return {
            id: data.id,
            title: data.title || '',
            description: data.description || '',
            location: data.location || '',
            startTime: this.formatTime(data.start_time),
            endTime: this.formatTime(data.end_time),
            startDateTime: data.start_time,
            endDateTime: data.end_time,
            maxParticipants: data.max_participants || 0,
            currentParticipants: data.current_participants || 0,
            registrationProgress: data.registration_progress || 0,
            status: data.status || '',
            statusText: this.getStatusText(data.status),
            statusColor: this.getStatusColor(data.status),
            organizer: data.organizer?.display_name || data.organizer?.nickname || '未知',
            organizerAvatar: data.organizer?.avatar || 'https://picsum.photos/seed/default/100/100',
            viewCount: data.view_count || 0,
            image: data.image || null,
            images: data.images?.map(img => img.image) || [],
            createdAt: this.formatCreatedTime(data.created_at)
        };
    },

    formatTime(timeStr) {
        if (!timeStr) return '';
        const date = new Date(timeStr);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');
        return `${month}-${day} ${hour}:${minute}`;
    },

    formatCreatedTime(timeStr) {
        if (!timeStr) return '';
        const date = new Date(timeStr);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${month}月${day}日`;
    },

    getStatusText(status) {
        const statusMap = {
            'upcoming': '即将开始',
            'ongoing': '进行中',
            'ended': '已结束',
            'cancelled': '已取消'
        };
        return statusMap[status] || status;
    },

    getStatusColor(status) {
        const colorMap = {
            'upcoming': '#07c160',
            'ongoing': '#1989fa',
            'ended': '#969799',
            'cancelled': '#ee0a24'
        };
        return colorMap[status] || '#969799';
    },

    // 报名活动
    onJoinEvent() {
        const token = this.getUserToken();
        if (!token) {
            wx.showToast({
                title: '请先登录',
                icon: 'none'
            });
            return;
        }

        const eventId = this.data.event.id;

        wx.request({
            url: API_BASE_URL + '/community/activities/' + eventId + '/register/',
            method: 'POST',
            header: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            success: (res) => {
                if ((res.statusCode === 200 || res.statusCode === 201) && res.data.code === 200) {
                    wx.showToast({
                        title: '报名成功',
                        icon: 'success',
                        duration: 1500
                    });
                    // 延迟刷新，确保 Toast 显示后再刷新
                    setTimeout(() => {
                        this.loadEventDetail(eventId);
                    }, 200);
                } else {
                    wx.showToast({
                        title: res.data?.message || '报名失败',
                        icon: 'none'
                    });
                }
            },
            fail: () => {
                wx.showToast({
                    title: '网络错误',
                    icon: 'none'
                });
            }
        });
    },

    // 取消报名
    onCancelRegistration() {
        const token = this.getUserToken();
        if (!token) {
            wx.showToast({
                title: '请先登录',
                icon: 'none'
            });
            return;
        }

        const eventId = this.data.event.id;

        wx.request({
            url: API_BASE_URL + '/community/activities/' + eventId + '/cancel/',
            method: 'DELETE',
            header: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            success: (res) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    wx.showToast({
                        title: '已取消报名',
                        icon: 'success',
                        duration: 1500
                    });
                    // 延迟刷新，确保 Toast 显示后再刷新
                    setTimeout(() => {
                        this.loadEventDetail(eventId);
                    }, 200);
                } else {
                    wx.showToast({
                        title: res.data?.message || '取消失败',
                        icon: 'none'
                    });
                }
            },
            fail: () => {
                wx.showToast({
                    title: '网络错误',
                    icon: 'none'
                });
            }
        });
    },

    // 图片加载失败处理
    onImageError() {
        const defaultAvatar = 'https://picsum.photos/seed/default/100/100';
        this.setData({
            'event.organizerAvatar': defaultAvatar
        });
    },

    // 预览图片
    onImagePreview(e) {
        const current = e.currentTarget.dataset.src;
        const urls = this.data.event.images || [];
        wx.previewImage({
            current: current,
            urls: urls
        });
    },

    // 分享
    onShare() {
        wx.showShareMenu({
            withShareTicket: true
        });
    },

    // 分享给朋友
    onShareAppMessage() {
        return {
            title: this.data.event.title || '社区活动',
            path: '/pages/community/event-detail/event-detail?id=' + this.data.event.id,
            imageUrl: this.data.event.images?.[0] || ''
        };
    }
});