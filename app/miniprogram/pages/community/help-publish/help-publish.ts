// pages/community/help-publish/help-publish.ts
const API_BASE_URL = 'http://127.0.0.1:8000/api/community'

Page({
    data: {
        content: '',
        tags: ['急', '借物', '寻物', '帮忙'],
        selectedTag: '',
        phone: '',
        location: ''
    },

    onInput(e: any) {
        this.setData({ content: e.detail.value });
    },

    onTagSelect(e: any) {
        this.setData({ selectedTag: e.currentTarget.dataset.tag });
    },

    onPhoneInput(e: any) {
        this.setData({ phone: e.detail });
    },

    // 获取用户token
    getUserToken() {
        const userInfo = wx.getStorageSync('userInfo');
        return userInfo ? userInfo.token : null;
    },

    onLocationInput(e: any) {
        this.setData({ location: e.detail.value });
    },

    onSubmit() {
        if (!this.data.content) {
            wx.showToast({ title: '请输入求助内容', icon: 'none' });
            return;
        }

        const token = this.getUserToken();
        if (!token) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        wx.showLoading({ title: '发布中...' });

        const data = {
            content: this.data.content,
            tag: this.data.selectedTag,
            phone: this.data.phone,
            location: this.data.location,
            is_urgent: this.data.selectedTag === '急'
        };

        wx.request({
            url: `${API_BASE_URL}/help-posts/`,
            method: 'POST',
            header: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: data,
            success: (res) => {
                wx.hideLoading();
                
                if (res.statusCode === 201) {
                    wx.showToast({ 
                        title: '发布成功', 
                        icon: 'success' 
                    });
                    setTimeout(() => {
                        wx.navigateBack();
                    }, 1500);
                } else {
                    wx.showToast({ 
                        title: '发布失败', 
                        icon: 'none' 
                    });
                }
            },
            fail: () => {
                wx.hideLoading();
                wx.showToast({ 
                    title: '网络错误', 
                    icon: 'none' 
                });
            }
        });
    }
});
