// pages/order/create/create.ts
import { API_BASE_URL } from '../../config/api'

Page({
    data: {
        // 基本信息
        productId: 0,
        shopId: 0,
        product: {} as any,
        shop: {} as any,

        // 表单数据
        quantity: 1,
        pickupType: 'pickup', // pickup: 到店自提, delivery: 外卖配送
        contactName: '',
        contactPhone: '',
        address: '',
        note: '',

        // 优惠券相关
        availableCoupons: [] as any[],
        selectedCoupon: null as any,

        // 价格计算
        totalAmount: 0, // 商品总价
        discountAmount: 0, // 优惠金额
        actualAmount: 0, // 实付金额

        // 状态
        loading: true,
        submitting: false,
        showPickupTypeModal: false,
        showCouponModal: false,

        // 验证状态
        canSubmit: false
    },

    onLoad(options: any) {
        const productId = parseInt(options.productId || '0');
        const shopId = parseInt(options.shopId || '0');

        if (productId > 0 && shopId > 0) {
            this.setData({
                productId,
                shopId
            });
            this.loadOrderData();
        } else {
            wx.showToast({
                title: '参数错误',
                icon: 'none'
            });
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
        }
    },

    // 加载订单所需数据
    loadOrderData() {
        this.setData({ loading: true });

        // 并行加载商品和用户信息
        Promise.all([
            this.loadProduct(),
            this.loadShop(),
            this.loadUserInfo(),
            this.loadUserCoupons()
        ]).then(() => {
            this.calculatePrice();
            this.checkCanSubmit();
            this.setData({ loading: false });
        }).catch((err) => {
            console.error('加载数据失败:', err);
            this.setData({ loading: false });
            wx.showToast({
                title: '加载失败',
                icon: 'none'
            });
        });
    },

    // 加载商品信息
    loadProduct() {
        return new Promise((resolve, reject) => {
            wx.request({
                url: `${API_BASE_URL}/merchant/products/public/${this.data.shopId}/`,
                method: 'GET',
                success: (res: any) => {
                    if (res.statusCode === 200 && res.data.success) {
                        const products = res.data.data;
                        const product = products.find((p: any) => p.id === this.data.productId);
                        if (product) {
                            this.setData({
                                product: {
                                    id: product.id,
                                    name: product.name,
                                    description: product.description,
                                    price: parseFloat(product.price),
                                    originalPrice: parseFloat(product.original_price || 0),
                                    image: product.image_url || 'https://img.yzcdn.cn/vant/apple-1.jpg',
                                    stock: product.stock,
                                    category: product.category_display
                                }
                            });
                            resolve(product);
                        } else {
                            reject(new Error('商品不存在'));
                        }
                    } else {
                        reject(new Error(res.data.message || '获取商品信息失败'));
                    }
                },
                fail: reject
            });
        });
    },

    // 加载商家信息
    loadShop() {
        return new Promise((resolve, reject) => {
            wx.request({
                url: `${API_BASE_URL}/merchant/profile/${this.data.shopId}/`,
                method: 'GET',
                success: (res: any) => {
                    if (res.statusCode === 200 && res.data.success) {
                        const merchant = res.data.data;
                        this.setData({
                            shop: {
                                id: merchant.id,
                                name: merchant.shop_name,
                                address: merchant.shop_address,
                                phone: merchant.shop_phone
                            }
                        });
                        resolve(merchant);
                    } else {
                        reject(new Error(res.data.message || '获取商家信息失败'));
                    }
                },
                fail: reject
            });
        });
    },

    // 加载用户信息
    loadUserInfo() {
        return new Promise((resolve, reject) => {
            const userInfo = wx.getStorageSync('userInfo');
            const token = wx.getStorageSync('token');

            if (userInfo && token) {
                this.setData({
                    contactName: userInfo.display_name || userInfo.nickname || '',
                    contactPhone: userInfo.phone || ''
                });
                resolve(userInfo);
            } else {
                // 用户未登录，显示提示并跳转到登录页面
                wx.showModal({
                    title: '提示',
                    content: '请先登录后再下单',
                    showCancel: false,
                    success: () => {
                        wx.navigateTo({
                            url: '/pages/login/login'
                        });
                    }
                });
                reject(new Error('用户未登录'));
            }
        });
    },

    // 加载用户可用优惠券
    loadUserCoupons() {
        return new Promise((resolve, reject) => {
            wx.request({
                url: `${API_BASE_URL}/merchant/user/coupons/`,
                method: 'GET',
                data: { status: 'unused' },
                header: {
                    'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`,
                    'content-type': 'application/json'
                },
                success: (res: any) => {
                    console.log('优惠券原始数据:', res.data);

                    if (res.statusCode === 200 && res.data.success) {
                        const coupons = res.data.data
                            .filter((coupon: any) => {
                                // 检查数据结构完整性 - merchant_info 可能是顶层字段
                                console.log('检查优惠券:', {
                                    coupon: !!coupon,
                                    coupon_info: !!coupon?.coupon_info,
                                    merchant_info: !!coupon?.merchant_info,
                                    nested_merchant_info: !!coupon?.coupon_info?.merchant_info,
                                    merchantId: coupon?.merchant_info?.id || coupon?.coupon_info?.merchant_info?.id,
                                    targetShopId: this.data.shopId,
                                    isExpired: coupon?.is_expired
                                });

                                const merchantId = coupon.merchant_info?.id || coupon.coupon_info?.merchant_info?.id;

                                return coupon &&
                                       merchantId &&
                                       merchantId === this.data.shopId && // 同一商家
                                       !coupon.is_expired; // 未过期
                            })
                            .map((coupon: any) => ({
                                id: coupon.id,
                                couponId: coupon.coupon,
                                name: coupon.coupon_info.name,
                                description: coupon.coupon_info.description,
                                amount: parseFloat(coupon.coupon_info.amount),
                                minAmount: parseFloat(coupon.coupon_info.min_amount),
                                type: coupon.coupon_info.type
                            }));

                        console.log('过滤后的优惠券:', coupons);
                        this.setData({ availableCoupons: coupons });
                        resolve(coupons);
                    } else {
                        console.log('获取优惠券失败:', res.data);
                        this.setData({ availableCoupons: [] });
                        resolve([]);
                    }
                },
                fail: (err) => {
                    console.log('获取优惠券网络请求失败:', err);
                    this.setData({ availableCoupons: [] });
                    resolve([]);
                }
            });
        });
    },

    // 数量变化
    onQuantityChange(event: any) {
        const quantity = event.detail;
        this.setData({ quantity });
        this.calculatePrice();
        this.checkCanSubmit();
    },

    // 价格计算
    calculatePrice() {
        const { quantity, product, selectedCoupon } = this.data;

        // 计算商品总价
        const totalAmount = (product.price || 0) * quantity;
        let discountAmount = 0;

        // 计算优惠券优惠金额
        if (selectedCoupon) {
            const minAmount = selectedCoupon.minAmount || 0;
            if (totalAmount >= minAmount) {
                if (selectedCoupon.type === 'deduction') {
                    // 满减券
                    discountAmount = selectedCoupon.amount;
                } else if (selectedCoupon.type === 'discount') {
                    // 折扣券
                    discountAmount = totalAmount * (1 - selectedCoupon.amount);
                }
            }
        }

        const actualAmount = Math.max(0, totalAmount - discountAmount);

        this.setData({
            totalAmount,
            discountAmount,
            actualAmount
        });
    },

    // 检查是否可以提交
    checkCanSubmit() {
        const { contactName, contactPhone, pickupType, address } = this.data;
        const canSubmit = !!(contactName && contactPhone &&
            (pickupType === 'pickup' || (pickupType === 'delivery' && address)));

        this.setData({ canSubmit });
    },

    // 显示取餐方式选择弹窗
    showPickupTypePopup() {
        this.setData({ showPickupTypeModal: true });
    },

    // 隐藏取餐方式选择弹窗
    hidePickupTypePopup() {
        this.setData({ showPickupTypeModal: false });
    },

    // 取餐方式变化
    onPickupTypeChange(event: any) {
        const pickupType = event.detail;
        this.setData({ pickupType });
        this.checkCanSubmit();
    },

    // 选择取餐方式
    onPickupTypeSelect(event: any) {
        const pickupType = event.currentTarget.dataset.type;
        this.setData({ pickupType });
        this.checkCanSubmit();
        this.hidePickupTypePopup();
    },

    // 显示优惠券选择弹窗
    showCouponPopup() {
        this.setData({ showCouponModal: true });
    },

    // 隐藏优惠券选择弹窗
    hideCouponPopup() {
        this.setData({ showCouponModal: false });
    },

    // 选择优惠券
    onCouponSelect(event: any) {
        const couponData = event.currentTarget.dataset.coupon;
        const selectedCoupon = couponData ? couponData : null;

        this.setData({ selectedCoupon });
        this.calculatePrice();
        this.hideCouponPopup();
    },

    // 表单输入变化
    onAddressChange(event: any) {
        this.setData({ address: event.detail });
        this.checkCanSubmit();
    },

    onContactNameChange(event: any) {
        this.setData({ contactName: event.detail });
        this.checkCanSubmit();
    },

    onContactPhoneChange(event: any) {
        this.setData({ contactPhone: event.detail });
        this.checkCanSubmit();
    },

    onNoteChange(event: any) {
        this.setData({ note: event.detail });
    },

    // 提交订单
    onSubmitOrder() {
        if (!this.data.canSubmit || this.data.submitting) {
            return;
        }

        this.setData({ submitting: true });

        const orderData = {
            merchant_id: this.data.shopId,
            contact_name: this.data.contactName,
            contact_phone: this.data.contactPhone,
            pickup_type: this.data.pickupType,
            address: this.data.pickupType === 'delivery' ? this.data.address : '',
            note: this.data.note,
            user_coupon_id: this.data.selectedCoupon ? this.data.selectedCoupon.id : null,
            order_items: [{
                product_id: this.data.productId,
                product_name: this.data.product.name,
                price: this.data.product.price,
                quantity: this.data.quantity
            }]
        };

        console.log('提交订单数据:', orderData);

        wx.request({
            url: `${API_BASE_URL}/merchant/orders/create/`,
            method: 'POST',
            data: orderData,
            header: {
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`,
                'content-type': 'application/json'
            },
            success: (res: any) => {
                console.log('请求响应状态码:', res.statusCode);
                console.log('完整响应数据:', res.data);

                if (res.statusCode >= 200 && res.statusCode < 300 && res.data.success) {
                    console.log('订单创建成功，响应数据:', res.data);
                    const order = res.data.data;

                    // 显示订单成功提示
                    wx.showModal({
                        title: '订单提交成功',
                        content: `订单号：${order.order_no}\n取餐码：${order.pickup_code || '无需取餐码'}\n请前往商家取餐`,
                        showCancel: false,
                        confirmText: '确定',
                        success: () => {
                            console.log('开始跳转到商户详情页面');
                            console.log('商户ID:', this.data.shopId);
                            console.log('跳转URL:', `/pages/shop/detail/detail?id=${this.data.shopId}`);

                            // 跳转到商户详情页面
                            wx.redirectTo({
                                url: `/pages/shop/detail/detail?id=${this.data.shopId}`,
                                success: () => {
                                    console.log('跳转成功');
                                },
                                fail: (err: any) => {
                                    console.error('跳转失败:', err);
                                }
                            });
                        }
                    });
                } else {
                    console.log('订单创建失败，响应数据:', res.data);
                    wx.showToast({
                        title: res.data.message || '订单提交失败',
                        icon: 'none',
                        duration: 3000
                    });
                }
            },
            fail: (err) => {
                console.error('提交订单失败:', err);
                wx.showToast({
                    title: '网络请求失败，请重试',
                    icon: 'none'
                });
            },
            complete: () => {
                this.setData({ submitting: false });
            }
        });
    }
});