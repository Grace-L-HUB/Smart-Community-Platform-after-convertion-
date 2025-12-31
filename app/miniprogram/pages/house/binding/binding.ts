// pages/house/binding/binding.ts
import { API_BASE_URL } from '../../../config/api'

Page({
    data: {
        communityName: '阳光花园',
        building: '',
        unit: '',
        room: '',
        name: '',
        phone: '',
        idCard: '', // 身份证号
        identity: '', // 身份
        identityValue: 0, // 身份值

        showPicker: false,
        pickerType: '', // 'building', 'unit', 'room', 'identity'
        pickerTitle: '',
        currentColumns: [],

        // 从后端获取的数据
        buildingList: [] as string[],
        unitList: [] as string[],
        roomList: [] as string[],
        identityList: [] as any[], // 身份选项列表
        hasOwner: false // 该房屋是否已有业主
    },

    onLoad() {
        // 页面加载时获取楼栋列表
        this.loadBuildingList();
    },

    // 从后端获取楼栋列表
    loadBuildingList() {
        wx.request({
            url: `${API_BASE_URL}/property/house/options/buildings`,
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    this.setData({
                        buildingList: res.data.data
                    });
                } else {
                    console.error('获取楼栋列表失败:', res.data);
                    // 使用备用数据
                    this.setData({
                        buildingList: ['1栋', '2栋', '3栋', '4栋']
                    });
                }
            },
            fail: (err) => {
                console.error('获取楼栋列表网络请求失败:', err);
                // 使用备用数据
                this.setData({
                    buildingList: ['1栋', '2栋', '3栋', '4栋']
                });
            }
        });
    },

    // 根据楼栋获取单元列表
    loadUnitList(building: string) {
        wx.request({
            url: `${API_BASE_URL}/property/house/options/units?building=${encodeURIComponent(building)}`,
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    this.setData({
                        unitList: res.data.data,
                        // 重置单元和房号选择
                        unit: '',
                        room: '',
                        roomList: []
                    });
                } else {
                    console.error('获取单元列表失败:', res.data);
                    // 使用备用数据
                    this.setData({
                        unitList: ['1单元', '2单元'],
                        unit: '',
                        room: '',
                        roomList: []
                    });
                }
            },
            fail: (err) => {
                console.error('获取单元列表网络请求失败:', err);
                // 使用备用数据
                this.setData({
                    unitList: ['1单元', '2单元'],
                    unit: '',
                    room: '',
                    roomList: []
                });
            }
        });
    },

    // 根据楼栋和单元获取房号列表
    loadRoomList(building: string, unit: string) {
        wx.request({
            url: `${API_BASE_URL}/property/house/options/rooms?building=${encodeURIComponent(building)}&unit=${encodeURIComponent(unit)}`,
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    this.setData({
                        roomList: res.data.data,
                        // 重置房号选择
                        room: ''
                    });
                    
                    if (res.data.data.length === 0) {
                        wx.showToast({
                            title: '该单元暂无可绑定房屋',
                            icon: 'none'
                        });
                    }
                } else {
                    console.error('获取房号列表失败:', res.data);
                    // 使用备用数据
                    this.setData({
                        roomList: ['101', '102', '201', '202'],
                        room: ''
                    });
                }
            },
            fail: (err) => {
                console.error('获取房号列表网络请求失败:', err);
                // 使用备用数据
                this.setData({
                    roomList: ['101', '102', '201', '202'],
                    room: ''
                });
            }
        });
    },

    // 根据房屋信息获取可选身份列表
    loadIdentityList(building: string, unit: string, room: string) {
        wx.request({
            url: `${API_BASE_URL}/property/house/options/identities?building=${encodeURIComponent(building)}&unit=${encodeURIComponent(unit)}&room=${encodeURIComponent(room)}`,
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    this.setData({
                        identityList: res.data.data.identities,
                        hasOwner: res.data.data.has_owner,
                        // 重置身份选择
                        identity: '',
                        identityValue: 0
                    });
                    
                    if (res.data.data.has_owner) {
                        wx.showToast({
                            title: '该房屋已有业主，只能申请家属或租客身份',
                            icon: 'none',
                            duration: 3000
                        });
                    }
                } else {
                    console.error('获取身份选项失败:', res.data);
                    // 使用备用数据
                    this.setData({
                        identityList: [
                            {"value": 1, "label": "业主"},
                            {"value": 2, "label": "家属"},
                            {"value": 3, "label": "租客"}
                        ],
                        hasOwner: false,
                        identity: '',
                        identityValue: 0
                    });
                }
            },
            fail: (err) => {
                console.error('获取身份选项网络请求失败:', err);
                // 使用备用数据
                this.setData({
                    identityList: [
                        {"value": 1, "label": "业主"},
                        {"value": 2, "label": "家属"},
                        {"value": 3, "label": "租客"}
                    ],
                    hasOwner: false,
                    identity: '',
                    identityValue: 0
                });
            }
        });
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
        if (!this.data.building) {
            wx.showToast({ title: '请先选楼栋', icon: 'none' });
            return;
        }
        
        if (this.data.unitList.length === 0) {
            wx.showToast({ title: '正在加载单元列表，请稍候', icon: 'none' });
            return;
        }
        
        this.setData({
            showPicker: true,
            pickerType: 'unit',
            pickerTitle: '选择单元',
            currentColumns: this.data.unitList
        });
    },

    showRoomPicker() {
        if (!this.data.unit) {
            wx.showToast({ title: '请先选单元', icon: 'none' });
            return;
        }
        
        if (this.data.roomList.length === 0) {
            wx.showToast({ title: '正在加载房号列表，请稍候', icon: 'none' });
            return;
        }
        
        this.setData({
            showPicker: true,
            pickerType: 'room',
            pickerTitle: '选择房号',
            currentColumns: this.data.roomList
        });
    },

    showIdentityPicker() {
        if (!this.data.room) {
            wx.showToast({ title: '请先选择房号', icon: 'none' });
            return;
        }
        
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
        if (type === 'building') {
            // 选择楼栋后，加载单元列表
            this.loadUnitList(value);
        } else if (type === 'unit') {
            // 选择单元后，加载房号列表
            this.loadRoomList(this.data.building, value);
        } else if (type === 'room') {
            // 选择房号后，加载身份选项列表
            this.loadIdentityList(this.data.building, this.data.unit, value);
        }
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
        const { building, unit, room, name, phone, idCard, identity, identityValue } = this.data;

        if (!building || !unit || !room) {
            wx.showToast({ title: '请先选择完整房屋信息', icon: 'none' });
            return;
        }
        if (!identity || identityValue === 0) {
            wx.showToast({ title: '请选择申请身份', icon: 'none' });
            return;
        }
        if (!name) {
            wx.showToast({ title: '请输入申请人姓名', icon: 'none' });
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
            url: `${API_BASE_URL}/property/house/binding/apply`,
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
                identity: identityValue  // 使用用户选择的身份
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
