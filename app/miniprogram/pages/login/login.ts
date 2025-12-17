const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

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
        wx.showToast({ title: '验证码已发送(模拟)', icon: 'none' })
    },

    handlePhoneLogin() {
        const { phone, code } = this.data
        if (!phone || !code) {
            wx.showToast({ title: '请填写手机号和验证码', icon: 'none' })
            return
        }

        wx.showLoading({ title: '登录中...' })

        // Mock API
        setTimeout(() => {
            wx.hideLoading()
            this.loginSuccess({
                id: 123,
                role: 1,
                token: 'mock_token_phone'
            })
        }, 1000)
    },

    handleWechatLogin() {
        wx.showLoading({ title: '授权中...' })

        wx.login({
            success: (res) => {
                if (res.code) {
                    // Mock Backend Check
                    // Randomly simulate new user vs old user for demonstration
                    // For stable testing, let's assume 'new_user_code' triggers new user flow
                    // OR just always show profile for now since the user requested testing functionality?
                    // Let's implement a random or fixed logic.

                    this.mockBackendWechatLogin(res.code).then((result: any) => {
                        wx.hideLoading()

                        if (result.needProfile) {
                            this.setData({
                                showProfileInput: true,
                                tempOpenId: result.openid
                            })
                        } else {
                            this.loginSuccess(result.user)
                        }
                    })
                }
            }
        })
    },

    mockBackendWechatLogin(code: string): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate a new user scenario to show layout
                resolve({
                    needProfile: true, // Force true to satisfy user requirement of showing the feature
                    openid: 'mock_openid_' + code
                })

                // Use this for old user simulation:
                // resolve({ needProfile: false, user: { ... } })
            }, 800)
        })
    },

    // Profile handling (from index page)
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
        const { avatarUrl, nickName } = this.data.userInfo
        if (!nickName || avatarUrl === defaultAvatarUrl) {
            wx.showToast({ title: '请完善头像和昵称', icon: 'none' })
            return
        }

        wx.showLoading({ title: '注册中...' })

        setTimeout(() => {
            wx.hideLoading()
            this.loginSuccess({
                id: 456,
                role: 0,
                token: 'mock_token_wechat_new',
                avatar: avatarUrl,
                nickname: nickName
            })
        }, 1000)
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
