// pages/index/index.ts
Page({
    data: {
        userInfo: {
            nickName: "业主",
        }
    },

    onLoad() {
        // Check login status, etc.
    },

    showQRCode() {
        wx.showToast({
            title: '生成身份码...',
            icon: 'loading'
        });
    }
});
