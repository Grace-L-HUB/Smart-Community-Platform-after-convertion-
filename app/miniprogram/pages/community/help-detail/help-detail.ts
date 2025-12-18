// pages/community/help-detail/help-detail.ts
Page({
    data: {
        id: 0,
        isOwner: false,
        isUrgent: true,
        userInfo: {
            name: '李先生',
            avatar: ''
        },
        publishTime: '10分钟前',
        title: '【求助】谁家有五号电池借两节？急用！',
        content: '孩子的玩具遥控器没电了，家里没有备用电池。哪位邻居方便的话能借两节五号电池吗？明天就去买，一定还！\n\n位置：3栋2单元',
        images: [],
        location: '阳光花园 3栋2单元',
        reward: '',
        responses: [
            {
                id: 1,
                name: '王女士',
                avatar: '',
                time: '5分钟前',
                message: '我家有，你来拿吧，1栋3单元501'
            },
            {
                id: 2,
                name: '张先生',
                avatar: '',
                time: '8分钟前',
                message: '我这也有，需要的话联系我'
            }
        ]
    },

    onLoad(options: any) {
        if (options.id) {
            this.setData({ id: options.id });
            this.loadHelpDetail(options.id);
        }

        // TODO: 判断是否是发布者
        // this.setData({ isOwner: true/false });
    },

    loadHelpDetail(id: string) {
        // TODO: 加载互助详情
        console.log('Loading help detail:', id);
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
                    wx.showLoading({ title: '提交中...' });

                    // TODO: 提交响应
                    setTimeout(() => {
                        wx.hideLoading();
                        wx.showToast({
                            title: '响应成功',
                            icon: 'success'
                        });

                        // 刷新响应列表
                        this.loadHelpDetail(this.data.id.toString());
                    }, 1000);
                }
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
        wx.showModal({
            title: '确认删除',
            content: '确定要删除这条求助吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.showLoading({ title: '删除中...' });

                    // TODO: 删除求助
                    setTimeout(() => {
                        wx.hideLoading();
                        wx.showToast({
                            title: '删除成功',
                            icon: 'success'
                        });

                        setTimeout(() => {
                            wx.navigateBack();
                        }, 1500);
                    }, 1000);
                }
            }
        });
    },

    onResolve() {
        wx.showModal({
            title: '标记为已解决',
            content: '确认问题已经解决了吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.showLoading({ title: '处理中...' });

                    // TODO: 标记为已解决
                    setTimeout(() => {
                        wx.hideLoading();
                        wx.showToast({
                            title: '已标记为解决',
                            icon: 'success'
                        });

                        setTimeout(() => {
                            wx.navigateBack();
                        }, 1500);
                    }, 1000);
                }
            }
        });
    }
});
