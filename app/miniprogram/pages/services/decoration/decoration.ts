Page({
    data: {
        decorationType: '', company: '', contact: '', phone: '', description: '',
        startDate: '', endDate: '', fileList: [] as any[],
        showType: false, showStart: false, showEnd: false,
        types: ['局部装修', '整体装修', '软装改造', '其他'],
        currentDate: new Date().getTime(), minDate: new Date().getTime()
    },
    showTypePicker() { this.setData({ showType: true }); },
    closeTypePicker() { this.setData({ showType: false }); },
    onTypeConfirm(e: any) { this.setData({ decorationType: e.detail.value, showType: false }); },
    showStartPicker() { this.setData({ showStart: true }); },
    closeStartPicker() { this.setData({ showStart: false }); },
    onStartConfirm(e: any) {
        const d = new Date(e.detail);
        this.setData({ startDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, showStart: false });
    },
    showEndPicker() { this.setData({ showEnd: true }); },
    closeEndPicker() { this.setData({ showEnd: false }); },
    onEndConfirm(e: any) {
        const d = new Date(e.detail);
        this.setData({ endDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, showEnd: false });
    },
    onCompanyChange(e: any) { this.setData({ company: e.detail }); },
    onContactChange(e: any) { this.setData({ contact: e.detail }); },
    onPhoneChange(e: any) { this.setData({ phone: e.detail }); },
    onDescChange(e: any) { this.setData({ description: e.detail }); },
    afterRead(e: any) {
        const { file } = e.detail;
        this.setData({ fileList: [...this.data.fileList, ...(Array.isArray(file) ? file : [file])] });
    },
    deleteFile(e: any) {
        const list = this.data.fileList;
        list.splice(e.detail.index, 1);
        this.setData({ fileList: list });
    },
    onSubmit() {
        const { decorationType, startDate, endDate, company, contact, phone } = this.data;
        if (!decorationType || !startDate || !endDate || !company || !contact || !phone) {
            wx.showToast({ title: '请填写必填项', icon: 'none' });
            return;
        }
        wx.showLoading({ title: '提交中...' });
        setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '申请已提交', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1500);
        }, 1000);
    }
});
