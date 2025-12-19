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
        identity: '', // 身份
        identityValue: 0, // 身份值

        showPicker: false,
        pickerType: '', // 'area', 'parkingNo', 'identity'
        pickerTitle: '',
        currentColumns: [] as string[],

        // 从后端获取的数据
        areaList: [] as string[],
        parkingNoList: [] as string[],
        identityList: [] as any[] // 身份选项列表
    },

    onLoad() {
        // 页面加载时获取停车区域列表和身份选项
        this.loadAreaList();
        this.loadIdentityList();
    },

    // 从后端获取停车区域列表
    loadAreaList() {
        wx.request({
            url: 'http://127.0.0.1:8000/api/parking/options/areas',
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    this.setData({
                        areaList: res.data.data
                    });
                } else {
                    console.error('获取停车区域列表失败:', res.data);
                    // 使用备用数据
                    this.setData({
                        areaList: ['A区地下停车场', 'B区地下停车场', 'C区地面停车场', 'D区地面停车场']
                    });
                }
            },
            fail: (err) => {
                console.error('获取停车区域列表网络请求失败:', err);
                // 使用备用数据
                this.setData({
                    areaList: ['A区地下停车场', 'B区地下停车场', 'C区地面停车场', 'D区地面停车场']
                });
            }
        });
    },

    // 根据停车区域获取车位号列表
    loadParkingSpaceList(area: string) {
        wx.request({
            url: `http://127.0.0.1:8000/api/parking/options/spaces?area=${encodeURIComponent(area)}`,
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    this.setData({
                        parkingNoList: res.data.data,
                        // 重置车位号选择
                        parkingNo: ''
                    });
                    
                    if (res.data.data.length === 0) {
                        wx.showToast({
                            title: '该区域暂无可绑定车位',
                            icon: 'none'
                        });
                    }
                } else {
                    console.error('获取车位号列表失败:', res.data);
                    // 使用备用数据
                    const mockData = ['A-001', 'A-002', 'A-003'];
                    this.setData({
                        parkingNoList: mockData,
                        parkingNo: ''
                    });
                }
            },
            fail: (err) => {
                console.error('获取车位号列表网络请求失败:', err);
                // 使用备用数据
                const mockData = ['A-001', 'A-002', 'A-003'];
                this.setData({
                    parkingNoList: mockData,
                    parkingNo: ''
                });
            }
        });
    },

    // 获取车位身份选项列表
    loadIdentityList() {
        wx.request({
            url: 'http://127.0.0.1:8000/api/parking/options/identities',
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    this.setData({
                        identityList: res.data.data.identities
                    });
                } else {
                    console.error('获取身份选项失败:', res.data);
                    // 使用备用数据
                    this.setData({
                        identityList: [
                            {"value": 1, "label": "业主"},
                            {"value": 3, "label": "租客"}
                        ]
                    });
                }
            },
            fail: (err) => {
                console.error('获取身份选项网络请求失败:', err);
                // 使用备用数据
                this.setData({
                    identityList: [
                        {"value": 1, "label": "业主"},
                        {"value": 3, "label": "租客"}
                    ]
                });
            }
        });
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
        
        if (this.data.parkingNoList.length === 0) {
            wx.showToast({ title: '正在加载车位列表，请稍候', icon: 'none' });
            return;
        }
        
        this.setData({
            showPicker: true,
            pickerType: 'parkingNo',
            pickerTitle: '选择车位号',
            currentColumns: this.data.parkingNoList
        });
    },

    showIdentityPicker() {
        if (this.data.identityList.length === 0) {
            wx.showToast({ title: '正在加载身份选项，请稍候', icon: 'none' });
            return;
        }
        
        const identityLabels = this.data.identityList.map((item: any) => item.label);
        this.setData({
            showPicker: true,
            pickerType: 'identity',
            pickerTitle: '选择身份',
            currentColumns: identityLabels
        });
    },

    onPickerCancel() {
        this.setData({ showPicker: false });
    },

    onPickerConfirm(event: any) {
        const { value } = event.detail;
        const type = this.data.pickerType;

        if (type === 'identity') {
            // 身份选择需要特殊处理，获取对应的值
            const selectedIdentity = this.data.identityList.find((item: any) => item.label === value);
            this.setData({
                identity: value,
                identityValue: selectedIdentity ? selectedIdentity.value : 0,
                showPicker: false
            });
        } else {
            this.setData({
                [type]: value,
                showPicker: false
            });
        }

        // 级联加载数据
        if (type === 'parkingArea') {
            // 选择停车区域后，加载车位号列表
            this.loadParkingSpaceList(value);
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
        const { parkingType, parkingArea, parkingNo, carNo, carBrand, carColor, ownerName, ownerPhone, idCard, identity, identityValue } = this.data;

        // 表单验证
        if (!parkingArea) {
            wx.showToast({ title: '请选择停车区域', icon: 'none' });
            return;
        }
        if (!parkingNo) {
            wx.showToast({ title: '请选择车位号', icon: 'none' });
            return;
        }
        if (!identity || identityValue === 0) {
            wx.showToast({ title: '请选择申请身份', icon: 'none' });
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
                id_card: idCard,
                identity: identityValue  // 使用用户选择的身份
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
