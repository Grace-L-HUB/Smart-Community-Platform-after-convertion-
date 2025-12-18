Page({
    data: {
        activeTab: 0,
        orders: [
            { id: 1, type: '物业缴费', title: '2024年12月物业费', time: '2024-12-18 10:00', amount: '500.00', status: 'pending', statusText: '待支付' },
            { id: 2, type: '家政服务', title: '日常保洁', time: '2024-12-17 14:00', amount: '80.00', status: 'paid', statusText: '已完成' },
            { id: 3, type: '物业缴费', title: '2024年11月物业费', time: '2024-11-18 09:00', amount: '500.00', status: 'paid', statusText: '已完成' }
        ]
    },
    onTabChange(e: any) {
        this.setData({ activeTab: e.detail.index });
    },
    onPay(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/payment/payment?orderId=${id}` });
    },
    onDetail(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.showToast({ title: '订单详情开发中', icon: 'none' });
    }
});
