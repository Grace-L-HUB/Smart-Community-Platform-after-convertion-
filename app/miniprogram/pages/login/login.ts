const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
const API_BASE_URL = 'http://127.0.0.1:8000/api/auth'
const API_UPLOAD_URL = 'http://127.0.0.1:8000/api/upload'

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
        uploadedAvatarUrl: '', // 上传后的头像URL
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
        
        // 先更新本地显示
        this.setData({
            "userInfo.avatarUrl": avatarUrl
        })
        
        // 立即上传头像到服务器
        this.uploadAvatar(avatarUrl)
    },

    uploadAvatar(tempFilePath: string) {
        wx.showLoading({ title: '上传头像中...' })
        
        wx.uploadFile({
            url: `${API_UPLOAD_URL}/avatar`,
            filePath: tempFilePath,
            name: 'avatar', // 必须是 'avatar'，对应后端字段名
            header: {
                'Content-Type': 'multipart/form-data'
            },
            success: (res) => {
                wx.hideLoading()
                try {
                    const result = JSON.parse(res.data)
                    if (result.code === 200) {
                        // 保存上传后的头像URL
                        this.setData({
                            uploadedAvatarUrl: result.data.avatar_url
                        })
                        wx.showToast({ title: '头像上传成功', icon: 'success' })
                        console.log('头像上传成功:', result.data.avatar_url)
                    } else {
                        wx.showToast({ title: result.message || '上传失败', icon: 'error' })
                        // 恢复默认头像
                        this.setData({
                            "userInfo.avatarUrl": defaultAvatarUrl,
                            uploadedAvatarUrl: ''
                        })
                    }
                } catch (error) {
                    console.error('解析上传结果失败:', error)
                    wx.showToast({ title: '上传失败', icon: 'error' })
                    // 恢复默认头像
                    this.setData({
                        "userInfo.avatarUrl": defaultAvatarUrl,
                        uploadedAvatarUrl: ''
                    })
                }
            },
            fail: (error) => {
                wx.hideLoading()
                console.error('头像上传失败:', error)
                wx.showToast({ title: '上传失败，请重试', icon: 'error' })
                // 恢复默认头像
                this.setData({
                    "userInfo.avatarUrl": defaultAvatarUrl,
                    uploadedAvatarUrl: ''
                })
            }
        })
    },

    onNicknameChange(e: any) {
        const nickName = e.detail.value
        this.setData({
            "userInfo.nickName": nickName
        })
    },

    cancelProfileUpdate() {
        this.setData({ 
            showProfileInput: false,
            uploadedAvatarUrl: '', // 重置上传的头像URL
            "userInfo.avatarUrl": defaultAvatarUrl, // 重置头像显示
            "userInfo.nickName": '' // 重置昵称
        })
    },

    handleSubmitProfile() {
        const { phone, code, loginType, uploadedAvatarUrl } = this.data
        const { avatarUrl, nickName } = this.data.userInfo

        // 检查昵称
        if (!nickName || nickName.trim() === '') {
            wx.showToast({ title: '请输入昵称', icon: 'none' })
            return
        }
        
        // 检查头像（如果选择了头像但没有上传成功）
        if (avatarUrl !== defaultAvatarUrl && !uploadedAvatarUrl) {
            wx.showToast({ title: '头像还在上传中，请稍后', icon: 'none' })
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
                                avatar_url: this.data.uploadedAvatarUrl || ''
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
                avatar_url: this.data.uploadedAvatarUrl || ''
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
            // console.log('登录成功，需要配置跳转页面')
        }, 1500)
    }
})
