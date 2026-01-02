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
        this.loadBills()
    },

    loadBills() {
        this.setData({ loading: true })
        
        const userInfo = wx.getStorageSync('userInfo') || {}
        const userId = userInfo.user_id || userInfo.id
        
        wx.request({
            url: API_BASE_URL + '/property/bills',
            method: 'GET',
            data: {
                user_id: userId
            },
            header: {
                'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    const bills = res.data.data || []
                    for (var i = 0; i < bills.length; i++) {
                        bills[i].fee_type = bills[i].fee_type || 'primary'
                    }
                    
                    let houseInfo = null
                    if (bills.length > 0 && bills[0].house_info) {
                        houseInfo = bills[0].house_info
                    }
                    
                    this.setData({
                        bills: bills,
                        houseInfo: houseInfo,
                        loading: false
                    })
                    
                    this.calculateTotals()
                } else {
                    wx.showToast({ title: res.data.message || '加载失败', icon: 'none' })
                    this.setData({ loading: false })
                }
            },
            fail: () => {
                wx.showToast({ title: '网络错误', icon: 'none' })
                this.setData({ loading: false })
            }
        })
    },

    calculateTotals() {
        const { bills, selectedBills } = this.data
        
        if (!Array.isArray(bills)) {
            return
        }
        
        const selectedBillObjects = bills.filter(function(bill) {
            return selectedBills.indexOf(bill.id) !== -1
        })
        var totalAmount = 0
        for (var i = 0; i < selectedBillObjects.length; i++) {
            totalAmount += selectedBillObjects[i].amount || 0
        }
        
        const overdueBills = bills.filter(function(bill) {
            return bill.is_overdue
        })
        const hasOverdueBills = overdueBills.length > 0
        
        this.setData({
            totalAmount: totalAmount * 100,
            hasOverdueBills: hasOverdueBills,
            overdueBillsCount: overdueBills.length
        })
    },

    onBillChange(e) {
        this.setData({
            selectedBills: e.detail
        })
        this.calculateTotals()
    },

    onRefresh() {
        this.loadBills()
    },

    selectAll() {
        const { selectedBills, bills } = this.data
        if (selectedBills.length === bills.length) {
            this.setData({
                selectedBills: []
            })
        } else {
            var billIds = []
            for (var i = 0; i < bills.length; i++) {
                billIds.push(bills[i].id)
            }
            this.setData({
                selectedBills: billIds
            })
        }
    },

    onSubmit() {
        const { selectedBills } = this.data
        if (selectedBills.length === 0) {
            wx.showToast({
                title: '请选择要支付的账单',
                icon: 'none'
            })
            return
        }

        wx.showLoading({ title: '支付中...' })
        
        setTimeout(() => {
            wx.hideLoading()
            wx.showToast({
                title: '支付成功',
                icon: 'success'
            })
            this.loadBills()
        }, 1500)
    },

    onPayClick(e) {
        const billId = e.currentTarget.dataset.id
        wx.navigateTo({
            url: '/pages/payment/receipt?id=' + billId
        })
    }
});
