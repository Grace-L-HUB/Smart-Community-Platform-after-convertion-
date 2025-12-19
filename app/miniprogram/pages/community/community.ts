// pages/community/community.ts
Page({
    data: {
        active: 0,
        marketItems: [
            {
                id: 1,
                user: "张三",
                avatar: "", // placeholder
                time: "1小时前",
                title: "转让九成新加湿器，无需滤网，静音",
                image: "https://img.yzcdn.cn/vant/apple-2.jpg",
                price: "50"
            },
            {
                id: 2,
                user: "王五",
                avatar: "", // placeholder
                time: "3小时前",
                title: "儿童自行车，适合3-6岁，自提",
                image: "https://img.yzcdn.cn/vant/apple-3.jpg",
                price: "100"
            }
        ]
    },

    onTabChange(e: any) {
        this.setData({ active: e.detail.name });
    },

    onMarketItemClick(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/community/market-detail/market-detail?id=${id}`
        });
    },

    onChatClick(_e: any) {
        wx.showToast({
            title: '打开聊天窗口',
            icon: 'none'
        });
    },

    onHelpClick(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/community/help-detail/help-detail?id=${id}`
        });
    },

    onHelpButtonClick(_e: any) {
        wx.navigateTo({
            url: `/pages/community/help-detail/help-detail?id=1`
        });
    },

    onEventClick(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/community/event-detail/event-detail?id=${id}`
        });
    },

    onEventEnrollClick(_e: any) {
        wx.navigateTo({
            url: `/pages/community/event-detail/event-detail?id=1`
        });
    },

    onPostClick() {
        if (this.data.active === 1) {
            wx.navigateTo({
                url: '/pages/community/help-publish/help-publish'
            });
        } else {
            wx.navigateTo({
                url: '/pages/community/post-item/post-item'
            });
        }
    }
});
