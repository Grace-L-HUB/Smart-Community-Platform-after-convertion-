Page({
    data: {
        type: 'identity',
        qrcodeUrl: 'https://img.yzcdn.cn/vant/cat.jpeg',
        title: '业主身份码',
        description: '请向门岗出示此码',
        userInfo: {
            name: '张三',
            room: '3栋2单元501'
        },
        validTime: '5分钟'
    },
    onLoad(options: any) {
        if (options.type) {
            this.setData({ type: options.type });
            this.loadQRCode(options.type, options.id);
        }
    },
    loadQRCode(type: string, id?: string) {
        // TODO: 根据类型加载不同的二维码
        if (type === 'visitor') {
            this.setData({
                title: '访客通行码',
                description: '访客凭此码进入小区'
            });
        }
    },
    onRefresh() {
        wx.showLoading({ title: '刷新中...' });
        setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '刷新成功', icon: 'success' });
        }, 1000);
    }
});
