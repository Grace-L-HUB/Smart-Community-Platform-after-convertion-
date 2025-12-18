Page({
    data: {
        searchValue: '',
        categories: [
            {
                category: '物业服务',
                contacts: [
                    { id: 1, name: '物业客服', desc: '24小时服务热线', phone: '400-123-4567', isFavorite: true },
                    { id: 2, name: '保安室', desc: '门岗值班电话', phone: '010-12345678', isFavorite: false },
                    { id: 3, name: '维修部', desc: '报修专线', phone: '010-87654321', isFavorite: false }
                ]
            },
            {
                category: '紧急电话',
                contacts: [
                    { id: 4, name: '火警', desc: '消防报警', phone: '119', isFavorite: false },
                    { id: 5, name: '匪警', desc: '公安报警', phone: '110', isFavorite: false },
                    { id: 6, name: '急救', desc: '医疗急救', phone: '120', isFavorite: false }
                ]
            },
            {
                category: '便民服务',
                contacts: [
                    { id: 7, name: '快递代收点', desc: '快递收发', phone: '010-11112222', isFavorite: false },
                    { id: 8, name: '社区医院', desc: '就近就医', phone: '010-33334444', isFavorite: false }
                ]
            }
        ]
    },
    onSearchChange(e: any) {
        this.setData({ searchValue: e.detail });
    },
    onCall(e: any) {
        const phone = e.currentTarget.dataset.phone;
        wx.makePhoneCall({ phoneNumber: phone });
    },
    onFavorite(e: any) {
        const id = e.currentTarget.dataset.id;
        const categories = this.data.categories.map(cat => ({
            ...cat,
            contacts: cat.contacts.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c)
        }));
        this.setData({ categories });
    }
});
