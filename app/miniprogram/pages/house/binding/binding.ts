// pages/house/binding/binding.ts
Page({
    data: {
        communityName: '阳光花园',
        building: '',
        unit: '',
        room: '',
        name: '',
        phone: '',

        showPicker: false,
        pickerType: '', // 'building', 'unit', 'room'
        pickerTitle: '',
        currentColumns: [],

        // Mock Data
        buildingList: ['1栋', '2栋', '3栋'],
        unitList: ['1单元', '2单元'],
        roomList: ['101', '102', '201', '202']
    },

    showBuildingPicker() {
        this.setData({
            showPicker: true,
            pickerType: 'building',
            pickerTitle: '选择楼栋',
            currentColumns: this.data.buildingList
        });
    },

    showUnitPicker() {
        if (!this.data.building) return wx.showToast({ title: '请先选楼栋', icon: 'none' });
        this.setData({
            showPicker: true,
            pickerType: 'unit',
            pickerTitle: '选择单元',
            currentColumns: this.data.unitList
        });
    },

    showRoomPicker() {
        if (!this.data.unit) return wx.showToast({ title: '请先选单元', icon: 'none' });
        this.setData({
            showPicker: true,
            pickerType: 'room',
            pickerTitle: '选择房号',
            currentColumns: this.data.roomList
        });
    },

    onPickerCancel() {
        this.setData({ showPicker: false });
    },

    onPickerConfirm(event: any) {
        const { value } = event.detail;
        const type = this.data.pickerType;

        this.setData({
            [type]: value,
            showPicker: false
        });
    },

    onNameChange(event: any) {
        this.setData({ name: event.detail });
    },

    onPhoneChange(event: any) {
        this.setData({ phone: event.detail });
    },

    onSubmit() {
        // Validate and submit
        wx.showLoading({ title: '提交中...' });
        setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '提交成功' });
            setTimeout(() => wx.navigateBack(), 1500);
        }, 1000);
    }
});
