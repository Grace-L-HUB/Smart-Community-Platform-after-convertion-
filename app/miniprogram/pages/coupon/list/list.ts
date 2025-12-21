// pages/coupon/list/list.ts
const API_BASE_URL = 'http://127.0.0.1:8000/api'

Page({
    data: {
        activeTab: 0,
        coupons: [] as any[],
        loading: false,
        error: '',
        
        // Tab配置
        tabs: [
            { title: '未使用', status: 'unused' },
            { title: '已使用', status: 'used' },
            { title: '已过期', status: 'expired' }
        ]
    },

    onLoad() {
        this.loadUserCoupons()
    },

    onShow() {
        // 每次显示页面时刷新数据
        this.loadUserCoupons()
    },

    // 从后端获取用户优惠券列表
    loadUserCoupons() {
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

        const currentTab = this.data.tabs[this.data.activeTab]
        
        wx.request({
            url: `${API_BASE_URL}/merchant/user/coupons/`,
            method: 'GET',
            data: {
                status: currentTab.status
            },
            header: {
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`,
                'content-type': 'application/json'
            },
            success: (res: any) => {
                console.log('用户优惠券响应:', res.data)
                
                if (res.statusCode === 200 && res.data.success) {
                    const coupons = res.data.data.map((coupon: any) => ({
                        id: coupon.id,
                        couponId: coupon.coupon,
                        name: coupon.coupon_info.name,
                        description: coupon.coupon_info.description,
                        type: coupon.coupon_info.type,
                        typeDisplay: coupon.coupon_info.type_display,
                        amount: coupon.coupon_info.amount,
                        minAmount: coupon.coupon_info.min_amount,
                        startDate: coupon.coupon_info.start_date,
                        endDate: coupon.coupon_info.end_date,
                        merchantId: coupon.merchant_info.id,
                        merchantName: coupon.merchant_info.name,
                        merchantLogo: coupon.merchant_info.logo,
                        status: coupon.status,
                        statusDisplay: coupon.status_display,
                        verificationCode: coupon.verification_code,
                        isExpired: coupon.is_expired,
                        usedAt: coupon.used_at,
                        receivedAt: coupon.received_at
                    }))
                    
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

    // 切换Tab
    onTabChange(event: any) {
        const index = event.detail.index
        this.setData({ activeTab: index })
        this.loadUserCoupons()
    },

    // 重新加载
    onRefresh() {
        this.loadUserCoupons()
    },

    // 查看优惠券详情/二维码
    onCouponClick(event: any) {
        const couponId = event.currentTarget.dataset.id
        const coupon = this.data.coupons.find((c: any) => c.id === couponId)
        
        if (coupon && coupon.status === 'unused') {
            // 跳转到二维码页面
            wx.navigateTo({
                url: `/pages/coupon/qrcode/qrcode?id=${couponId}`
            })
        } else {
            // 显示优惠券详情
            wx.navigateTo({
                url: `/pages/coupon/detail/detail?id=${couponId}`
            })
        }
    },

    // 去使用优惠券（跳转到商户页面）
    onUseCoupon(event: any) {
        const merchantId = event.currentTarget.dataset.merchantId
        wx.navigateTo({
            url: `/pages/shop/detail/detail?id=${merchantId}`
        })
    },

    // 领取更多优惠券
    onGetMoreCoupons() {
        wx.navigateTo({
            url: '/pages/coupon/market/market'
        })
    }
})
