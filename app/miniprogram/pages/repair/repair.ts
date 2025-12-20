// pages/repair/repair.ts
Page({
    data: {
        // 报修类别：public-公共区域，household-入户维修
        category: 'household',
        // 报修类型
        repairType: '',
        typeText: '',
        showTypePicker: false,
        typeOptions: ['水电', '电气', '门窗', '公区', '其他'],
        typeMapping: {
            '水电': 'water',
            '电气': 'electric', 
            '门窗': 'door',
            '公区': 'public',
            '其他': 'other'
        } as Record<string, string>,
        // 紧急程度
        priority: 'low',
        // 报修位置
        location: '',
        // 问题摘要
        summary: '',
        // 详细描述
        description: '',
        // 联系信息
        reporterName: '',
        reporterPhone: '',
        // 图片/视频
        fileList: [],
        // 提示信息
        locationHint: '已为您预填绑定房屋信息，可修改',
        contactHint: '已为您预填个人信息，可修改',
    },

    onCategoryChange(event: any) {
        this.setData({ category: event.detail });
    },

    showTypePickerFn() {
        this.setData({ showTypePicker: true });
    },

    onTypeConfirm(event: any) {
        const { value, index } = event.detail;
        const selectedText = this.data.typeOptions[index];
        const selectedValue = this.data.typeMapping[selectedText];
        this.setData({
            repairType: selectedValue,
            typeText: selectedText,
            showTypePicker: false
        });
    },

    onTypeCancel() {
        this.setData({ showTypePicker: false });
    },

    onPriorityChange(event: any) {
        this.setData({ priority: event.detail });
    },

    onLocationChange(event: any) {
        this.setData({ location: event.detail });
    },

    onSummaryChange(event: any) {
        this.setData({ summary: event.detail });
    },

    onDescriptionChange(event: any) {
        this.setData({ description: event.detail });
    },

    onReporterNameChange(event: any) {
        this.setData({ reporterName: event.detail });
    },

    onReporterPhoneChange(event: any) {
        this.setData({ reporterPhone: event.detail });
    },

    afterRead(event: any) {
        const { file } = event.detail;
        // When real API is ready, upload image here
        const { fileList = [] } = this.data;
        fileList.push({ ...file });
        this.setData({ fileList });
    },

    deleteFile(event: any) {
        const { index } = event.detail;
        const { fileList } = this.data;
        fileList.splice(index, 1);
        this.setData({ fileList });
    },

    onSubmit() {
        // 表单验证
        const { category, repairType, priority, location, summary, description, reporterName, reporterPhone } = this.data;
        
        if (!repairType) {
            wx.showToast({ title: '请选择报修类型', icon: 'none' });
            return;
        }
        
        if (!location.trim()) {
            wx.showToast({ title: '请输入报修位置', icon: 'none' });
            return;
        }
        
        if (!summary.trim()) {
            wx.showToast({ title: '请输入问题摘要', icon: 'none' });
            return;
        }
        
        if (!description.trim()) {
            wx.showToast({ title: '请输入详细描述', icon: 'none' });
            return;
        }
        
        if (!reporterName.trim()) {
            wx.showToast({ title: '请输入联系人姓名', icon: 'none' });
            return;
        }
        
        if (!reporterPhone.trim()) {
            wx.showToast({ title: '请输入联系电话', icon: 'none' });
            return;
        }
        
        // 手机号格式验证
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(reporterPhone)) {
            wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
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
        
        // 提交报修工单到后端
        wx.request({
            url: 'http://127.0.0.1:8000/api/property/repair-orders',
            method: 'POST',
            data: {
                user_id: userInfo.user_id,
                category,
                repair_type: repairType,
                priority,
                location: location.trim(),
                summary: summary.trim(),
                description: description.trim(),
                reporter_name: reporterName.trim(),
                reporter_phone: reporterPhone.trim(),
                images: this.data.fileList.map(file => ({
                    image: file.url || file.path,
                    image_type: file.type === 'video' ? 'video' : 'image'
                }))
            },
            header: {
                'content-type': 'application/json',
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
            },
            success: (res: any) => {
                wx.hideLoading();
                console.log('报修工单提交响应:', res.data);
                
                if (res.statusCode === 200 && res.data.code === 200) {
                    wx.showToast({
                        title: '提交成功',
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
                console.error('报修工单提交失败:', err);
                wx.showToast({
                    title: '网络请求失败，请重试',
                    icon: 'none'
                });
            }
        });
    },

    onLoad() {
        // 加载用户绑定的房屋信息（同时获取联系信息）
        this.loadUserHouses();
        
        // 加载报修选项数据
        this.loadRepairOptions();
    },

    // 加载用户绑定的房屋信息
    loadUserHouses() {
        const userInfo = wx.getStorageSync('userInfo');
        if (!userInfo || !userInfo.user_id) {
            console.log('用户未登录，无法获取房屋信息');
            return;
        }

        wx.request({
            url: 'http://127.0.0.1:8000/api/property/house/my-houses',
            method: 'GET',
            data: {
                user_id: userInfo.user_id
            },
            header: {
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
            },
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const houses = res.data.data;
                    if (houses && houses.length > 0) {
                        // 使用第一个绑定的房屋作为默认报修位置和联系信息
                        const house = houses[0];
                        let location = '';
                        let reporterName = '';
                        let reporterPhone = '';
                        
                        // 获取位置信息
                        if (house.house_info) {
                            // API返回的数据格式
                            location = `${house.house_info.building_name}${house.house_info.unit_name}${house.house_info.room_number}`;
                        } else {
                            // 备选数据格式
                            location = `${house.building_name || ''}${house.unit_name || ''}${house.room_number || ''}`;
                        }
                        
                        // 获取联系信息（从房屋绑定申请信息中获取）
                        if (house.applicant_info) {
                            // API返回的申请人信息
                            reporterName = house.applicant_info.name || '';
                            reporterPhone = house.applicant_info.phone || '';
                            console.log('从applicant_info获取联系信息:', { reporterName, reporterPhone });
                        } else {
                            // 备选格式（直接从house对象获取）
                            reporterName = house.applicant_name || '';
                            reporterPhone = house.applicant_phone || '';
                            console.log('从house直接字段获取联系信息:', { reporterName, reporterPhone });
                        }
                        
                        console.log('房屋数据结构:', house);
                        
                        // 更新数据
                        const updateData: any = {};
                        
                        if (location.trim()) {
                            updateData.location = location.trim();
                            updateData.locationHint = '已为您预填绑定房屋信息，可修改';
                        } else {
                            updateData.locationHint = '请输入您的房屋位置信息';
                        }
                        
                        if (reporterName || reporterPhone) {
                            updateData.reporterName = reporterName;
                            updateData.reporterPhone = reporterPhone;
                            updateData.contactHint = '已为您预填绑定信息，可修改';
                        } else {
                            updateData.contactHint = '请完善您的联系信息';
                        }
                        
                        this.setData(updateData);
                    } else {
                        console.log('用户暂无绑定房屋');
                        this.setData({
                            locationHint: '请输入您的房屋位置信息',
                            contactHint: '请完善您的联系信息'
                        });
                    }
                } else {
                    console.log('获取用户房屋信息失败:', res.data.message || '未知错误');
                    this.setData({
                        locationHint: '请输入您的房屋位置信息',
                        contactHint: '请完善您的联系信息'
                    });
                }
            },
            fail: (err) => {
                console.error('获取用户房屋信息网络请求失败:', err);
                this.setData({
                    locationHint: '请输入您的房屋位置信息',
                    contactHint: '请完善您的联系信息'
                });
            }
        });
    },

    // 从后端获取报修选项数据
    loadRepairOptions() {
        wx.request({
            url: 'http://127.0.0.1:8000/api/property/repair-orders/options',
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const types = res.data.data.types;
                    const typeOptions = types.map((item: any) => item.label);
                    const typeMapping: Record<string, string> = {};
                    types.forEach((item: any) => {
                        typeMapping[item.label] = item.value;
                    });
                    this.setData({ typeOptions, typeMapping });
                } else {
                    console.error('获取报修选项失败:', res.data);
                }
            },
            fail: (err) => {
                console.error('获取报修选项网络请求失败:', err);
            }
        });
    }
});