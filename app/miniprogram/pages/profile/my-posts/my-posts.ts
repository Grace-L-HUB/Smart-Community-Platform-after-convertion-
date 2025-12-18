Page({
    data: {
        activeTab: 0,
        posts: [
            { id: 1, title: '转让九成新加湿器', image: 'https://img.yzcdn.cn/vant/apple-2.jpg', time: '2024-12-18', views: 56, price: '50' },
            { id: 2, title: '儿童自行车出售', image: 'https://img.yzcdn.cn/vant/apple-3.jpg', time: '2024-12-17', views: 32, price: '100' }
        ]
    },
    onTabChange(e: any) {
        this.setData({ activeTab: e.detail.index });
    },
    onEdit(e: any) {
        wx.showToast({ title: '编辑功能开发中', icon: 'none' });
    },
    onDelete(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.showModal({
            title: '确认删除',
            content: '确定要删除这条发布吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.showToast({ title: '删除成功', icon: 'success' });
                }
            }
        });
    }
});
