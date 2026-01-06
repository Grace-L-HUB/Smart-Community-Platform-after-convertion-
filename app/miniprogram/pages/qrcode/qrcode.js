// pages/qrcode/qrcode.js
const { API_BASE_URL } = require('../../config/api')

Page({
    data: {
        type: '',
        token: '',
        loading: true,
        countdown: 60,
        timer: null,
        canvasId: 'qrcode-canvas',
        title: '身份码',
        description: '请向物业出示此码',
        validTime: '',
        userInfo: {
            name: '',
            room: '',
            phone: ''
        },
        communityInfo: {
            name: ''
        }
    },

    onLoad(options) {
        const type = options.type || 'identity'
        this.setData({
            type: type,
            title: type === 'identity' ? '身份码' : '房屋码'
        })

        if (type === 'identity') {
            this.loadIdentityQRCode()
        } else if (type === 'house') {
            this.loadHouseQRCode()
        }
    },

    onUnload() {
        if (this.data.timer) {
            clearInterval(this.data.timer)
        }
    },

    loadIdentityQRCode() {
        const userInfo = wx.getStorageSync('userInfo')
        if (!userInfo || !userInfo.user_id) {
            wx.showModal({
                title: '提示',
                content: '请先登录',
                showCancel: false,
                success: () => {
                    wx.reLaunch({ url: '/pages/login/login' })
                }
            })
            return
        }

        wx.request({
            url: API_BASE_URL + '/user/identity-code',
            method: 'GET',
            data: {
                user_id: userInfo.user_id
            },
            header: {
                'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const token = res.data.data.token
                    const validSeconds = res.data.data.valid_seconds || 60

                    this.setData({
                        token: token,
                        loading: false,
                        countdown: validSeconds
                    })

                    // 设置用户信息
                    this.setData({
                        userInfo: {
                            name: userInfo.nickname || '业主',
                            room: userInfo.room || '暂未绑定',
                            phone: userInfo.phone || ''
                        }
                    })

                    // 格式化有效期时间
                    this.formatValidTime()

                    // 延迟绘制二维码，确保界面完全加载
                    setTimeout(() => {
                        this.drawQRCode(token)
                    }, 700)

                    // 开始倒计时
                    this.startCountdown()
                } else {
                    wx.showToast({ title: res.data.message || '获取身份码失败', icon: 'none' })
                    this.setData({ loading: false })
                }
            },
            fail: () => {
                wx.showToast({ title: '网络请求失败', icon: 'none' })
                this.setData({ loading: false })
            }
        })
    },

    loadHouseQRCode() {
        wx.showToast({ title: '功能开发中', icon: 'none' })
        this.setData({ loading: false })
    },

    formatValidTime() {
        const now = new Date()
        const validTime = `${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        this.setData({ validTime: validTime })
    },

    drawQRCode(token) {
        const query = wx.createSelectorQuery()
        query.select('#qrcode-canvas')
            .fields({ node: true, size: true })
            .exec((res) => {
                if (res[0]) {
                    const canvas = res[0].node

                    // 使用 weapp-qrcode-canvas-2d 绘制二维码
                    const drawQrcode = require('../../miniprogram_npm/weapp-qrcode-canvas-2d/index')
                    drawQrcode({
                        canvas: canvas,
                        canvasId: this.data.canvasId,
                        text: token,
                        width: 200,
                        height: 200,
                        padding: 10,
                        background: '#ffffff',
                        foreground: '#000000'
                    })
                }
            })
    },

    startCountdown() {
        if (this.data.timer) {
            clearInterval(this.data.timer)
        }

        const timer = setInterval(() => {
            let countdown = this.data.countdown - 1
            if (countdown <= 0) {
                clearInterval(timer)
                // 重新获取身份码
                this.loadIdentityQRCode()
            } else {
                this.setData({ countdown })
            }
        }, 1000)

        this.setData({ timer })
    },

    onRefresh() {
        if (this.data.type === 'identity') {
            this.loadIdentityQRCode()
        } else if (this.data.type === 'house') {
            this.loadHouseQRCode()
        }
    },

    onShareAppMessage() {
        return {
            title: '智慧社区',
            path: '/pages/index/index'
        }
    }
})
