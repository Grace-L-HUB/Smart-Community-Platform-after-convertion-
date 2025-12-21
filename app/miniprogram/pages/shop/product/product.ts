// pages/shop/product/product.ts
Page({
    data: {
        productId: 0,
        shopId: 0,
        product: {} as any,
        loading: false,
        error: '',
        showSku: false,
        skuMode: 'cart', // cart or buy
        buyCount: 1,

        // 优惠券
        coupons: [] as any[],
        showCoupon: false
    },

    onLoad(options: any) {
        const productId = parseInt(options.id || '0');
        const shopId = parseInt(options.shopId || '0');

        if (productId > 0) {
            this.setData({ productId, shopId });
            this.loadProductDetail();
            this.loadMerchantCoupons();
        } else {
            this.setData({ error: '商品ID无效' });
        }
    },

    // 从后端获取商品详情
    loadProductDetail() {
        this.setData({ loading: true, error: '' });

        wx.request({
            url: `http://127.0.0.1:8000/api/merchant/product/public/${this.data.productId}/`,
            method: 'GET',
            success: (res: any) => {
                console.log('商品详情响应:', res.data);
                
                if (res.statusCode === 200 && res.data.success) {
                    this.setData({
                        product: this.formatProduct(res.data.data),
                        loading: false
                    });
                } else {
                    console.error('获取商品详情失败:', res.data);
                    this.setData({
                        error: res.data.message || '获取商品详情失败',
                        loading: false
                    });
                    // 使用备用数据
                    this.loadFallbackData();
                }
            },
            fail: (err) => {
                console.error('获取商品详情网络请求失败:', err);
                this.setData({
                    error: '网络请求失败，请检查网络连接',
                    loading: false
                });
                // 使用备用数据
                this.loadFallbackData();
            }
        });
    },

    formatProduct(data: any) {
        const imageUrl = data.image_url || 'https://img.yzcdn.cn/vant/apple-1.jpg';
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            price: data.price,
            originalPrice: data.original_price,
            image: imageUrl,
            images: [imageUrl], // 详情页通常多张图，这里暂时只有一张
            stock: data.stock,
            salesCount: data.sales_count || 0,
            category: data.category_display,
            status: data.status_display,
            serviceTimeSlots: data.service_time_slots || [],
            merchantName: data.merchant_name,
            detail: data.description || '暂无详情描述' // 使用描述作为详情
        };
    },

    // 备用商品数据（API失败时使用）
    loadFallbackData() {
        this.setData({
            product: {
                id: this.data.productId,
                name: '智利车厘子 J级 250g',
                description: '新鲜直达，脆甜多汁，坏果包赔',
                price: '29.90',
                originalPrice: '39.90',
                image: 'https://img.yzcdn.cn/vant/apple-1.jpg',
                images: [
                    'https://img.yzcdn.cn/vant/apple-1.jpg',
                    'https://img.yzcdn.cn/vant/apple-2.jpg'
                ],
                stock: 120,
                salesCount: 500,
                category: '水果',
                status: '上架中',
                serviceTimeSlots: [],
                merchantName: '鲜丰水果',
                detail: '产地直采，全程冷链，保证新鲜。J级果径26-28mm，口感脆甜。'
            },
            loading: false
        });
    },

    // 重新加载数据
    onRefresh() {
        this.loadProductDetail();
    },

    // 优惠券相关
    showCouponPopup() {
        this.setData({ showCoupon: true });
    },

    onCloseCoupon() {
        this.setData({ showCoupon: false });
    },

    // 从后端获取商户优惠券
    loadMerchantCoupons() {
        if (!this.data.shopId) return;
        
        wx.request({
            url: `http://127.0.0.1:8000/api/merchant/coupons/public/${this.data.shopId}/`,
            method: 'GET',
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.success) {
                    const coupons = res.data.data.map((coupon: any) => ({
                        id: coupon.id,
                        amount: coupon.amount,
                        condition: `满${coupon.min_amount}可用`,
                        name: coupon.name,
                        description: coupon.description,
                        minAmount: coupon.min_amount,
                        remainingCount: coupon.remaining_count,
                        isValid: coupon.is_valid
                    })).filter((c: any) => c.isValid && c.remainingCount > 0);
                    
                    this.setData({ coupons });
                }
            },
            fail: (err) => {
                console.error('获取商户优惠券失败:', err);
            }
        });
    },

    onGetCoupon(event: any) {
        const couponId = event.currentTarget.dataset.id;
        
        const userInfo = wx.getStorageSync('userInfo');
        if (!userInfo || !userInfo.user_id) {
            wx.showModal({
                title: '提示',
                content: '请先登录后再领取优惠券',
                showCancel: false,
                success: () => {
                    wx.reLaunch({
                        url: '/pages/login/login'
                    });
                }
            });
            return;
        }

        wx.request({
            url: 'http://127.0.0.1:8000/api/merchant/coupons/receive/',
            method: 'POST',
            data: {
                coupon_id: couponId
            },
            header: {
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`,
                'content-type': 'application/json'
            },
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.success) {
                    wx.showToast({
                        title: '领取成功',
                        icon: 'success'
                    });
                    
                    // 更新优惠券列表
                    this.loadMerchantCoupons();
                    this.setData({ showCoupon: false });
                } else {
                    wx.showToast({
                        title: res.data.message || '领取失败',
                        icon: 'none'
                    });
                }
            },
            fail: (err) => {
                console.error('领取优惠券失败:', err);
                wx.showToast({
                    title: '网络请求失败',
                    icon: 'none'
                });
            }
        });
    },

    // 购买/购物车相关
    onAddToCart() {
        this.setData({ showSku: true, skuMode: 'cart' });
    },

    onBuyNow() {
        this.setData({ showSku: true, skuMode: 'buy' });
    },

    onCloseSku() {
        this.setData({ showSku: false });
    },

    onConfirmSku() {
        if (this.data.product.stock <= 0) {
            wx.showToast({
                title: '商品库存不足',
                icon: 'none'
            });
            return;
        }

        if (this.data.buyCount > this.data.product.stock) {
            wx.showToast({
                title: '购买数量不能超过库存',
                icon: 'none'
            });
            return;
        }

        if (this.data.skuMode === 'cart') {
            wx.showToast({
                title: '已加入购物车',
                icon: 'success'
            });
            // TODO: 调用加入购物车API
        } else {
            // 跳转订单确认页
            wx.navigateTo({
                url: `/pages/order/create/create?productId=${this.data.productId}&shopId=${this.data.shopId}&count=${this.data.buyCount}`
            });
        }
        this.setData({ showSku: false });
    },

    // 联系客服
    onContact() {
        wx.showActionSheet({
            itemList: ['在线客服', '拨打电话'],
            success: (res) => {
                if (res.tapIndex === 1) {
                    // 这里应该从商户信息中获取电话，暂时使用固定电话
                    wx.makePhoneCall({
                        phoneNumber: '13800138000', // 应该从商户信息获取
                        fail: () => {
                            wx.showToast({
                                title: '拨打电话失败',
                                icon: 'none'
                            });
                        }
                    });
                } else {
                    wx.showToast({
                        title: '在线客服功能开发中',
                        icon: 'none'
                    });
                }
            }
        });
    },

    // 进入店铺
    onGoShop() {
        wx.navigateBack(); // 通常从店铺进来的，返回即可
    }
});
