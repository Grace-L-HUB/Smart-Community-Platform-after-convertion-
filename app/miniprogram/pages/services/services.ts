// pages/services/services.ts
Page({
    data: {
        active: 0,
        shops: [
            {
                id: 1,
                name: '鲜丰水果（阳光花园店）',
                desc: '新鲜水果，每日配送，业主9折',
                price: '人均 25.00',
                image: 'https://img.yzcdn.cn/vant/ipad.jpeg', // Placeholder
                discount: '满30减5'
            },
            {
                id: 2,
                name: '邻里便利店',
                desc: '24小时服务，免费送货上门',
                price: '人均 15.00',
                image: 'https://img.yzcdn.cn/vant/iphone-11.jpg', // Placeholder
                discount: '首单立减'
            }
        ]
    },
});
