// pages/coupon/market/market.ts
import { API_BASE_URL } from '../../../config/api'

Page({
    data: {
        coupons: [] as any[],
        loading: false,
        error: '',
        receivingCouponId: 0 // 正在领取的优惠券ID
    },

    onLoad() {
        this.loadPublicCoupons()
    },

    onShow() {
        // 每次显示页面时刷新数据
        this.loadPublicCoupons()
    },

    // 从后端获取公开优惠券列表
    loadPublicCoupons() {
        this.setData({ loading: true, error: '' })
        
        wx.request({
            url: `${API_BASE_URL}/merchant/coupons/public/`,
            method: 'GET',
            success: (res: any) => {
                console.log('公开优惠券响应:', res.data)
                
                if (res.statusCode === 200 && res.data.success) {
                    const coupons = res.data.data.map((coupon: any) => ({
                        id: coupon.id,
                        merchantId: coupon.merchant,
                        merchantName: coupon.merchant_name,
                        name: coupon.name,
                        description: coupon.description,
                        type: coupon.coupon_type,
                        typeDisplay: coupon.type_display,
                        amount: coupon.amount,
                        minAmount: coupon.min_amount,
                        totalCount: coupon.total_count,
                        usedCount: coupon.used_count,
                        remainingCount: coupon.remaining_count,
                        perUserLimit: coupon.per_user_limit,
                        startDate: coupon.start_date,
                        endDate: coupon.end_date,
                        status: coupon.status,
                        statusDisplay: coupon.status_display,
                        isValid: coupon.is_valid,
                        createdAt: coupon.created_at
                    })).filter((coupon: any) => coupon.isValid) // 只显示有效的优惠券
                    
                    this.setData({
                        coupons,
                        loading: false
                    })
                } else {
                    console.error('获取优惠券列表失败:', res.data)
                    this.setData({
                        error: res.data.message || '获取优惠券列表失败',
                        loading: false
                    })
                }
            },
            fail: (err) => {
                console.error('获取优惠券列表网络请求失败:', err)
                this.setData({
                    error: '网络请求失败，请检查网络连接',
                    loading: false
                })
            }
        })
    },

    // 重新加载
    onRefresh() {
        this.loadPublicCoupons()
    },

    // 领取优惠券
    onReceiveCoupon(event: any) {
        const couponId = event.currentTarget.dataset.id
        
        const userInfo = wx.getStorageSync('userInfo')
        if (!userInfo || !userInfo.user_id) {
            wx.showModal({
                title: '提示',
                content: '请先登录后再领取优惠券',
                showCancel: false,
                success: () => {
                    wx.reLaunch({
                        url: '/pages/login/login'
                    })
                }
            })
            return
        }

        // 防止重复点击
        if (this.data.receivingCouponId === couponId) {
            return
        }

        this.setData({ receivingCouponId: couponId })

        wx.request({
            url: `${API_BASE_URL}/merchant/coupons/receive/`,
            method: 'POST',
            data: {
                coupon_id: couponId
            },
            header: {
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`,
                'content-type': 'application/json'
            },
            success: (res: any) => {
                console.log('领取优惠券响应:', res.data)
                
                if (res.statusCode === 200 && res.data.success) {
                    wx.showToast({
                        title: '领取成功',
                        icon: 'success',
                        duration: 2000
                    })
                    
                    // 更新优惠券状态
                    const coupons = this.data.coupons.map((coupon: any) => {
                        if (coupon.id === couponId) {
                            return {
                                ...coupon,
                                usedCount: coupon.usedCount + 1,
                                remainingCount: coupon.remainingCount - 1
                            }
                        }
                        return coupon
                    })
                    
                    this.setData({ coupons })
                } else {
                    wx.showToast({
                        title: res.data.message || '领取失败',
                        icon: 'none',
                        duration: 3000
                    })
                }
            },
            fail: (err) => {
                console.error('领取优惠券网络请求失败:', err)
                wx.showToast({
                    title: '网络请求失败，请重试',
                    icon: 'none'
                })
            },
            complete: () => {
                this.setData({ receivingCouponId: 0 })
            }
        })
    },

    // 查看商户详情
    onMerchantClick(event: any) {
        const merchantId = event.currentTarget.dataset.merchantId
        wx.navigateTo({
            url: `/pages/shop/detail/detail?id=${merchantId}`
        })
    },

    // 查看我的优惠券
    onViewMyCoupons() {
        wx.navigateTo({
            url: '/pages/coupon/list/list'
        })
    }
})
