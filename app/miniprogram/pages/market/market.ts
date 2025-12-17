// pages/market/market.ts
Page({
    data: {
        value1: 0,
        value2: 'a',
        option1: [
            { text: '全部商品', value: 0 },
            { text: '数码', value: 1 },
            { text: '家居', value: 2 },
        ],
        option2: [
            { text: '默认排序', value: 'a' },
            { text: '最新发布', value: 'b' },
            { text: '价格最低', value: 'c' },
        ],
        goodsList: [
            {
                id: 1,
                title: '95新 iPhone 13 Pro 256G 远峰蓝',
                desc: '只有轻微使用痕迹，电池健康98%，箱说全。',
                price: '4800.00',
                thumb: 'https://img.yzcdn.cn/vant/apple-1.jpg',
                tag: '热卖',
                isNew: true
            },
            {
                id: 2,
                title: '宜家书桌转让',
                desc: '搬家带不走，低价转让，需要自提。',
                price: '100.00',
                thumb: 'https://img.yzcdn.cn/vant/apple-2.jpg',
                isNew: false
            }
        ]
    },
});
