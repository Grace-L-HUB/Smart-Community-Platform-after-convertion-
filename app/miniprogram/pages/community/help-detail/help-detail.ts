// pages/community/help-detail/help-detail.ts
import { API_BASE_URL } from '../../../config/api'
const API_COMMUNITY_URL = 'http://139.224.17.154:8000/api/community'
const MEDIA_BASE_URL = 'http://139.224.17.154:8000'

Page({
    data: {
        id: 0,
        isOwner: false,
        isUrgent: false,
        isResolved: false,
        publisher: {
            id: 0,
            name: '',
            avatar: ''
        },
        publishTime: '',
        title: '',
        content: '',
        tag: '',
        phone: '',
        location: '',
        images: [],
        responses: [],
        viewCount: 0,
        responseCount: 0,
        loading: true
    },

    onLoad(options: any) {
        if (options.id) {
            this.setData({ id: parseInt(options.id) });
            this.loadHelpDetail(options.id);
        }
    },

    // 获取用户token
    getUserToken() {
        const userInfo = wx.getStorageSync('userInfo');
        return userInfo ? userInfo.token : null;
    },

    loadHelpDetail(id: string) {
        const token = this.getUserToken();
        if (!token) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        wx.showLoading({ title: '加载中...' });

        wx.request({
            url: `${API_BASE_URL}/help-posts/${id}/`,
            method: 'GET',
            header: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            success: (res: any) => {
                if (res.statusCode === 200) {
                    const data = res.data;
                    console.log('Help detail data:', data);
                    console.log('Publisher info:', data.publisher);
                    this.setData({
                        title: data.title,
                        content: data.content,
                        tag: data.tag,
                        phone: data.phone,
                        location: data.location,
                        isUrgent: data.is_urgent,
                        isResolved: data.is_resolved,
                        publishTime: data.time_ago,
                        viewCount: data.view_count,
                        responseCount: data.response_count,
                        isOwner: data.is_owner,
                        images: data.images.map((img: any) => img.image),
                        responses: data.responses.map((resp: any) => ({
                            id: resp.id,
                            name: resp.responder.display_name || resp.responder.nickname || '匿名用户',
                            avatar: resp.responder.avatar ? 
                                (resp.responder.avatar.startsWith('http') ? 
                                    resp.responder.avatar : 
                                    `${MEDIA_BASE_URL}${resp.responder.avatar}`) : 
                                '',
                            time: resp.time_ago,
                            message: resp.message
                        })),
                        publisher: {
                            id: data.publisher.id,
                            name: data.publisher.display_name || data.publisher.nickname || '匿名用户',
                            avatar: data.publisher.avatar ? 
                                (data.publisher.avatar.startsWith('http') ? 
                                    data.publisher.avatar : 
                                    `${MEDIA_BASE_URL}${data.publisher.avatar}`) : 
                                ''
                        }
                    });
                } else {
                    wx.showToast({ title: '加载失败', icon: 'none' });
                }
            },
            fail: () => {
                wx.showToast({ title: '网络错误', icon: 'none' });
            },
            complete: () => {
                this.setData({ loading: false });
                wx.hideLoading();
            }
        });
    },

    previewImage(event: any) {
        const url = event.currentTarget.dataset.url;
        wx.previewImage({
            current: url,
            urls: this.data.images
        });
    },

    onHelp() {
        wx.showModal({
            title: '响应求助',
            editable: true,
            placeholderText: '请输入你的回复...',
            success: (res) => {
                if (res.confirm && res.content) {
                    this.submitResponse(res.content);
                }
            }
        });
    },

    submitResponse(message: string) {
        const token = this.getUserToken();
        if (!token) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        wx.showLoading({ title: '提交中...' });

        wx.request({
            url: `${API_BASE_URL}/help-posts/${this.data.id}/responses/`,
            method: 'POST',
            header: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: {
                message: message
            },
            success: (res: any) => {
                wx.hideLoading();
                
                if (res.statusCode === 201) {
                    wx.showToast({
                        title: '响应成功',
                        icon: 'success'
                    });

                    // 刷新响应列表
                    this.loadHelpDetail(this.data.id.toString());
                } else {
                    wx.showToast({ title: '提交失败', icon: 'none' });
                }
            },
            fail: () => {
                wx.hideLoading();
                wx.showToast({ title: '网络错误', icon: 'none' });
            }
        });
    },

    onContact(event: any) {
        const id = event.currentTarget.dataset.id;
        wx.showToast({
            title: '打开聊天窗口',
            icon: 'none'
        });
        // TODO: 跳转到聊天页面
        console.log('Contact user:', id);
    },

    onEdit() {
        wx.showToast({
            title: '编辑功能开发中',
            icon: 'none'
        });
        // TODO: 跳转到编辑页面
    },

    onDelete() {
        if (!this.data.isOwner) {
            wx.showToast({ title: '只有发布者可以删除', icon: 'none' });
            return;
        }

        wx.showModal({
            title: '确认删除',
            content: '确定要删除这条求助吗？',
            success: (res) => {
                if (res.confirm) {
                    this.deleteHelpPost();
                }
            }
        });
    },

    deleteHelpPost() {
        const token = this.getUserToken();
        if (!token) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        wx.showLoading({ title: '删除中...' });

        wx.request({
            url: `${API_BASE_URL}/help-posts/${this.data.id}/`,
            method: 'DELETE',
            header: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            success: (res) => {
                wx.hideLoading();
                
                if (res.statusCode === 204) {
                    wx.showToast({
                        title: '删除成功',
                        icon: 'success'
                    });

                    setTimeout(() => {
                        wx.navigateBack();
                    }, 1500);
                } else {
                    wx.showToast({ title: '删除失败', icon: 'none' });
                }
            },
            fail: () => {
                wx.hideLoading();
                wx.showToast({ title: '网络错误', icon: 'none' });
            }
        });
    },

    onResolve() {
        if (!this.data.isOwner) {
            wx.showToast({ title: '只有发布者可以标记为已解决', icon: 'none' });
            return;
        }

        wx.showModal({
            title: '标记为已解决',
            content: '确认问题已经解决了吗？',
            success: (res) => {
                if (res.confirm) {
                    this.resolveHelpPost();
                }
            }
        });
    },

    resolveHelpPost() {
        const token = this.getUserToken();
        if (!token) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        wx.showLoading({ title: '处理中...' });

        wx.request({
            url: `${API_BASE_URL}/help-posts/${this.data.id}/resolve/`,
            method: 'PUT',
            header: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            success: (res: any) => {
                wx.hideLoading();
                
                if (res.statusCode === 200) {
                    this.setData({ isResolved: true });
                    wx.showToast({
                        title: '已标记为解决',
                        icon: 'success'
                    });
                } else {
                    wx.showToast({ title: '操作失败', icon: 'none' });
                }
            },
            fail: () => {
                wx.hideLoading();
                wx.showToast({ title: '网络错误', icon: 'none' });
            }
        });
    }
});
