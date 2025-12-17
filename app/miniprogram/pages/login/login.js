"use strict";
var defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';
Page({
    data: {
        phone: '',
        code: '',
        // Profile related
        showProfileInput: false,
        userInfo: {
            avatarUrl: defaultAvatarUrl,
            nickName: '',
        },
        // Internal state
        tempOpenId: '', // Stored during profile completion step
    },
    onPhoneInput: function (e) {
        this.setData({ phone: e.detail.value });
    },
    onCodeInput: function (e) {
        this.setData({ code: e.detail.value });
    },
    getVerificationCode: function () {
        if (!this.data.phone || this.data.phone.length !== 11) {
            wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
            return;
        }
        wx.showToast({ title: '验证码已发送(模拟)', icon: 'none' });
    },
    handlePhoneLogin: function () {
        var _this = this;
        var _a = this.data, phone = _a.phone, code = _a.code;
        if (!phone || !code) {
            wx.showToast({ title: '请填写手机号和验证码', icon: 'none' });
            return;
        }
        wx.showLoading({ title: '登录中...' });
        // Mock API
        setTimeout(function () {
            wx.hideLoading();
            _this.loginSuccess({
                id: 123,
                role: 1,
                token: 'mock_token_phone'
            });
        }, 1000);
    },
    handleWechatLogin: function () {
        var _this = this;
        wx.showLoading({ title: '授权中...' });
        wx.login({
            success: function (res) {
                if (res.code) {
                    // Mock Backend Check
                    _this.mockBackendWechatLogin(res.code).then(function (result) {
                        wx.hideLoading();
                        if (result.needProfile) {
                            _this.setData({
                                showProfileInput: true,
                                tempOpenId: result.openid
                            });
                        }
                        else {
                            _this.loginSuccess(result.user);
                        }
                    });
                }
            }
        });
    },
    mockBackendWechatLogin: function (code) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                // Simulate a new user scenario to show layout
                resolve({
                    needProfile: true, // Force true to satisfy user requirement of showing the feature
                    openid: 'mock_openid_' + code
                });
                // Use this for old user simulation:
                // resolve({ needProfile: false, user: { ... } })
            }, 800);
        });
    },
    // Profile handling (from index page)
    onChooseAvatar: function (e) {
        var avatarUrl = e.detail.avatarUrl;
        this.setData({
            "userInfo.avatarUrl": avatarUrl
        });
    },
    onNicknameChange: function (e) {
        var nickName = e.detail.value;
        this.setData({
            "userInfo.nickName": nickName
        });
    },
    cancelProfileUpdate: function () {
        this.setData({ showProfileInput: false });
    },
    handleSubmitProfile: function () {
        var _this = this;
        var _a = this.data.userInfo, avatarUrl = _a.avatarUrl, nickName = _a.nickName;
        if (!nickName || avatarUrl === defaultAvatarUrl) {
            wx.showToast({ title: '请完善头像和昵称', icon: 'none' });
            return;
        }
        wx.showLoading({ title: '注册中...' });
        setTimeout(function () {
            wx.hideLoading();
            _this.loginSuccess({
                id: 456,
                role: 0,
                token: 'mock_token_wechat_new',
                avatar: avatarUrl,
                nickname: nickName
            });
        }, 1000);
    },
    loginSuccess: function (user) {
        console.log('Login Success:', user);
        wx.setStorageSync('token', user.token);
        wx.setStorageSync('userInfo', user);
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(function () {
            wx.reLaunch({ url: '/pages/index/index' });
        }, 1500);
    }
});
