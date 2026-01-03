// pages/services/services.js
const { API_BASE_URL } = require('../../config/api')

Page({
    data: {
        active: 0,
        shops: [],
        loading: false,
        error: ''
    },

    onLoad() {
        this.loadMerchants();
    },

    loadMerchants() {
        this.setData({ loading: true, error: '' });
        
        wx.request({
            url: API_BASE_URL + '/merchant/profiles/',
            method: 'GET',
            success: (res) => {
                console.log('商户列表响应:', res.data);
                
                if (res.statusCode === 200 && res.data.success) {
                    const merchants = res.data.data.map((merchant) => ({
                        id: merchant.id,
                        name: merchant.shop_name,
                        desc: merchant.shop_description || '优质商户，诚信经营',
                        price: '营业时间 ' + merchant.business_hours_start + '-' + merchant.business_hours_end,
                        image: merchant.shop_logo || 'https://img.yzcdn.cn/vant/logo.png',
                        discount: merchant.shop_announcement || '',
                        category: merchant.category_display,
                        phone: merchant.shop_phone,
                        address: merchant.shop_address,
                        isActive: merchant.is_active
                    })).filter((merchant) => merchant.isActive);
                    
                    this.setData({
                        shops: merchants,
                        loading: false
                    });
                } else {
                    console.error('获取商户列表失败:', res.data);
                    this.setData({
                        error: res.data.message || '获取商户列表失败',
                        loading: false
                    });
                    this.loadFallbackData();
                }
            },
            fail: (err) => {
                console.error('获取商户列表网络请求失败:', err);
                this.setData({
                    error: '网络请求失败，请检查网络连接',
                    loading: false
                });
                this.loadFallbackData();
            }
        });
    },

    loadFallbackData() {
        this.setData({
            shops: [
                {
                    id: 1,
                    name: '鲜丰水果（阳光花园店）',
                    desc: '新鲜水果，每日配送，业主9折',
                    price: '营业时间 09:00-22:00',
                    image: 'https://img.yzcdn.cn/vant/ipad.jpeg',
                    discount: '满30减5',
                    category: '便利店',
                    phone: '13800138000',
                    address: '阳光花园商业街 A-102'
                },
                {
                    id: 2,
                    name: '邻里便利店',
                    desc: '24小时服务，免费送货上门',
                    price: '营业时间 00:00-24:00',
                    image: 'https://img.yzcdn.cn/vant/iphone-11.jpg',
                    discount: '首单立减',
                    category: '便利店',
                    phone: '13900139000',
                    address: '阳光花园商业街 B-205'
                }
            ],
            error: ''
        });
    },

    onRefresh() {
        this.loadMerchants();
    },

    onShopClick(event) {
        const merchantId = event.currentTarget.dataset.id;
        wx.navigateTo({
            url: '/pages/shop/detail/detail?id=' + merchantId
        });
    }
});
