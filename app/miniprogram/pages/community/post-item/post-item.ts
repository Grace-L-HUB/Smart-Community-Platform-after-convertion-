// pages/community/post-item/post-item.ts
Page({
    data: {
        fileList: [] as any[],
        title: '',
        price: '',
        description: '',
        categoryText: '',
        conditionText: '',
        tradeTypeText: '',
        selectedCategory: '',
        selectedCondition: '',
        selectedTradeType: '',
        showCategory: false,
        showCondition: false,
        showTradeType: false,
        categories: ['家用电器', '家具', '数码产品', '图书音像', '服装鞋包', '母婴用品', '运动户外', '其他'],
        conditions: ['全新', '99新', '95新', '9成新', '8成新', '7成新'],
        tradeTypes: ['自提', '同城配送', '快递邮寄'],
        canSubmit: false
    },

    afterRead(event: any) {
        const { file } = event.detail;
        const fileList = this.data.fileList;

        if (Array.isArray(file)) {
            fileList.push(...file);
        } else {
            fileList.push(file);
        }

        this.setData({ fileList });
        this.checkCanSubmit();

        // TODO: 上传图片到服务器
        console.log('Upload images:', fileList);
    },

    deleteImage(event: any) {
        const { index } = event.detail;
        const fileList = this.data.fileList;
        fileList.splice(index, 1);
        this.setData({ fileList });
        this.checkCanSubmit();
    },

    onTitleChange(event: any) {
        this.setData({ title: event.detail });
        this.checkCanSubmit();
    },

    onPriceChange(event: any) {
        this.setData({ price: event.detail });
        this.checkCanSubmit();
    },

    onDescChange(event: any) {
        this.setData({ description: event.detail });
        this.checkCanSubmit();
    },

    showCategoryPicker() {
        this.setData({ showCategory: true });
    },

    closeCategoryPicker() {
        this.setData({ showCategory: false });
    },

    onCategoryConfirm(event: any) {
        const { value } = event.detail;
        this.setData({
            categoryText: value,
            selectedCategory: value,
            showCategory: false
        });
        this.checkCanSubmit();
    },

    showConditionPicker() {
        this.setData({ showCondition: true });
    },

    closeConditionPicker() {
        this.setData({ showCondition: false });
    },

    onConditionConfirm(event: any) {
        const { value } = event.detail;
        this.setData({
            conditionText: value,
            selectedCondition: value,
            showCondition: false
        });
        this.checkCanSubmit();
    },

    showTradeTypePicker() {
        this.setData({ showTradeType: true });
    },

    closeTradeTypePicker() {
        this.setData({ showTradeType: false });
    },

    onTradeTypeConfirm(event: any) {
        const { value } = event.detail;
        this.setData({
            tradeTypeText: value,
            selectedTradeType: value,
            showTradeType: false
        });
    },

    checkCanSubmit() {
        const { fileList, title, price, categoryText, conditionText } = this.data;
        const canSubmit = fileList.length > 0 &&
            title.trim() !== '' &&
            price !== '' &&
            categoryText !== '' &&
            conditionText !== '';
        this.setData({ canSubmit });
    },

    onSubmit() {
        if (!this.data.canSubmit) {
            return;
        }

        wx.showLoading({ title: '发布中...' });

        // TODO: 提交数据到服务器
        setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
                title: '发布成功',
                icon: 'success',
                duration: 2000
            });

            setTimeout(() => {
                wx.navigateBack();
            }, 2000);
        }, 1500);
    }
});
