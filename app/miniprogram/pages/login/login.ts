const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
const API_BASE_URL = 'http://127.0.0.1:8000/api/auth'

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
        isUserExists: true,
        loginType: 'phone', // 'phone' or 'wechat'
    },

    onPhoneInput(e: WechatMiniprogram.Input) {
        this.setData({ phone: e.detail.value })
    },

    onCodeInput(e: WechatMiniprogram.Input) {
        this.setData({ code: e.detail.value })
    },

    getVerificationCode() {
        if (!this.data.phone || this.data.phone.length !== 11) {
            wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
            return
        }

        wx.showLoading({ title: '发送中...' })

        wx.request({
            url: `${API_BASE_URL}/send-sms-code`,
            method: 'POST',
            data: { phone: this.data.phone },
            success: (res: any) => {
                wx.hideLoading()
                if (res.statusCode === 200 && res.data.code === 200) {
                    wx.showToast({ title: '验证码已发送', icon: 'success' })
                    // Check if user exists
                    const userExists = res.data.data.user_exists
                    this.setData({ isUserExists: userExists })

                    if (res.data.data.code) {
                        console.log('DEV ONLY: SMS Code is', res.data.data.code)
                        wx.showModal({ title: '测试验证码', content: res.data.data.code, showCancel: false })
                    }
                } else {
                    wx.showToast({ title: res.data.message || '发送失败', icon: 'none' })
                }
            },
            fail: (err) => {
                wx.hideLoading()
                wx.showToast({ title: '网络请求失败', icon: 'none' })
            }
        })
    },

    handlePhoneLogin() {
        const { phone, code, isUserExists } = this.data

        this.setData({ loginType: 'phone' })

        if (!phone || !code) {
            wx.showToast({ title: '请填写手机号和验证码', icon: 'none' })
            return
        }

        wx.showLoading({ title: '处理中...' })

        if (isUserExists) {
            this.performPhoneLogin()
        } else {
            this.verifyCodeForRegister()
        }
    },

    performPhoneLogin() {
        const { phone, code } = this.data
        wx.request({
            url: `${API_BASE_URL}/sms-login`,
            method: 'POST',
            data: { phone, code },
            success: (res: any) => {
                wx.hideLoading()
                if (res.statusCode === 200 && res.data.code === 200) {
                    this.loginSuccess(res.data.data)
                } else {
                    wx.showToast({ title: res.data.message || '登录失败', icon: 'none' })
                }
            },
            fail: () => {
                wx.hideLoading()
                wx.showToast({ title: '登录请求失败', icon: 'none' })
            }
        })
    },

    verifyCodeForRegister() {
        const { phone, code } = this.data
        wx.request({
            url: `${API_BASE_URL}/verify-code`,
            method: 'POST',
            data: { phone, code },
            success: (res: any) => {
                wx.hideLoading()
                if (res.statusCode === 200 && res.data.code === 200) {
                    this.setData({ showProfileInput: true })
                } else {
                    wx.showToast({ title: res.data.message || '验证码错误', icon: 'none' })
                }
            },
            fail: () => {
                wx.hideLoading()
                wx.showToast({ title: '验证请求失败', icon: 'none' })
            }
        })
    },

    handleWechatLogin() {
        wx.showLoading({ title: '微信授权中...' })

        wx.login({
            success: (res) => {
                if (res.code) {
                    // Call backend wechat-login
                    wx.request({
                        url: `${API_BASE_URL}/wechat-login`,
                        method: 'POST',
                        data: { code: res.code },
                        success: (apiRes: any) => {
                            wx.hideLoading()
                            if (apiRes.statusCode === 200 && apiRes.data.code === 200) {
                                const data = apiRes.data.data
                                if (data.need_profile) {
                                    // New user
                                    this.setData({
                                        showProfileInput: true,
                                        loginType: 'wechat'
                                    })
                                    wx.showToast({ title: '请完善信息', icon: 'none' })
                                } else {
                                    // Old user
                                    this.loginSuccess(data)
                                }
                            } else {
                                wx.showToast({ title: apiRes.data.message || '登录失败', icon: 'none' })
                            }
                        },
                        fail: () => {
                            wx.hideLoading()
                            wx.showToast({ title: '请求失败', icon: 'none' })
                        }
                    })
                } else {
                    wx.hideLoading()
                    wx.showToast({ title: '获取code失败', icon: 'none' })
                }
            }
        })
    },

    onChooseAvatar(e: any) {
        const { avatarUrl } = e.detail
        this.setData({
            "userInfo.avatarUrl": avatarUrl
        })
    },

    onNicknameChange(e: any) {
        const nickName = e.detail.value
        this.setData({
            "userInfo.nickName": nickName
        })
    },

    cancelProfileUpdate() {
        this.setData({ showProfileInput: false })
    },

    handleSubmitProfile() {
        const { phone, code, loginType } = this.data
        const { avatarUrl, nickName } = this.data.userInfo

        if (!nickName || avatarUrl === defaultAvatarUrl) {
            wx.showToast({ title: '请完善头像和昵称', icon: 'none' })
            return
        }

        if (loginType === 'wechat') {
            // WeChat Register
            wx.showLoading({ title: '注册中...' })
            wx.login({
                success: (res) => {
                    if (res.code) {
                        wx.request({
                            url: `${API_BASE_URL}/wechat-register`,
                            method: 'POST',
                            data: {
                                code: res.code,
                                nickname: nickName,
                                avatar: avatarUrl
                            },
                            success: (apiRes: any) => {
                                wx.hideLoading()
                                if (apiRes.statusCode === 200 && apiRes.data.code === 200) {
                                    this.loginSuccess(apiRes.data.data)
                                } else {
                                    wx.showToast({ title: apiRes.data.message || '注册失败', icon: 'none' })
                                }
                            },
                            fail: () => {
                                wx.hideLoading()
                                wx.showToast({ title: '请求失败', icon: 'none' })
                            }
                        })
                    }
                }
            })
            return
        }

        // SMS Register
        wx.showLoading({ title: '注册中...' })
        wx.request({
            url: `${API_BASE_URL}/sms-register`,
            method: 'POST',
            data: {
                phone,
                code,
                nickname: nickName,
                avatar: avatarUrl
            },
            success: (res: any) => {
                wx.hideLoading()
                if (res.statusCode === 200 && res.data.code === 200) {
                    this.loginSuccess(res.data.data)
                } else {
                    wx.showToast({ title: res.data.message || '注册失败', icon: 'none' })
                }
            },
            fail: (err) => {
                wx.hideLoading()
                wx.showToast({ title: '注册请求失败', icon: 'none' })
            }
        })
    },

    loginSuccess(user: any) {
        console.log('Login Success:', user)
        wx.setStorageSync('token', user.token)
        wx.setStorageSync('userInfo', user)

        wx.showToast({ title: '登录成功', icon: 'success' })

        setTimeout(() => {
            wx.reLaunch({ url: '/pages/index/index' })
        }, 1500)
    }
})
