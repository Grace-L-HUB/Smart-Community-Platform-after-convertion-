// pages/house/binding/binding.ts
Page({
    data: {
        communityName: '阳光花园',
        building: '',
        unit: '',
        room: '',
        name: '',
        phone: '',
        idCard: '', // 身份证号

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

    // 身份证号输入
    onIdCardChange(event: any) {
        this.setData({ idCard: event.detail });
    },

    onSubmit() {
        const { building, unit, room, name, phone, idCard } = this.data;

        if (!building || !unit || !room) {
            wx.showToast({ title: '请先选择完整房屋信息', icon: 'none' });
            return;
        }
        if (!name) {
            wx.showToast({ title: '请输入业主姓名', icon: 'none' });
            return;
        }
        if (!phone || phone.length !== 11) {
            wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
            return;
        }
        if (!idCard) {
            wx.showToast({ title: '请输入身份证号', icon: 'none' });
            return;
        }
        // 简单校验：18位或15位，末位可以是X/x
        const idReg = /(^\d{15}$)|(^\d{17}(\d|X|x)$)/;
        if (!idReg.test(idCard)) {
            wx.showToast({ title: '身份证号格式不正确', icon: 'none' });
            return;
        }

        // 获取用户信息
        const userInfo = wx.getStorageSync('userInfo');
        if (!userInfo || !userInfo.user_id) {
            wx.showModal({
                title: '提示',
                content: '请先登录',
                showCancel: false,
                success: () => {
                    wx.reLaunch({
                        url: '/pages/login/login'
                    });
                }
            });
            return;
        }

        wx.showLoading({ title: '提交中...' });

        // 提交房屋绑定申请到后端
        wx.request({
            url: 'http://127.0.0.1:8000/api/house/binding/apply',
            method: 'POST',
            data: {
                user_id: userInfo.user_id,
                applicant_name: name,
                applicant_phone: phone,
                id_card_number: idCard,
                community_name: this.data.communityName,
                building_name: building,
                unit_name: unit,
                room_number: room,
                identity: 1  // 默认申请业主身份
            },
            header: {
                'content-type': 'application/json',
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
            },
            success: (res: any) => {
                wx.hideLoading();
                console.log('房屋绑定申请响应:', res.data);
                
                if (res.statusCode === 200 && res.data.code === 200) {
                    wx.showToast({ 
                        title: '申请提交成功，请等待审核', 
                        icon: 'success',
                        duration: 2000
                    });
                    setTimeout(() => wx.navigateBack(), 2000);
                } else {
                    wx.showToast({ 
                        title: res.data.message || '提交失败', 
                        icon: 'none' 
                    });
                }
            },
            fail: (err) => {
                wx.hideLoading();
                console.error('房屋绑定申请失败:', err);
                wx.showToast({ 
                    title: '网络请求失败，请重试', 
                    icon: 'none' 
                });
            }
        });
    }
});
