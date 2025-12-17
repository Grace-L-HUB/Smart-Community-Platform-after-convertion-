// pages/shop/detail/detail.ts
Page({
    data: {
        active: 0,
        shop: {
            name: '鲜丰水果（阳光花园店）',
            logo: 'https://img.yzcdn.cn/vant/logo.png',
            bgImage: 'https://img.yzcdn.cn/vant/cat.jpeg',
            score: 4.8,
            monthlySales: 500,
            tags: ['坏果包赔', '极速送达'],
            address: '阳光花园商业街 A-102'
        },
        coupons: [
            { id: 1, amount: 5, condition: '满30可用' },
            { id: 2, amount: 10, condition: '满69可用' }
        ],
        products: [
            { id: 1, name: '智利车厘子 J级 250g', price: '29.90', image: 'https://img.yzcdn.cn/vant/apple-1.jpg' },
            { id: 2, name: '赣南脐橙 5kg', price: '39.90', image: 'https://img.yzcdn.cn/vant/apple-2.jpg' }
        ]
    },

    onLoad() {
        // Fetch shop details by id
    },

    callShop() {
        wx.makePhoneCall({ phoneNumber: '13800138000' });
    }
});
