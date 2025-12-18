// pages/services/visitor/visitor.ts
Page({
    data: {
        activeTab: 0,
        visitors: [
            { id: 1, name: '张三', phone: '138****5678', visitTime: '2024-12-18 14:00', carNumber: '京A12345', status: 'pending', statusText: '待访问' },
            { id: 2, name: '李四', phone: '139****1234', visitTime: '2024-12-17 10:00', carNumber: '', status: 'visited', statusText: '已访问' },
            { id: 3, name: '王五', phone: '137****9876', visitTime: '2024-12-16 16:00', carNumber: '京B67890', status: 'expired', statusText: '已过期' }
        ],
        visitorName: '',
        visitorPhone: '',
        carNumber: '',
        visitTime: '',
        remark: '',
        showPicker: false,
        currentDate: new Date().getTime(),
        minDate: new Date().getTime()
    },

    onTabChange(event: any) {
        this.setData({ activeTab: event.detail.index });
    },

    onNameChange(event: any) {
        this.setData({ visitorName: event.detail });
    },

    onPhoneChange(event: any) {
        this.setData({ visitorPhone: event.detail });
    },

    onCarChange(event: any) {
        this.setData({ carNumber: event.detail });
    },

    onRemarkChange(event: any) {
        this.setData({ remark: event.detail });
    },

    showTimePicker() {
        this.setData({ showPicker: true });
    },

    closeTimePicker() {
        this.setData({ showPicker: false });
    },

    onTimeConfirm(event: any) {
        const date = new Date(event.detail);
        const visitTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        this.setData({ visitTime, showPicker: false });
    },

    onInvite() {
        const { visitorName, visitorPhone, visitTime } = this.data;
        if (!visitorName || !visitorPhone || !visitTime) {
            wx.showToast({ title: '请填写必填项', icon: 'none' });
            return;
        }

        wx.showLoading({ title: '发送中...' });
        setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '邀请已发送', icon: 'success' });
            this.setData({ visitorName: '', visitorPhone: '', carNumber: '', visitTime: '', remark: '', activeTab: 0 });
        }, 1000);
    },

    onShowQR(event: any) {
        const id = event.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/qrcode/qrcode?type=visitor&id=${id}` });
    },

    onCancel(event: any) {
        const id = event.currentTarget.dataset.id;
        wx.showModal({
            title: '确认取消',
            content: '确定要取消这条访客邀请吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.showToast({ title: '已取消', icon: 'success' });
                }
            }
        });
    }
});
