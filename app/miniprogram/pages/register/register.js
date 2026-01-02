const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
const { API_BASE_URL: API_AUTH_URL } = require('../../config/api')
const API_UPLOAD_URL = API_AUTH_URL + '/upload'

Page({
    data: {
        phone: '',
        code: '',
        userInfo: {
            avatarUrl: defaultAvatarUrl,
            nickName: '',
        },
        uploadedAvatarUrl: '',
        codeVerified: false,
        countdown: 0
    },

    onPhoneInput(e) {
        this.setData({ phone: e.detail.value })
    },

    onCodeInput(e) {
        this.setData({ code: e.detail.value })
    },

    getVerificationCode() {
        console.log('getVerificationCode called')
        console.log('Phone:', this.data.phone)
        console.log('API_AUTH_URL:', API_AUTH_URL)
        
        if (!this.data.phone || this.data.phone.length !== 11) {
            wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
            return
        }

        if (this.data.countdown > 0) {
            return
        }

        wx.showLoading({ title: '发送中...' })

        const requestUrl = API_AUTH_URL + '/auth/send-sms-code'
        console.log('Request URL:', requestUrl)
        console.log('Request data:', { phone: this.data.phone })

        wx.request({
            url: requestUrl,
            method: 'POST',
            data: { phone: this.data.phone },
            success: (res) => {
                wx.hideLoading()
                console.log('Response:', res)
                console.log('Response data:', res.data)
                
                if (res.statusCode === 200 && res.data.code === 200) {
                    wx.showToast({ title: '验证码已发送', icon: 'success' })
                    
                    if (res.data.data && res.data.data.code) {
                        console.log('DEV ONLY: SMS Code is', res.data.data.code)
                        wx.showModal({ title: '测试验证码', content: res.data.data.code, showCancel: false })
                    }

                    this.startCountdown()
                } else {
                    console.error('Send code failed:', res.data)
                    wx.showToast({ title: res.data?.message || '发送失败', icon: 'none' })
                }
            },
            fail: (err) => {
                wx.hideLoading()
                console.error('Request failed:', err)
                wx.showToast({ title: '网络请求失败', icon: 'none' })
            }
        })
    },

    startCountdown() {
        let countdown = 60
        this.setData({ countdown })

        const timer = setInterval(() => {
            countdown--
            this.setData({ countdown })

            if (countdown <= 0) {
                clearInterval(timer)
            }
        }, 1000)
    },

    verifyCode() {
        const { phone, code } = this.data

        if (!phone || !code) {
            wx.showToast({ title: '请填写手机号和验证码', icon: 'none' })
            return
        }

        wx.showLoading({ title: '验证中...' })

        wx.request({
            url: API_AUTH_URL + '/auth/verify-code',
            method: 'POST',
            data: { phone, code },
            success: (res) => {
                wx.hideLoading()
                if (res.statusCode === 200 && res.data.code === 200) {
                    this.setData({ codeVerified: true })
                    wx.showToast({ title: '验证成功', icon: 'success' })
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

    handleRegister() {
        const { phone, code, uploadedAvatarUrl } = this.data
        const { avatarUrl, nickName } = this.data.userInfo

        if (!phone || phone.length !== 11) {
            wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
            return
        }

        if (!code || code.length !== 6) {
            wx.showToast({ title: '请输入验证码', icon: 'none' })
            return
        }

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

        wx.showLoading({ title: '注册中...' })
        wx.request({
            url: API_AUTH_URL + '/auth/sms-register',
            method: 'POST',
            data: {
                phone,
                code,
                nickname: nickName,
                avatar_url: uploadedAvatarUrl || ''
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

        wx.showToast({ title: '注册成功', icon: 'success' })

        setTimeout(() => {
            wx.reLaunch({ url: '/pages/index/index' })
        }, 1500)
    },

    goToLogin() {
        wx.navigateBack()
    }
})
