Page({
    data: {
        services: [
            { id: 1, name: '日常保洁', price: 80, icon: '' },
            { id: 2, name: '深度清洁', price: 150, icon: '' },
            { id: 3, name: '家电清洗', price: 100, icon: '' },
            { id: 4, name: '开荒保洁', price: 200, icon: '' },
            { id: 5, name: '家具维修', price: 120, icon: '' },
            { id: 6, name: '管道疏通', price: 80, icon: '' }
        ],
        serviceNames: ['日常保洁', '深度清洁', '家电清洗', '开荒保洁', '家具维修', '管道疏通'],
        selectedService: '', serviceTime: '', address: '', phone: '', remark: '',
        showService: false, showTime: false,
        currentDate: new Date().getTime(), minDate: new Date().getTime()
    },
    onServiceClick(e: any) {
        const id = e.currentTarget.dataset.id;
        const service = this.data.services.find(s => s.id === id);
        if (service) this.setData({ selectedService: service.name });
    },
    showServicePicker() { this.setData({ showService: true }); },
    closeServicePicker() { this.setData({ showService: false }); },
    onServiceConfirm(e: any) { this.setData({ selectedService: e.detail.value, showService: false }); },
    showTimePicker() { this.setData({ showTime: true }); },
    closeTimePicker() { this.setData({ showTime: false }); },
    onTimeConfirm(e: any) {
        const d = new Date(e.detail);
        this.setData({ serviceTime: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, showTime: false });
    },
    onAddressChange(e: any) { this.setData({ address: e.detail }); },
    onPhoneChange(e: any) { this.setData({ phone: e.detail }); },
    onRemarkChange(e: any) { this.setData({ remark: e.detail }); },
    onSubmit() {
        const { selectedService, serviceTime, address, phone } = this.data;
        if (!selectedService || !serviceTime || !address || !phone) {
            wx.showToast({ title: '请填写必填项', icon: 'none' });
            return;
        }
        wx.showLoading({ title: '预约中...' });
        setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '预约成功', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1500);
        }, 1000);
    }
});
