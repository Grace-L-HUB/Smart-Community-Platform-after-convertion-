const { API_BASE_URL } = require('../../config/api')

Page({
    data: {
        repairs: [],
        loading: false,
        // 搜索相关
        keyword: '',
        // 筛选相关
        statusFilter: 0,
        typeFilter: 0,
        statusOptions: [
            { text: '全部状态', value: 0 },
            { text: '待处理', value: 1 },
            { text: '处理中', value: 2 },
            { text: '已完成', value: 3 }
        ],
        typeOptions: [
            { text: '全部类型', value: 0 },
            { text: '水电维修', value: 1 },
            { text: '家电维修', value: 2 },
            { text: '管道疏通', value: 3 },
            { text: '其他', value: 4 }
        ],
        // 工单列表
        orderList: [],
        hasMore: false,
        // 详情弹窗
        showDetail: false,
        selectedOrder: null,
        // 评价
        rating: 0,
        ratingComment: ''
    },

    onLoad() {
        this.loadRepairs()
    },

    loadRepairs() {
        const userInfo = wx.getStorageSync('userInfo')
        if (!userInfo || !userInfo.user_id) {
            wx.showToast({ title: '请先登录', icon: 'none' })
            return
        }

        this.setData({ loading: true })

        wx.request({
            url: API_BASE_URL + '/property/repair-orders',
            method: 'GET',
            data: {
                user_id: userInfo.user_id
            },
            header: {
                'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    this.setData({
                        repairs: res.data.data.list || [],
                        orderList: res.data.data.list || [],
                        loading: false
                    })
                } else {
                    wx.showToast({ title: '加载失败', icon: 'none' })
                    this.setData({ loading: false })
                }
            },
            fail: () => {
                wx.showToast({ title: '网络错误', icon: 'none' })
                this.setData({ loading: false })
            }
        })
    },

    // 搜索
    onSearch(e) {
        this.setData({ keyword: e.detail })
        this.filterOrders()
    },

    onSearchChange(e) {
        this.setData({ keyword: e.detail })
    },

    // 筛选
    onStatusFilterChange(e) {
        this.setData({ statusFilter: e.detail })
        this.filterOrders()
    },

    onTypeFilterChange(e) {
        this.setData({ typeFilter: e.detail })
        this.filterOrders()
    },

    // 筛选订单
    filterOrders() {
        const { repairs, keyword, statusFilter, typeFilter } = this.data
        let filtered = [...repairs]

        // 关键词搜索
        if (keyword) {
            filtered = filtered.filter(order =>
                order.order_no.includes(keyword) ||
                order.location.includes(keyword)
            )
        }

        // 状态筛选
        if (statusFilter > 0) {
            const statusMap = { 1: 'pending', 2: 'processing', 3: 'completed' }
            filtered = filtered.filter(order => order.status === statusMap[statusFilter])
        }

        // 类型筛选
        if (typeFilter > 0) {
            const typeMap = { 1: 'water_electric', 2: 'appliance', 3: 'plumbing', 4: 'other' }
            filtered = filtered.filter(order => order.repair_type === typeMap[typeFilter])
        }

        this.setData({ orderList: filtered })
    },

    // 点击订单
    onOrderTap(e) {
        const order = e.currentTarget.dataset.order
        this.setData({
            selectedOrder: order,
            showDetail: true,
            rating: order.rating || 0,
            ratingComment: order.rating_comment || ''
        })
    },

    // 关闭详情
    closeDetail() {
        this.setData({ showDetail: false })
    },

    // 评价
    onRatingChange(e) {
        this.setData({ rating: e.detail })
    },

    onRatingCommentChange(e) {
        this.setData({ ratingComment: e.detail })
    },

    submitRating() {
        const { selectedOrder, rating, ratingComment } = this.data
        if (!rating) {
            wx.showToast({ title: '请选择评分', icon: 'none' })
            return
        }

        // TODO: 提交评价到后端
        wx.showToast({ title: '评价提交成功', icon: 'success' })
        this.closeDetail()
    },

    // 新报修
    goToRepair() {
        wx.navigateTo({ url: '/pages/repair/repair' })
    },

    // 加载更多
    loadMore() {
        // TODO: 实现分页加载
        wx.showToast({ title: '没有更多数据了', icon: 'none' })
    }
});
