// pages/community/help-publish/help-publish.ts
Page({
    data: {
        content: '',
        tags: ['急', '借物', '寻物', '帮忙'],
        selectedTag: '',
        phone: ''
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

    onSubmit() {
        if (!this.data.content) {
            wx.showToast({ title: '请输入求助内容', icon: 'none' });
            return;
        }
        wx.showLoading({ title: '发布中...' });
        setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '发布成功', icon: 'success' });
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
        }, 1000);
    }
});
