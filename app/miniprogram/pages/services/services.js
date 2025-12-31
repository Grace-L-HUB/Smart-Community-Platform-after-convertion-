// pages/services/services.js
import { API_BASE_URL } from '../../config/api'

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

    // 从后端获取商户列表
    loadMerchants() {
        this.setData({ loading: true, error: '' });
        
        wx.request({
            url: `${API_BASE_URL}/merchant/profiles/`,
            method: 'GET',
            success: (res) => {
                console.log('商户列表响应:', res.data);
                
                if (res.statusCode === 200 && res.data.success) {
                    const merchants = res.data.data.map((merchant) => ({
                        id: merchant.id,
                        name: merchant.shop_name,
                        desc: merchant.shop_description || '优质商户，诚信经营',
                        price: `营业时间 ${merchant.business_hours_start}-${merchant.business_hours_end}`,
                        image: merchant.shop_logo || 'https://img.yzcdn.cn/vant/logo.png',
                        discount: merchant.shop_announcement || '',
                        category: merchant.category_display,
                        phone: merchant.shop_phone,
                        address: merchant.shop_address,
                        isActive: merchant.is_active
                    })).filter((merchant) => merchant.isActive); // 只显示启用的商户
                    
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
                    // 使用备用数据
                    this.loadFallbackData();
                }
            },
            fail: (err) => {
                console.error('获取商户列表网络请求失败:', err);
                this.setData({
                    error: '网络请求失败，请检查网络连接',
                    loading: false
                });
                // 使用备用数据
                this.loadFallbackData();
            }
        });
    },

    // 备用数据（API失败时使用）
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

    // 重新加载数据
    onRefresh() {
        this.loadMerchants();
    },

    onShopClick(event) {
        const shopId = event.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/shop/detail/detail?id=${shopId}`
        });
    }
});