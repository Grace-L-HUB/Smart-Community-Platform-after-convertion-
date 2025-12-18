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
        wx.navigateTo({
            url: '/pages/qrcode/qrcode?type=identity'
        });
    },

    onNoticeClick() {
        wx.navigateTo({
            url: '/pages/services/announcements/announcements'
        });
    },

    onQuickAction(e: any) {
        const action = e.currentTarget.dataset.action;
        if (action === 'open') {
            wx.showToast({
                title: '开门中...',
                icon: 'loading'
            });
        } else if (action === 'call') {
            wx.makePhoneCall({
                phoneNumber: '400-123-4567'
            });
        }
    }
});
