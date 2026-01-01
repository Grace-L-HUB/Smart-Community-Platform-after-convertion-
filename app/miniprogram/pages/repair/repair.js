const { API_BASE_URL } = require('../../config/api')

Page({
    data: {
        category: 'public',
        typeText: '',
        typeValue: '',
        priority: 'low',
        locationHint: '请选择报修位置',
        location: '',
        summary: '',
        description: '',
        contactHint: '请填写联系信息',
        reporterName: '',
        reporterPhone: '',
        fileList: [],
        showTypePicker: false,
        typeOptions: [
            { text: '水电', value: 'water' },
            { text: '电气', value: 'electric' },
            { text: '门窗', value: 'door' },
            { text: '公区', value: 'public' },
            { text: '其他', value: 'other' }
        ],
        loading: false
    },

    onLoad() {
        this.loadUserHouses()
    },

    loadUserHouses() {
        const userInfo = wx.getStorageSync('userInfo')
        if (userInfo && userInfo.user_id) {
            wx.request({
                url: API_BASE_URL + '/property/house/my-houses?user_id=' + userInfo.user_id,
                method: 'GET',
                success: (res) => {
                    if (res.statusCode === 200 && res.data.code === 200) {
                        const houses = res.data.data || []
                        if (houses.length > 0) {
                            const house = houses[0]
                            const locationText = house.house_info ? 
                                house.house_info.building_name + ' ' + house.house_info.unit_name + ' ' + house.house_info.room_number : ''
                            this.setData({
                                location: locationText,
                                locationHint: '已自动选择您的房屋'
                            })
                        }
                    }
                }
            })
        }
    },

    onCategoryChange(e) {
        this.setData({
            category: e.detail
        })
    },

    showTypePickerFn() {
        this.setData({
            showTypePicker: true
        })
    },

    onTypeConfirm(e) {
        const selected = e.detail
        let value = selected.value
        
        if (typeof value === 'object' && value !== null) {
            value = value.value || value.text || ''
        }
        
        const text = selected.text || this.data.typeOptions.find(opt => opt.value === value)?.text || ''
        
        console.log('选择的类型:', { selected, value, text })
        
        this.setData({
            typeValue: value,
            typeText: text,
            showTypePicker: false
        })
    },

    onTypeCancel() {
        this.setData({
            showTypePicker: false
        })
    },

    onPriorityChange(e) {
        this.setData({
            priority: e.detail
        })
    },

    onLocationChange(e) {
        this.setData({
            location: e.detail
        })
    },

    onSummaryChange(e) {
        this.setData({
            summary: e.detail
        })
    },

    onDescriptionChange(e) {
        this.setData({
            description: e.detail
        })
    },

    onReporterNameChange(e) {
        this.setData({
            reporterName: e.detail
        })
    },

    onReporterPhoneChange(e) {
        this.setData({
            reporterPhone: e.detail
        })
    },

    afterRead(e) {
        const { file } = e.detail
        const fileList = this.data.fileList.concat(file)
        this.setData({ fileList })
    },

    deleteFile(e) {
        const { index } = e.detail
        const fileList = this.data.fileList
        fileList.splice(index, 1)
        this.setData({ fileList })
    },

    onSubmit() {
        const userInfo = wx.getStorageSync('userInfo')
        if (!userInfo || !userInfo.user_id) {
            wx.showToast({ title: '请先登录', icon: 'none' })
            return
        }

        if (!this.data.typeValue) {
            wx.showToast({ title: '请选择报修类型', icon: 'none' })
            return
        }

        if (!this.data.location) {
            wx.showToast({ title: '请输入报修位置', icon: 'none' })
            return
        }

        if (!this.data.summary) {
            wx.showToast({ title: '请输入问题摘要', icon: 'none' })
            return
        }

        if (!this.data.description) {
            wx.showToast({ title: '请输入详细描述', icon: 'none' })
            return
        }

        if (!this.data.reporterName) {
            wx.showToast({ title: '请输入您的姓名', icon: 'none' })
            return
        }

        if (!this.data.reporterPhone) {
            wx.showToast({ title: '请输入您的手机号', icon: 'none' })
            return
        }

        this.setData({ loading: true })

        let repairType = this.data.typeValue
        if (typeof repairType === 'object' && repairType !== null) {
            repairType = repairType.value || repairType.text || ''
        }

        const requestData = {
            user_id: userInfo.user_id,
            category: this.data.category,
            repair_type: repairType,
            priority: this.data.priority,
            location: this.data.location,
            summary: this.data.summary,
            description: this.data.description,
            reporter_name: this.data.reporterName,
            reporter_phone: this.data.reporterPhone,
            images: this.data.fileList.map(file => ({
                image: file.url,
                image_type: 'image'
            }))
        }
        
        console.log('提交报修数据:', requestData)

        wx.request({
            url: API_BASE_URL + '/property/repair-orders',
            method: 'POST',
            data: {
                user_id: userInfo.user_id,
                category: this.data.category,
                repair_type: this.data.typeValue,
                priority: this.data.priority,
                location: this.data.location,
                summary: this.data.summary,
                description: this.data.description,
                reporter_name: this.data.reporterName,
                reporter_phone: this.data.reporterPhone,
                images: this.data.fileList.map(file => ({
                    image: file.url,
                    image_type: 'image'
                }))
            },
            header: {
                'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
            },
            success: (res) => {
                if (res.statusCode === 200 && res.data.code === 200) {
                    wx.showToast({ title: '提交成功', icon: 'success' })
                    setTimeout(() => {
                        wx.navigateBack()
                    }, 1500)
                } else {
                    console.log('提交失败:', res.data)
                    const errorMsg = res.data.message || '提交失败'
                    if (res.data.errors) {
                        console.log('验证错误:', res.data.errors)
                    }
                    wx.showToast({ title: errorMsg, icon: 'none' })
                }
                this.setData({ loading: false })
            },
            fail: () => {
                wx.showToast({ title: '网络错误', icon: 'none' })
                this.setData({ loading: false })
            }
        })
    }
});
