// pages/community/market-detail/market-detail.ts
Page({
    data: {
        id: 0,
        images: [
            'https://img.yzcdn.cn/vant/apple-1.jpg',
            'https://img.yzcdn.cn/vant/apple-2.jpg',
            'https://img.yzcdn.cn/vant/apple-3.jpg'
        ],
        price: '50',
        title: '转让九成新加湿器，无需滤网，静音',
        isNew: true,
        condition: '99新',
        seller: {
            name: '张三',
            avatar: '',
            location: '阳光花园 3栋'
        },
        description: '去年双十一买的加湿器，用了一个冬天，功能完好。因为搬家不方便带走，低价转让。\n\n特点：\n- 无需滤网，省钱方便\n- 静音设计，不影响睡眠\n- 大容量水箱，可用一整晚\n\n自提，诚心要可小刀。',
        category: '家用电器',
        publishTime: '2小时前',
        tradeType: '自提',
        isFavorite: false
    },

    onLoad(options: any) {
        if (options.id) {
            this.setData({ id: options.id });
            // TODO: 根据id加载商品详情
            this.loadGoodsDetail(options.id);
        }
    },

    loadGoodsDetail(id: string) {
        // TODO: 调用API加载商品详情
        console.log('Loading goods detail:', id);
    },

    onChat() {
        wx.showToast({
            title: '打开聊天窗口',
            icon: 'none'
        });
        // TODO: 跳转到聊天页面
    },

    onFavorite() {
        const isFavorite = !this.data.isFavorite;
        this.setData({ isFavorite });
        wx.showToast({
            title: isFavorite ? '已收藏' : '已取消收藏',
            icon: 'success'
        });
    },

    onWant() {
        wx.showModal({
            title: '确认购买',
            content: '确定要购买这件商品吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.showToast({
                        title: '已发送购买意向',
                        icon: 'success'
                    });
                    // TODO: 发送购买意向给卖家
                }
            }
        });
    }
});
