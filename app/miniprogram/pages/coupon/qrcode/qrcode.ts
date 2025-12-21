// pages/coupon/qrcode/qrcode.ts
// @ts-ignore
const drawQrcode = require('../../../miniprogram_npm/weapp-qrcode-canvas-2d/index.js')

const API_BASE_URL = 'http://127.0.0.1:8000/api'

Page({
    data: {
        couponId: 0,
        coupon: {} as any,
        loading: false,
        error: '',
        canvasId: 'coupon-qrcode-canvas'
    },

    onLoad(options: any) {
        const couponId = parseInt(options.id || '0')
        if (couponId > 0) {
            this.setData({ couponId })
            this.loadCouponDetail()
        } else {
            this.setData({ error: '优惠券ID无效' })
        }
    },

    // 获取优惠券详情
    loadCouponDetail() {
        this.setData({ loading: true, error: '' })
        
        const userInfo = wx.getStorageSync('userInfo')
        if (!userInfo || !userInfo.user_id) {
            wx.showModal({
                title: '提示',
                content: '请先登录',
                showCancel: false,
                success: () => {
                    wx.reLaunch({
                        url: '/pages/login/login'
                    })
                }
            })
            return
        }

        wx.request({
            url: `${API_BASE_URL}/merchant/user/coupons/`,
            method: 'GET',
            header: {
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`,
                'content-type': 'application/json'
            },
            success: (res: any) => {
                console.log('用户优惠券响应:', res.data)
                
                if (res.statusCode === 200 && res.data.success) {
                    const targetCoupon = res.data.data.find((coupon: any) => coupon.id === this.data.couponId)
                    
                    if (targetCoupon) {
                        const couponData = {
                            id: targetCoupon.id,
                            couponId: targetCoupon.coupon,
                            name: targetCoupon.coupon_info.name,
                            description: targetCoupon.coupon_info.description,
                            type: targetCoupon.coupon_info.type,
                            typeDisplay: targetCoupon.coupon_info.type_display,
                            amount: targetCoupon.coupon_info.amount,
                            minAmount: targetCoupon.coupon_info.min_amount,
                            startDate: targetCoupon.coupon_info.start_date,
                            endDate: targetCoupon.coupon_info.end_date,
                            merchantId: targetCoupon.merchant_info.id,
                            merchantName: targetCoupon.merchant_info.name,
                            merchantLogo: targetCoupon.merchant_info.logo,
                            status: targetCoupon.status,
                            statusDisplay: targetCoupon.status_display,
                            verificationCode: targetCoupon.verification_code,
                            isExpired: targetCoupon.is_expired,
                            usedAt: targetCoupon.used_at,
                            receivedAt: targetCoupon.received_at
                        }
                        
                        this.setData({
                            coupon: couponData,
                            loading: false
                        })
                        
                        // 生成二维码
                        this.generateQRCode(couponData.verificationCode)
                    } else {
                        this.setData({
                            error: '优惠券不存在或已失效',
                            loading: false
                        })
                    }
                } else {
                    console.error('获取优惠券详情失败:', res.data)
                    this.setData({
                        error: res.data.message || '获取优惠券详情失败',
                        loading: false
                    })
                }
            },
            fail: (err) => {
                console.error('获取优惠券详情网络请求失败:', err)
                this.setData({
                    error: '网络请求失败，请检查网络连接',
                    loading: false
                })
            }
        })
    },

    // 生成二维码
    generateQRCode(verificationCode: string) {
        const query = wx.createSelectorQuery()
        query.select(`#${this.data.canvasId}`)
            .fields({ node: true, size: true })
            .exec((res) => {
                if (res[0]) {
                    const canvas = res[0].node
                    const ctx = canvas.getContext('2d')
                    
                    const dpr = wx.getSystemInfoSync().pixelRatio
                    canvas.width = res[0].width * dpr
                    canvas.height = res[0].height * dpr
                    ctx.scale(dpr, dpr)
                    
                    // 生成二维码内容（核销码）
                    const qrData = verificationCode
                    
                    drawQrcode({
                        canvas: canvas,
                        canvasId: this.data.canvasId,
                        width: res[0].width,
                        height: res[0].height,
                        text: qrData,
                        correctLevel: drawQrcode.CorrectLevel.H,
                        callback: (e: any) => {
                            console.log('二维码生成完成:', e)
                        }
                    })
                }
            })
    },

    // 重新加载
    onRefresh() {
        this.loadCouponDetail()
    },

    // 去商户使用
    onGoToMerchant() {
        wx.navigateTo({
            url: `/pages/shop/detail/detail?id=${this.data.coupon.merchantId}`
        })
    },

    // 保存二维码到相册
    onSaveQRCode() {
        wx.canvasToTempFilePath({
            canvasId: this.data.canvasId,
            success: (res) => {
                wx.saveImageToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success: () => {
                        wx.showToast({
                            title: '保存成功',
                            icon: 'success'
                        })
                    },
                    fail: (err) => {
                        if (err.errMsg.includes('auth')) {
                            wx.showModal({
                                title: '提示',
                                content: '需要授权访问相册才能保存图片',
                                success: (modalRes) => {
                                    if (modalRes.confirm) {
                                        wx.openSetting()
                                    }
                                }
                            })
                        } else {
                            wx.showToast({
                                title: '保存失败',
                                icon: 'none'
                            })
                        }
                    }
                })
            },
            fail: () => {
                wx.showToast({
                    title: '生成图片失败',
                    icon: 'none'
                })
            }
        })
    },

    // 分享优惠券
    onShareAppMessage() {
        return {
            title: `${this.data.coupon.merchantName} - ${this.data.coupon.name}`,
            path: `/pages/coupon/market/market`,
            imageUrl: this.data.coupon.merchantLogo
        }
    }
})
