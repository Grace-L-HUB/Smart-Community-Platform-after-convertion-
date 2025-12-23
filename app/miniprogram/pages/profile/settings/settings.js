// pages/profile/settings/settings.js
Page({
    onAccountSecurity() {
        wx.showModal({
            title: '账号安全',
            content: '账号安全功能正在开发中，敬请期待！',
            showCancel: false
        });
    },
    onMessageNotification() {
        wx.showModal({
            title: '消息通知',
            content: '消息通知功能正在开发中，敬请期待！',
            showCancel: false
        });
    },
    onPrivacySettings() {
        wx.showModal({
            title: '隐私设置',
            content: '隐私设置功能正在开发中，敬请期待！',
            showCancel: false
        });
    },
    onClearCache() {
        wx.showModal({
            title: '清除缓存',
            content: '确定要清除缓存吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.showToast({ title: '清除成功', icon: 'success' });
                }
            }
        });
    },
    onAbout() {
        wx.showModal({
            title: '关于我们',
            content: '智慧社区小程序 v1.0.0\n为社区居民提供便捷的物业服务',
            showCancel: false
        });
    },
    onLogout() {
        wx.showModal({
            title: '退出登录',
            content: '确定要退出登录吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.reLaunch({ url: '/pages/login/login' });
                }
            }
        });
    }
})