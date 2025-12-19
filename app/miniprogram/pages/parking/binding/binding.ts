// pages/parking/binding/binding.ts
Page({
    data: {
        communityName: '阳光花园',
        parkingType: 'owned', // 'owned' 自有, 'rented' 租赁
        parkingArea: '',
        parkingNo: '',
        carNo: '',
        carBrand: '',
        carColor: '',
        ownerName: '',
        ownerPhone: '',
        idCard: '', // 身份证号

        showPicker: false,
        pickerType: '', // 'area', 'parkingNo'
        pickerTitle: '',
        currentColumns: [] as string[],

        // Mock Data
        areaList: ['A区地下停车场', 'B区地下停车场', 'C区地面停车场', 'D区地面停车场'],
        parkingNoList: {
            'A区地下停车场': ['A-001', 'A-002', 'A-003', 'A-101', 'A-102', 'A-103'],
            'B区地下停车场': ['B-001', 'B-002', 'B-003', 'B-101', 'B-102', 'B-103'],
            'C区地面停车场': ['C-001', 'C-002', 'C-003', 'C-004', 'C-005'],
            'D区地面停车场': ['D-001', 'D-002', 'D-003', 'D-004', 'D-005']
        } as Record<string, string[]>
    },

    onTypeChange(event: any) {
        this.setData({ parkingType: event.detail });
    },

    showAreaPicker() {
        this.setData({
            showPicker: true,
            pickerType: 'parkingArea',
            pickerTitle: '选择停车区域',
            currentColumns: this.data.areaList
        });
    },

    showParkingNoPicker() {
        if (!this.data.parkingArea) {
            wx.showToast({ title: '请先选择停车区域', icon: 'none' });
            return;
        }
        const noList = this.data.parkingNoList[this.data.parkingArea] || [];
        this.setData({
            showPicker: true,
            pickerType: 'parkingNo',
            pickerTitle: '选择车位号',
            currentColumns: noList
        });
    },

    onPickerCancel() {
        this.setData({ showPicker: false });
    },

    onPickerConfirm(event: any) {
        const { value } = event.detail;
        const type = this.data.pickerType;

        // 如果切换了停车区域，需要清空车位号
        if (type === 'parkingArea' && value !== this.data.parkingArea) {
            this.setData({
                [type]: value,
                parkingNo: '',
                showPicker: false
            });
        } else {
            this.setData({
                [type]: value,
                showPicker: false
            });
        }
    },

    onCarNoChange(event: any) {
        this.setData({ carNo: event.detail });
    },

    onCarBrandChange(event: any) {
        this.setData({ carBrand: event.detail });
    },

    onCarColorChange(event: any) {
        this.setData({ carColor: event.detail });
    },

    onOwnerNameChange(event: any) {
        this.setData({ ownerName: event.detail });
    },

    onOwnerPhoneChange(event: any) {
        this.setData({ ownerPhone: event.detail });
    },

    onIdCardChange(event: any) {
        this.setData({ idCard: event.detail });
    },

    onSubmit() {
        const { parkingType, parkingArea, parkingNo, carNo, carBrand, carColor, ownerName, ownerPhone, idCard } = this.data;

        // 表单验证
        if (!parkingArea) {
            wx.showToast({ title: '请选择停车区域', icon: 'none' });
            return;
        }
        if (!parkingNo) {
            wx.showToast({ title: '请选择车位号', icon: 'none' });
            return;
        }
        if (!carNo) {
            wx.showToast({ title: '请输入车牌号', icon: 'none' });
            return;
        }
        // 车牌号格式校验（简单版）
        const carNoReg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/;
        if (!carNoReg.test(carNo)) {
            wx.showToast({ title: '请输入正确的车牌号', icon: 'none' });
            return;
        }
        if (!ownerName) {
            wx.showToast({ title: '请输入车主姓名', icon: 'none' });
            return;
        }
        if (!ownerPhone || ownerPhone.length !== 11) {
            wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
            return;
        }
        if (!idCard) {
            wx.showToast({ title: '请输入身份证号', icon: 'none' });
            return;
        }
        // 身份证号规则：15位或18位
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

        // 提交车位绑定申请到后端
        wx.request({
            url: 'http://127.0.0.1:8000/api/parking/binding/apply',
            method: 'POST',
            data: {
                user_id: userInfo.user_id,
                community_name: this.data.communityName,
                parking_type: parkingType,
                parking_area: parkingArea,
                parking_no: parkingNo,
                car_no: carNo,
                car_brand: carBrand || '',
                car_color: carColor || '',
                owner_name: ownerName,
                owner_phone: ownerPhone,
                id_card: idCard
            },
            header: {
                'content-type': 'application/json',
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
            },
            success: (res: any) => {
                wx.hideLoading();
                console.log('车位绑定申请响应:', res.data);

                if (res.statusCode === 200 && res.data.code === 200) {
                    wx.showToast({
                        title: '绑定成功',
                        icon: 'success',
                        duration: 2000
                    });
                    setTimeout(() => wx.navigateBack(), 2000);
                } else {
                    wx.showToast({
                        title: res.data.message || '绑定失败',
                        icon: 'none'
                    });
                }
            },
            fail: (err) => {
                wx.hideLoading();
                console.error('车位绑定申请失败:', err);
                wx.showToast({
                    title: '网络请求失败，请重试',
                    icon: 'none'
                });
            }
        });
    }
});
