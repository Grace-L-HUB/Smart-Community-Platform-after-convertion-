// pages/payment/payment.ts
Page({
    data: {
        totalAmount: 0,
        selectedBills: [],
        bills: [
            {
                id: '1',
                name: '4月 物业管理费',
                amount: 35000, // in cents
                period: '2023-04-01 ~ 2023-04-30',
                isOverdue: true
            },
            {
                id: '2',
                name: '4月 车位管理费',
                amount: 8000,
                period: '2023-04-01 ~ 2023-04-30',
                isOverdue: false
            }
        ]
    },

    onLoad() {
        this.calculateTotal();
    },

    onBillChange(event: any) {
        this.setData({
            selectedBills: event.detail
        });
        this.calculateTotal();
    },

    calculateTotal() {
        const { selectedBills, bills } = this.data;
        let total = 0;
        bills.forEach((bill: any) => {
            if (selectedBills.includes(bill.id)) {
                total += bill.amount;
            }
        });
        this.setData({ totalAmount: total });
    },

    onSubmit() {
        if (this.data.totalAmount === 0) {
            return wx.showToast({ title: '请选择账单', icon: 'none' });
        }
        wx.showLoading({ title: '支付中...' });
        setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '支付成功' });
            setTimeout(() => wx.navigateBack(), 1500);
        }, 1500);
    }
});
