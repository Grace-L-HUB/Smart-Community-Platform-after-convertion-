// pages/community/post-item/post-item.ts
const API_BASE_URL = 'http://127.0.0.1:8000/api/community'

Page({
    data: {
        fileList: [] as any[],
        title: '',
        price: '',
        description: '',
        categoryText: '',
        conditionText: '',
        selectedCategory: '',
        selectedCondition: '',
        showCategory: false,
        showCondition: false,
        categories: ['家用电器', '家具', '数码产品', '图书音像', '服装鞋包', '母婴用品', '运动户外', '其他'],
        conditions: ['全新', '99新', '95新', '9成新', '8成新', '7成新'],
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
        console.log('Category selected:', value);
        
        // value是一个数组，我们需要取第一个元素
        const selectedValue = Array.isArray(value) ? value[0] : value;
        
        this.setData({
            categoryText: selectedValue,
            selectedCategory: selectedValue,
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
        console.log('Condition selected:', value);
        
        // value是一个数组，我们需要取第一个元素
        const selectedValue = Array.isArray(value) ? value[0] : value;
        
        this.setData({
            conditionText: selectedValue,
            selectedCondition: selectedValue,
            showCondition: false
        });
        this.checkCanSubmit();
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

    // 获取用户token
    getUserToken() {
        const userInfo = wx.getStorageSync('userInfo');
        return userInfo ? userInfo.token : null;
    },

    onSubmit() {
        if (!this.data.canSubmit) {
            return;
        }

        const token = this.getUserToken();
        if (!token) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        wx.showLoading({ title: '发布中...' });

        // 构造表单数据
        const formData: any = {
            title: this.data.title,
            description: this.data.description,
            price: parseFloat(this.data.price),
            category: this.data.selectedCategory,
            condition: this.data.selectedCondition
        };

        // 如果有图片，需要单独上传
        if (this.data.fileList.length > 0) {
            this.uploadImagesAndSubmit(formData, token);
        } else {
            this.submitItem(formData, token);
        }
    },

    // 上传图片并提交商品
    uploadImagesAndSubmit(formData: any, token: string) {
        const fileList = this.data.fileList;
        const uploadPromises: Promise<string>[] = [];

        fileList.forEach((file: any) => {
            uploadPromises.push(new Promise((resolve, reject) => {
                wx.uploadFile({
                    url: `${API_BASE_URL}/market-items/`,
                    filePath: file.url,
                    name: 'uploaded_images',
                    header: {
                        'Authorization': `Bearer ${token}`
                    },
                    formData: uploadPromises.length === 0 ? formData : {},
                    success: (res) => {
                        if (res.statusCode === 201) {
                            resolve(res.data);
                        } else {
                            reject(new Error('上传失败'));
                        }
                    },
                    fail: reject
                });
            }));
        });

        // 简化处理：直接提交表单数据，图片通过multipart上传
        this.submitWithImages(formData, token);
    },

    // 通过multipart方式提交（包含图片）
    submitWithImages(formData: any, token: string) {
        // 由于微信小程序的限制，我们需要使用特殊的方式处理图片上传
        // 这里简化处理，先提交商品信息，然后上传图片
        
        wx.uploadFile({
            url: `${API_BASE_URL}/market-items/`,
            filePath: this.data.fileList[0].url, // 先上传第一张图片
            name: 'uploaded_images',
            header: {
                'Authorization': `Bearer ${token}`
            },
            formData: formData,
            success: (res) => {
                if (res.statusCode === 201) {
                    wx.hideLoading();
                    wx.showToast({
                        title: '发布成功',
                        icon: 'success',
                        duration: 2000
                    });

                    setTimeout(() => {
                        wx.navigateBack();
                    }, 2000);
                } else {
                    wx.hideLoading();
                    wx.showToast({
                        title: '发布失败',
                        icon: 'none'
                    });
                }
            },
            fail: () => {
                wx.hideLoading();
                wx.showToast({
                    title: '网络错误',
                    icon: 'none'
                });
            }
        });
    },

    // 不含图片的提交
    submitItem(formData: any, token: string) {
        wx.request({
            url: `${API_BASE_URL}/market-items/`,
            method: 'POST',
            header: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: formData,
            success: (res) => {
                wx.hideLoading();
                
                if (res.statusCode === 201) {
                    wx.showToast({
                        title: '发布成功',
                        icon: 'success',
                        duration: 2000
                    });

                    setTimeout(() => {
                        wx.navigateBack();
                    }, 2000);
                } else {
                    wx.showToast({
                        title: '发布失败',
                        icon: 'none'
                    });
                }
            },
            fail: () => {
                wx.hideLoading();
                wx.showToast({
                    title: '网络错误',
                    icon: 'none'
                });
            }
        });
    }
});
