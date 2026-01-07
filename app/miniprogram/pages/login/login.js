const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
const { API_BASE_URL: API_AUTH_URL } = require('../../config/api')
const API_UPLOAD_URL = API_AUTH_URL + '/upload'

Page({
    data: {
        phone: '',
        code: '',

        showProfileInput: false,
        userInfo: {
            avatarUrl: defaultAvatarUrl,
            nickName: '',
        },

        isUserExists: true,
        loginType: 'phone',
        uploadedAvatarUrl: ''
    },

    onPhoneInput(e) {
        this.setData({ phone: e.detail.value })
    },

    goToRegister() {
        wx.navigateTo({
            url: '/pages/register/register'
        })
    },

    onCodeInput(e) {
        this.setData({ code: e.detail.value })
    },

    getVerificationCode() {
        if (!this.data.phone || this.data.phone.length !== 11) {
            wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
            return
        }

        wx.showLoading({ title: '发送中...' })

        wx.request({
            url: API_AUTH_URL + '/auth/send-sms-code',
            method: 'POST',
            data: { phone: this.data.phone },
            success: (res) => {
                wx.hideLoading()
                if (res.statusCode === 200 && res.data.code === 200) {
                    wx.showToast({ title: '验证码已发送', icon: 'success' })
                    const userExists = res.data.data.user_exists
                    this.setData({ isUserExists: userExists })
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

        if (!phone || !code) {
            wx.showToast({ title: '请填写手机号和验证码', icon: 'none' })
            return
        }

        if (!isUserExists) {
            wx.showToast({ title: '请先注册账号', icon: 'none' })
            return
        }

        wx.showLoading({ title: '登录中...' })

        this.performPhoneLogin()
    },

    performPhoneLogin() {
        const { phone, code } = this.data
        wx.request({
            url: API_AUTH_URL + '/auth/sms-login',
            method: 'POST',
            data: { phone, code },
            success: (res) => {
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

    handleWechatLogin() {
        wx.showLoading({ title: '微信授权中...' })

        wx.login({
            success: (res) => {
                if (res.code) {
                    wx.request({
                        url: API_AUTH_URL + '/auth/wechat-login',
                        method: 'POST',
                        data: { code: res.code },
                        success: (apiRes) => {
                            wx.hideLoading()
                            if (apiRes.statusCode === 200 && apiRes.data.code === 200) {
                                const data = apiRes.data.data
                                if (data.need_profile) {
                                    this.setData({
                                        showProfileInput: true,
                                        loginType: 'wechat'
                                    })
                                    wx.showToast({ title: '请完善信息', icon: 'none' })
                                } else {
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

    onChooseAvatar(e) {
        const { avatarUrl } = e.detail
        
        this.setData({
            "userInfo.avatarUrl": avatarUrl
        })
        
        this.uploadAvatar(avatarUrl)
    },

    uploadAvatar(tempFilePath) {
        wx.showLoading({ title: '上传头像中...' })
        
        wx.uploadFile({
            url: API_UPLOAD_URL + '/avatar',
            filePath: tempFilePath,
            name: 'avatar',
            header: {
                'Content-Type': 'multipart/form-data'
            },
            success: (res) => {
                wx.hideLoading()
                try {
                    const result = JSON.parse(res.data)
                    if (result.code === 200) {
                        this.setData({
                            uploadedAvatarUrl: result.data.avatar_url
                        })
                        wx.showToast({ title: '头像上传成功', icon: 'success' })
                        console.log('头像上传成功:', result.data.avatar_url)
                    } else {
                        wx.showToast({ title: result.message || '上传失败', icon: 'error' })
                        this.setData({
                            "userInfo.avatarUrl": defaultAvatarUrl,
                            uploadedAvatarUrl: ''
                        })
                    }
                } catch (error) {
                    console.error('解析上传结果失败:', error)
                    wx.showToast({ title: '上传失败', icon: 'error' })
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
                this.setData({
                    "userInfo.avatarUrl": defaultAvatarUrl,
                    uploadedAvatarUrl: ''
                })
            }
        })
    },

    onNicknameChange(e) {
        const nickName = e.detail.value
        this.setData({
            "userInfo.nickName": nickName
        })
    },

    cancelProfileUpdate() {
        this.setData({ 
            showProfileInput: false,
            uploadedAvatarUrl: '',
            "userInfo.avatarUrl": defaultAvatarUrl,
            "userInfo.nickName": ''
        })
    },

    handleSubmitProfile() {
        const { phone, code, loginType, uploadedAvatarUrl } = this.data
        const { avatarUrl, nickName } = this.data.userInfo

        if (!nickName || nickName.trim() === '') {
            wx.showToast({ title: '请输入昵称', icon: 'none' })
            return
        }
        
        if (avatarUrl !== defaultAvatarUrl && !uploadedAvatarUrl) {
            wx.showToast({ title: '头像还在上传中，请稍后', icon: 'none' })
            return
        }

        console.log('提交注册数据:', {
            phone: phone,
            code: code,
            nickname: nickName,
            avatar_url: uploadedAvatarUrl || ''
        })

        if (loginType === 'wechat') {
            wx.showLoading({ title: '注册中...' })
            wx.login({
                success: (res) => {
                    if (res.code) {
                        wx.request({
                            url: API_AUTH_URL + '/auth/wechat-register',
                            method: 'POST',
                            data: {
                                code: res.code,
                                nickname: nickName,
                                avatar_url: this.data.uploadedAvatarUrl || ''
                            },
                            success: (apiRes) => {
                                wx.hideLoading()
                                console.log('微信注册响应:', apiRes)
                                if (apiRes.statusCode === 200 && apiRes.data.code === 200) {
                                    this.loginSuccess(apiRes.data.data)
                                } else {
                                    wx.showToast({ title: apiRes.data.message || '注册失败', icon: 'none' })
                                }
                            },
                            fail: (err) => {
                                wx.hideLoading()
                                console.error('微信注册失败:', err)
                                wx.showToast({ title: '请求失败', icon: 'none' })
                            }
                        })
                    }
                }
            })
            return
        }

        wx.showLoading({ title: '注册中...' })
        wx.request({
            url: API_AUTH_URL + '/auth/sms-register',
            method: 'POST',
            data: {
                phone,
                code,
                nickname: nickName,
                avatar_url: this.data.uploadedAvatarUrl || ''
            },
            success: (res) => {
                wx.hideLoading()
                console.log('短信注册响应:', res)
                if (res.statusCode === 200 && res.data.code === 200) {
                    this.loginSuccess(res.data.data)
                } else {
                    console.error('注册失败:', res.data)
                    wx.showToast({ title: res.data.message || '注册失败', icon: 'none' })
                }
            },
            fail: (err) => {
                wx.hideLoading()
                console.error('注册请求失败:', err)
                wx.showToast({ title: '注册请求失败', icon: 'none' })
            }
        })
    },

    loginSuccess(user) {
        console.log('Login Success:', user)
        wx.setStorageSync('token', user.token)
        wx.setStorageSync('userInfo', user)

        wx.showToast({ title: '登录成功', icon: 'success' })

        setTimeout(() => {
            wx.reLaunch({ url: '/pages/index/index' })
        }, 1500)
    }
})
