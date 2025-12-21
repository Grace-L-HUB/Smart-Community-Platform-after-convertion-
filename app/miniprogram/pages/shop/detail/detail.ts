// pages/shop/detail/detail.ts
Page({
    data: {
        active: 0,
        shopId: 0,
        shop: {} as any,
        products: [] as any[],
        loading: false,
        error: '',
        productsLoading: false,
        productsError: ''
    },

    onLoad(options: any) {
        const shopId = parseInt(options.id || '0');
        if (shopId > 0) {
            this.setData({ shopId });
            this.loadShopDetail();
            this.loadProducts();
        } else {
            this.setData({ error: '商户ID无效' });
        }
    },

    // 获取商户详情
    loadShopDetail() {
        this.setData({ loading: true, error: '' });

        wx.request({
            url: `http://127.0.0.1:8000/api/merchant/profile/${this.data.shopId}/`,
            method: 'GET',
            success: (res: any) => {
                console.log('商户详情响应:', res.data);

                if (res.statusCode === 200 && res.data.success) {
                    const merchant = res.data.data;
                    this.setData({
                        shop: {
                            id: merchant.id,
                            name: merchant.shop_name,
                            logo: merchant.shop_logo || 'https://img.yzcdn.cn/vant/logo.png',
                            bgImage: merchant.shop_logo || 'https://img.yzcdn.cn/vant/cat.jpeg',
                            score: 4.8, // 暂时固定，后续可从评价系统获取
                            monthlySales: merchant.total_orders || 0,
                            tags: merchant.shop_announcement ? [merchant.shop_announcement] : ['诚信经营'],
                            address: merchant.shop_address,
                            phone: merchant.shop_phone,
                            description: merchant.shop_description,
                            businessHours: `${merchant.business_hours_start} - ${merchant.business_hours_end}`,
                            category: merchant.category_display,
                            totalRevenue: merchant.total_revenue
                        },
                        loading: false
                    });
                } else {
                    console.error('获取商户详情失败:', res.data);
                    this.setData({
                        error: res.data.message || '获取商户详情失败',
                        loading: false
                    });
                    // 使用备用数据
                    this.loadFallbackShopData();
                }
            },
            fail: (err) => {
                console.error('获取商户详情网络请求失败:', err);
                this.setData({
                    error: '网络请求失败，请检查网络连接',
                    loading: false
                });
                // 使用备用数据
                this.loadFallbackShopData();
            }
        });
    },

    // 获取商户商品列表
    loadProducts() {
        this.setData({ productsLoading: true, productsError: '' });

        wx.request({
            url: `http://127.0.0.1:8000/api/merchant/products/public/${this.data.shopId}/`,
            method: 'GET',
            success: (res: any) => {
                console.log('商品列表响应:', res.data);

                if (res.statusCode === 200 && res.data.success) {
                    const products = res.data.data
                        .filter((product: any) => product.status === 'online') // 只显示上架商品
                        .map((product: any) => ({
                            id: product.id,
                            name: product.name,
                            description: product.description,
                            price: product.price,
                            originalPrice: product.original_price,
                            image: product.image_url || 'https://img.yzcdn.cn/vant/apple-1.jpg',
                            stock: product.stock,
                            category: product.category_display,
                            salesCount: product.sales_count,
                            serviceTimeSlots: product.service_time_slots
                        }));

                    this.setData({
                        products,
                        productsLoading: false
                    });
                } else {
                    console.error('获取商品列表失败:', res.data);
                    this.setData({
                        productsError: res.data.message || '获取商品列表失败',
                        productsLoading: false
                    });
                    // 使用备用数据
                    this.loadFallbackProductsData();
                }
            },
            fail: (err) => {
                console.error('获取商品列表网络请求失败:', err);
                this.setData({
                    productsError: '网络请求失败，请检查网络连接',
                    productsLoading: false
                });
                // 使用备用数据
                this.loadFallbackProductsData();
            }
        });
    },

    // 备用商户数据
    loadFallbackShopData() {
        this.setData({
            shop: {
                id: this.data.shopId,
                name: '鲜丰水果（阳光花园店）',
                logo: 'https://img.yzcdn.cn/vant/logo.png',
                bgImage: 'https://img.yzcdn.cn/vant/cat.jpeg',
                score: 4.8,
                monthlySales: 500,
                tags: ['坏果包赔', '极速送达'],
                address: '阳光花园商业街 A-102',
                phone: '13800138000',
                description: '新鲜水果，每日配送，业主9折',
                businessHours: '09:00 - 22:00',
                category: '便利店'
            }
        });
    },

    // 备用商品数据
    loadFallbackProductsData() {
        this.setData({
            products: [
                {
                    id: 1,
                    name: '智利车厘子 J级 250g',
                    price: '29.90',
                    originalPrice: '35.90',
                    image: 'https://img.yzcdn.cn/vant/apple-1.jpg',
                    description: '新鲜车厘子，甜度高',
                    stock: 100,
                    category: '水果',
                    salesCount: 256
                },
                {
                    id: 2,
                    name: '赣南脐橙 5kg',
                    price: '39.90',
                    originalPrice: '45.90',
                    image: 'https://img.yzcdn.cn/vant/apple-2.jpg',
                    description: '赣南特产脐橙，汁多味甜',
                    stock: 50,
                    category: '水果',
                    salesCount: 128
                }
            ]
        });
    },

    // 重新加载数据
    onRefresh() {
        this.loadShopDetail();
        this.loadProducts();
    },

    callShop() {
        if (this.data.shop.phone) {
            wx.makePhoneCall({
                phoneNumber: this.data.shop.phone,
                fail: () => {
                    wx.showToast({
                        title: '拨打电话失败',
                        icon: 'none'
                    });
                }
            });
        } else {
            wx.showToast({
                title: '商户电话不可用',
                icon: 'none'
            });
        }
    },

    // 添加到购物车
    onAddToCart(event: any) {
        const productId = event.currentTarget.dataset.id;
        const product = this.data.products.find((p: any) => p.id === productId);

        if (product) {
            if (product.stock <= 0) {
                wx.showToast({
                    title: '商品库存不足',
                    icon: 'none'
                });
                return;
            }

            // 这里可以实现购物车逻辑
            wx.showToast({
                title: '已添加到购物车',
                icon: 'success'
            });
        }
    },

    // 立即购买
    onBuyNow(event: any) {
        const productId = event.currentTarget.dataset.id;
        const product = this.data.products.find((p: any) => p.id === productId);

        if (product) {
            if (product.stock <= 0) {
                wx.showToast({
                    title: '商品库存不足',
                    icon: 'none'
                });
                return;
            }

            // 跳转到订单页面
            wx.navigateTo({
                url: `/pages/order/create/create?productId=${productId}&shopId=${this.data.shopId}`
            });
        }
    },

    // 跳转商品详情
    onProductClick(event: any) {
        const productId = event.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/shop/product/product?id=${productId}&shopId=${this.data.shopId}`
        });
    }
});
