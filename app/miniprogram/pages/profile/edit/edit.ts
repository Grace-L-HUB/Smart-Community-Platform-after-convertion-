Page({
    data: {
        avatarList: [] as any[],
        nickname: '张三',
        genderText: '男',
        gender: 1,
        phone: '138****5678',
        realName: '张三',
        showGender: false,
        genders: ['男', '女']
    },
    onAvatarRead(e: any) {
        this.setData({ avatarList: [e.detail.file] });
    },
    onNicknameChange(e: any) {
        this.setData({ nickname: e.detail });
    },
    onRealNameChange(e: any) {
        this.setData({ realName: e.detail });
    },
    showGenderPicker() {
        this.setData({ showGender: true });
    },
    closeGenderPicker() {
        this.setData({ showGender: false });
    },
    onGenderConfirm(e: any) {
        this.setData({
            genderText: e.detail.value,
            gender: e.detail.value === '男' ? 1 : 2,
            showGender: false
        });
    },
    onSave() {
        wx.showLoading({ title: '保存中...' });
        setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '保存成功', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1500);
        }, 1000);
    }
});
