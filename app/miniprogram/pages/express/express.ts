Page({
    data: {
        activeTab: 0,
        expressList: [
            { id: 1, companyName: '顺丰速运', companyLogo: '', number: 'SF1234567890', location: '1号快递柜 A03', arriveTime: '2024-12-18 10:30', pickupCode: '123456' },
            { id: 2, companyName: '中通快递', companyLogo: '', number: 'ZT9876543210', location: '2号快递柜 B12', arriveTime: '2024-12-18 14:20', pickupCode: '654321' }
        ]
    },
    onTabChange(e: any) {
        this.setData({ activeTab: e.detail.index });
    },
    onPickup(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.showModal({
            title: '确认取件',
            content: '确认已取走快递吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.showToast({ title: '取件成功', icon: 'success' });
                }
            }
        });
    }
});
