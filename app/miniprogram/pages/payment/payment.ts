// pages/payment/payment.ts
const API_PROPERTY_URL = 'http://127.0.0.1:8000/api/property'

interface BillInfo {
    id: number;
    bill_no: string;
    title: string;
    fee_type: string;
    fee_type_display: string;
    amount: number;
    status: string;
    status_display: string;
    due_date: string;
    period_display: string;
    is_overdue: boolean;
    house_info?: {
        address: string;
        area: string;
    };
    user_info?: {
        name: string;
        phone: string;
    };
}

Page({
    data: {
        totalAmount: 0,
        selectedBills: [] as string[],
        bills: [] as BillInfo[],
        loading: false,
        userInfo: null as any,
        houseInfo: null as any,
        hasOverdueBills: false,
        overdueBillsCount: 0
    },

    onLoad() {
        this.loadUserInfo();
        this.loadBills();
    },

    onShow() {
        // 页面显示时重新加载账单，防止支付后状态不更新
        this.loadBills();
    },

    // 加载用户信息
    loadUserInfo() {
        const userInfo = wx.getStorageSync('userInfo');
        const houseInfo = wx.getStorageSync('houseInfo');
        
        console.log('加载用户信息:', userInfo);
        console.log('加载房屋信息:', houseInfo);
        
        this.setData({
            userInfo,
            houseInfo
        });
        
        // 如果没有用户信息，提示用户登录
        if (!userInfo || !userInfo.id) {
            wx.showModal({
                title: '提示',
                content: '请先登录后再查看账单',
                showCancel: false,
                complete: () => {
                    wx.navigateBack();
                }
            });
        }
    },

    // 加载账单列表
    async loadBills() {
        if (!this.data.userInfo?.id) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            // 清空账单数据，不使用模拟数据
            this.setData({ bills: [], selectedBills: [], totalAmount: 0 });
            return;
        }

        this.setData({ loading: true });
        
        console.log('请求账单API:', `${API_PROPERTY_URL}/bills?user_id=${this.data.userInfo.id}&status=unpaid`);
        
        wx.request({
            url: `${API_PROPERTY_URL}/bills`,
            method: 'GET',
            data: {
                user_id: this.data.userInfo.id,
                status: 'unpaid'  // 只获取未支付的账单
            },
            success: (res: any) => {
                console.log('API响应:', res);
                
                if (res.statusCode === 200 && res.data && res.data.code === 200) {
                    const bills = res.data.data.list.map((bill: any) => ({
                        ...bill,
                        // 转换金额为分（兼容现有UI）
                        amountCents: Math.round(parseFloat(bill.amount) * 100)
                    }));
                    
                    this.setData({ bills });
                    
                    // 默认选中所有未支付账单
                    const allBillIds = bills.map((bill: any) => bill.id.toString());
                    this.setData({ selectedBills: allBillIds });
                    this.calculateTotal();
                    this.updateOverdueStatus();
                } else {
                    const errorMsg = (res.data && res.data.message) || '获取账单失败';
                    console.error('API响应错误:', res);
                    wx.showToast({ title: errorMsg, icon: 'none' });
                    // 清空账单数据，不使用模拟数据
                    this.setData({ bills: [], selectedBills: [], totalAmount: 0 });
                }
            },
            fail: (error) => {
                console.error('网络请求失败:', error);
                wx.showToast({ title: '网络请求失败，请稍后重试', icon: 'none' });
                // 清空账单数据，不使用模拟数据
                this.setData({ bills: [], selectedBills: [], totalAmount: 0 });
            },
            complete: () => {
                this.setData({ loading: false });
            }
        });
    },

    onBillChange(event: any) {
        this.setData({
            selectedBills: event.detail
        });
        this.calculateTotal();
    },

    calculateTotal() {
        const { selectedBills, bills } = this.data;
        let total = 0;
        bills.forEach((bill: BillInfo) => {
            if (selectedBills.includes(bill.id.toString())) {
                total += (bill as any).amountCents;
            }
        });
        this.setData({ totalAmount: total });
    },

    async onSubmit() {
        if (this.data.selectedBills.length === 0) {
            return wx.showToast({ title: '请选择账单', icon: 'none' });
        }

        try {
            // 显示支付方式选择
            const paymentMethods = ['微信支付', '支付宝'];
            const res = await wx.showActionSheet({
                itemList: paymentMethods
            });

            const selectedMethod = res.tapIndex === 0 ? 'wechat' : 'alipay';
            await this.processPayment(selectedMethod);

        } catch (error: any) {
            if (error.errMsg !== 'showActionSheet:cancel') {
                console.error('支付失败:', error);
                wx.showToast({ title: '支付失败', icon: 'none' });
            }
        }
    },

    async processPayment(paymentMethod: string) {
        const { selectedBills } = this.data;
        
        wx.showLoading({ title: '支付中...' });
        
        // 逐个支付选中的账单
        let successCount = 0;
        let processedCount = 0;
        const totalBills = selectedBills.length;
        
        for (const billId of selectedBills) {
            wx.request({
                url: `${API_PROPERTY_URL}/bills/${billId}/pay`,
                method: 'POST',
                header: {
                    'content-type': 'application/json'
                },
                data: {
                    payment_method: paymentMethod
                },
                success: (res: any) => {
                    if (res.statusCode === 200 && res.data && res.data.code === 200) {
                        successCount++;
                        console.log(`账单${billId}支付成功`);
                    } else {
                        const errorMsg = (res.data && res.data.message) || `支付失败`;
                        console.error(`账单${billId}支付失败:`, errorMsg);
                    }
                },
                fail: (error) => {
                    console.error(`账单${billId}支付异常:`, error);
                },
                complete: () => {
                    processedCount++;
                    
                    // 所有支付请求都完成后处理结果
                    if (processedCount === totalBills) {
                        wx.hideLoading();
                        
                        if (successCount === totalBills) {
                            wx.showToast({ title: '支付成功', icon: 'success' });
                            
                            // 支付成功后跳转到电子凭证页面
                            setTimeout(() => {
                                wx.navigateTo({
                                    url: `/pages/payment/receipt?billIds=${selectedBills.join(',')}`
                                });
                            }, 1500);
                        } else if (successCount > 0) {
                            wx.showToast({ 
                                title: `成功支付${successCount}/${totalBills}笔账单`, 
                                icon: 'none' 
                            });
                            this.loadBills(); // 重新加载账单
                        } else {
                            wx.showToast({ title: '支付失败', icon: 'error' });
                        }
                    }
                }
            });
        }
    },

    onRefresh() {
        this.loadBills();
    },

    // 更新逾期账单状态
    updateOverdueStatus() {
        const overdueBills = this.data.bills.filter(bill => bill.is_overdue);
        this.setData({
            hasOverdueBills: overdueBills.length > 0,
            overdueBillsCount: overdueBills.length
        });
    },

    // 全选/取消全选
    selectAll() {
        const { bills, selectedBills } = this.data;
        const allBillIds = bills.map(bill => bill.id.toString());
        
        if (selectedBills.length === bills.length) {
            // 当前全选，则取消全选
            this.setData({ selectedBills: [] });
        } else {
            // 当前未全选，则全选
            this.setData({ selectedBills: allBillIds });
        }
        this.calculateTotal();
    }
});
