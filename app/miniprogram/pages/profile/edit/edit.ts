// pages/profile/edit/edit.ts
const API_BASE_URL = 'http://127.0.0.1:8000/api'
const API_UPLOAD_URL = 'http://127.0.0.1:8000/api/upload'

Page({
    data: {
        loading: true,
        userInfo: null as any,
        
        // 表单数据
        avatarList: [] as any[],
        nickname: '',
        genderText: '未知',
        gender: 0,
        phone: '',
        realName: '',
        province: '',
        city: '',
        district: '',
        address: '',
        
        // 弹窗控制
        showGender: false,
        
        // 选择器数据
        genders: ['未知', '男', '女'],
        
        // 上传状态
        uploadedAvatarUrl: ''
    },
    onLoad() {
        console.log('页面加载开始');
        this.loadUserProfile();
    },


    // 从本地存储获取用户信息
    getStoredUserInfo() {
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
            return null;
        }
        return userInfo;
    },

    // 加载用户信息
    loadUserProfile() {
        const storedUserInfo = this.getStoredUserInfo();
        if (!storedUserInfo) return;

        this.setData({ loading: true });

        wx.request({
            url: `${API_BASE_URL}/profile`,
            method: 'GET',
            data: {
                user_id: storedUserInfo.user_id
            },
            header: {
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
            },
            success: (res: any) => {
                console.log('获取用户信息:', res.data);
                if (res.statusCode === 200 && res.data.code === 200) {
                    const userInfo = res.data.data;
                    this.populateFormData(userInfo);
                } else {
                    wx.showToast({ 
                        title: res.data.message || '获取用户信息失败', 
                        icon: 'none' 
                    });
                }
                this.setData({ loading: false });
            },
            fail: (err) => {
                console.error('网络请求失败:', err);
                wx.showToast({ 
                    title: '网络请求失败', 
                    icon: 'none' 
                });
                this.setData({ loading: false });
            }
        });
    },

    // 填充表单数据
    populateFormData(userInfo: any) {
        const genderMap: { [key: number]: string } = { 0: '未知', 1: '男', 2: '女' };
        let avatarList: any[] = [];
        
        // 处理头像
        if (userInfo.avatar_url) {
            avatarList = [{
                url: userInfo.avatar_url,
                type: 'image'
            }];
        }

        console.log('填充用户数据:', {
            nickname: userInfo.nickname,
            gender: userInfo.gender,
            genderText: genderMap[userInfo.gender]
        });

        this.setData({
            userInfo: userInfo,
            avatarList: avatarList,
            nickname: userInfo.nickname || '',
            genderText: genderMap[userInfo.gender] || '未知',
            gender: userInfo.gender || 0,
            phone: userInfo.phone || '',
            realName: userInfo.real_name || '',
            province: userInfo.province || '',
            city: userInfo.city || '',
            district: userInfo.district || '',
            address: userInfo.address || ''
        });
    },

    // 头像选择
    onAvatarRead(e: any) {
        const { file } = e.detail;
        this.setData({ avatarList: [file] });
        this.uploadAvatar(file.url);
    },

    // 上传头像
    uploadAvatar(tempFilePath: string) {
        wx.showLoading({ title: '上传头像中...' });
        
        wx.uploadFile({
            url: `${API_UPLOAD_URL}/avatar`,
            filePath: tempFilePath,
            name: 'avatar',
            header: {
                'Content-Type': 'multipart/form-data'
            },
            success: (res) => {
                wx.hideLoading();
                try {
                    const result = JSON.parse(res.data);
                    if (result.code === 200) {
                        this.setData({
                            uploadedAvatarUrl: result.data.avatar_url
                        });
                        wx.showToast({ title: '头像上传成功', icon: 'success' });
                    } else {
                        wx.showToast({ title: result.message || '上传失败', icon: 'error' });
                    }
                } catch (error) {
                    wx.showToast({ title: '上传失败', icon: 'error' });
                }
            },
            fail: () => {
                wx.hideLoading();
                wx.showToast({ title: '上传失败，请重试', icon: 'error' });
            }
        });
    },

    // 表单输入处理
    onNicknameChange(e: any) {
        console.log('昵称输入:', e.detail);
        this.setData({ nickname: e.detail.value || e.detail });
    },
    onRealNameChange(e: any) {
        this.setData({ realName: e.detail.value || e.detail });
    },
    onProvinceChange(e: any) {
        this.setData({ province: e.detail.value || e.detail });
    },
    onCityChange(e: any) {
        this.setData({ city: e.detail.value || e.detail });
    },
    onDistrictChange(e: any) {
        this.setData({ district: e.detail.value || e.detail });
    },
    onAddressChange(e: any) {
        this.setData({ address: e.detail.value || e.detail });
    },

    // 性别选择器
    showGenderPicker() {
        console.log('显示性别选择器');
        this.setData({ showGender: true });
    },
    closeGenderPicker() {
        console.log('关闭性别选择器');
        this.setData({ showGender: false });
    },
    onGenderConfirm(e: any) {
        console.log('性别选择器确认:', e.detail);
        const genderText = e.detail.value;
        const genderMap: { [key: string]: number } = { '未知': 0, '男': 1, '女': 2 };
        this.setData({
            genderText: genderText,
            gender: genderMap[genderText] || 0,
            showGender: false
        });
    },


    // 保存用户信息
    onSave() {
        const storedUserInfo = this.getStoredUserInfo();
        if (!storedUserInfo) return;

        // 表单验证
        if (!this.data.nickname.trim()) {
            wx.showToast({ title: '请输入昵称', icon: 'none' });
            return;
        }

        wx.showLoading({ title: '保存中...' });

        const updateData: any = {
            user_id: storedUserInfo.user_id,
            nickname: this.data.nickname.trim(),
            gender: this.data.gender,
        };

        // 只添加有值的可选字段
        if (this.data.realName.trim()) {
            updateData.real_name = this.data.realName.trim();
        }
        if (this.data.province.trim()) {
            updateData.province = this.data.province.trim();
        }
        if (this.data.city.trim()) {
            updateData.city = this.data.city.trim();
        }
        if (this.data.district.trim()) {
            updateData.district = this.data.district.trim();
        }
        if (this.data.address.trim()) {
            updateData.address = this.data.address.trim();
        }

        // 如果有上传新头像，添加头像URL
        if (this.data.uploadedAvatarUrl) {
            updateData.avatar_url = this.data.uploadedAvatarUrl;
        }

        wx.request({
            url: `${API_BASE_URL}/profile`,
            method: 'PUT',
            data: updateData,
            header: {
                'content-type': 'application/json',
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
            },
            success: (res: any) => {
                wx.hideLoading();
                console.log('保存用户信息响应:', res.data);
                
                if (res.statusCode === 200 && res.data.code === 200) {
                    // 更新本地存储
                    const updatedUserInfo = { ...storedUserInfo, ...res.data.data };
                    wx.setStorageSync('userInfo', updatedUserInfo);
                    
                    wx.showToast({ 
                        title: '保存成功', 
                        icon: 'success' 
                    });
                    setTimeout(() => wx.navigateBack(), 1500);
                } else {
                    wx.showToast({ 
                        title: res.data.message || '保存失败', 
                        icon: 'none' 
                    });
                }
            },
            fail: (err) => {
                wx.hideLoading();
                console.error('保存用户信息失败:', err);
                wx.showToast({ 
                    title: '网络请求失败，请重试', 
                    icon: 'none' 
                });
            }
        });
    }
});
