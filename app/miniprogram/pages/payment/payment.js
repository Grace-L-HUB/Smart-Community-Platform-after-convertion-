// pages/payment/payment.js
const { API_BASE_URL } = require('../../config/api')

Page({
    data: {
        bills: [],
        loading: false,
        selectedBills: [],
        houseInfo: null,
        totalAmount: 0,
        hasOverdueBills: false,
        overdueBillsCount: 0
    },

    onLoad() {
        console.log('=== payment page onLoad ===');
        this.loadBills();
    },

    getUserToken() {
        const userInfo = wx.getStorageSync('userInfo');
        console.log('=== userInfo ===', userInfo);
        return userInfo ? userInfo.token : null;
    },

    getUserId() {
        const userInfo = wx.getStorageSync('userInfo');
        return userInfo ? (userInfo.user_id || userInfo.id) : null;
    },

    loadBills() {
        console.log('=== loadBills start ===');
        const token = this.getUserToken();
        const userId = this.getUserId();

        console.log('=== token ===', token ? 'exists' : 'null');
        console.log('=== userId ===', userId);

        if (!token) {
            console.log('=== no token, show login toast ===');
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        if (!userId) {
            console.log('=== no userId, show bind toast ===');
            wx.showToast({ title: '请先绑定房屋', icon: 'none' });
            return;
        }

        this.setData({ loading: true });

        wx.request({
            url: API_BASE_URL + '/property/bills',
            method: 'GET',
            data: {
                user_id: userId,
                status: 'unpaid',
                page: 1,
                page_size: 50
            },
            header: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            success: (res) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    // 后端返回的是 { data: { list: [...], total: ... } }
                    const bills = res.data.data?.list || [];
                    const processedBills = bills.map(bill => ({
                        id: bill.id,
                        title: bill.fee_type_display || '账单',
                        fee_type: this.getFeeTypeColor(bill.fee_type),
                        fee_type_display: bill.fee_type_display || bill.fee_type,
                        amount: (Number(bill.amount) || 0).toFixed(2),
                        period_display: bill.period_display || `${bill.billing_year}年${bill.billing_month}月`,
                        is_overdue: bill.is_overdue || false,
                        due_date: bill.due_date || '',
                        status: bill.status,
                        house_info: bill.house_info ? {
                            address: bill.house_info.full_address || bill.house_info.address,
                            area: bill.house_info.area
                        } : null
                    }));

                    let houseInfo = null;
                    if (processedBills.length > 0 && processedBills[0].house_info) {
                        houseInfo = processedBills[0].house_info;
                    }

                    this.setData({
                        bills: processedBills,
                        houseInfo: houseInfo,
                        loading: false
                    });

                    this.calculateTotals();
                } else {
                    wx.showToast({ title: res.data?.message || '加载失败', icon: 'none' });
                    this.setData({ loading: false });
                }
            },
            fail: (err) => {
                console.error('加载账单失败:', err);
                wx.showToast({ title: '网络错误', icon: 'none' });
                this.setData({ loading: false });
            }
        });
    },

    getFeeTypeColor(feeType) {
        const colorMap = {
            'property_fee': 'primary',
            'parking_fee': 'success',
            'water_fee': 'info',
            'electricity_fee': 'warning',
            'gas_fee': 'danger',
            'heating_fee': 'default'
        };
        return colorMap[feeType] || 'primary';
    },

    calculateTotals() {
        const { bills, selectedBills } = this.data;

        if (!Array.isArray(bills)) {
            return;
        }

        const selectedBillObjects = bills.filter(function(bill) {
            // 处理类型不一致：将 bill.id 转为字符串比较
            return selectedBills.indexOf(String(bill.id)) !== -1 || selectedBills.indexOf(bill.id) !== -1;
        });

        let totalAmount = 0;
        for (var i = 0; i < selectedBillObjects.length; i++) {
            totalAmount += parseFloat(selectedBillObjects[i].amount) || 0;
        }

        const overdueBills = bills.filter(function(bill) {
            return bill.is_overdue;
        });
        const hasOverdueBills = overdueBills.length > 0;

        this.setData({
            totalAmount: totalAmount * 100,
            hasOverdueBills: hasOverdueBills,
            overdueBillsCount: overdueBills.length
        });
    },

    onBillChange(e) {
        this.setData({
            selectedBills: e.detail
        });
        this.calculateTotals();
    },

    onRefresh() {
        this.loadBills();
    },

    selectAll() {
        const { selectedBills, bills } = this.data;
        if (selectedBills.length === bills.length) {
            // 取消全选
            this.setData({
                selectedBills: []
            });
        } else {
            // 全选：将 id 转为字符串，保证类型一致
            var billIds = [];
            for (var i = 0; i < bills.length; i++) {
                billIds.push(String(bills[i].id));
            }
            this.setData({
                selectedBills: billIds
            });
        }
        this.calculateTotals();
    },

    onSubmit() {
        const { selectedBills } = this.data;
        if (selectedBills.length === 0) {
            wx.showToast({
                title: '请选择要支付的账单',
                icon: 'none'
            });
            return;
        }

        const token = this.getUserToken();
        if (!token) {
            wx.showToast({
                title: '请先登录',
                icon: 'none'
            });
            return;
        }

        wx.showLoading({ title: '支付中...' });

        // 批量支付：循环调用单个账单支付接口
        const payPromises = selectedBills.map(billId => {
            return new Promise((resolve, reject) => {
                wx.request({
                    url: API_BASE_URL + '/property/bills/' + billId + '/pay',
                    method: 'POST',
                    data: {
                        payment_method: 'wechat',
                        payment_reference: ''
                    },
                    header: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    },
                    success: (res) => {
                        if (res.statusCode === 200 && res.data.code === 200) {
                            resolve(res.data);
                        } else {
                            reject(res.data?.message || '支付失败');
                        }
                    },
                    fail: (err) => {
                        reject(err.errMsg || '网络错误');
                    }
                });
            });
        });

        // 等待所有支付请求完成
        Promise.all(payPromises).then(results => {
            wx.hideLoading();
            wx.showToast({
                title: '支付成功',
                icon: 'success'
            });
            // 清空选择并重新加载账单
            this.setData({ selectedBills: [] });
            this.loadBills();
        }).catch(error => {
            wx.hideLoading();
            wx.showToast({
                title: error || '支付失败',
                icon: 'none'
            });
            // 支付失败后也重新加载账单，因为可能有部分成功
            this.loadBills();
        });
    },

    onPayClick(e) {
        const billId = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: '/pages/payment/receipt?id=' + billId
        });
    }
});