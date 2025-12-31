import { API_BASE_URL } from '../../../config/api'

Page({
    data: {
        services: [] as any[],
        serviceNames: [] as string[],
        selectedService: '',
        selectedServiceId: 0,
        serviceTime: '',
        address: '',
        phone: '',
        remark: '',
        showService: false,
        showTime: false,
        currentDate: new Date().getTime(),
        minDate: new Date().getTime(),
        loading: true,
        submitting: false,
        merchants: [] as any[]
    },

    onLoad() {
        this.loadHousekeepingServices()
    },

    // 加载家政服务项目（从后端获取明码标价）
    loadHousekeepingServices() {
        this.setData({ loading: true })

        wx.request({
            url: `${API_BASE_URL}/merchant/products/public/housekeeping/`,
            method: 'GET',
            success: (res: any) => {
                console.log('家政服务数据:', res.data)
                if (res.statusCode === 200 && res.data.success) {
                    const services = res.data.data.map((product: any) => ({
                        id: product.id,
                        name: product.name,
                        price: parseFloat(product.price),
                        originalPrice: parseFloat(product.original_price || '0'),
                        description: product.description,
                        icon: product.image_url || '',
                        merchantId: product.merchant_id
                    }))

                    const serviceNames = services.map((s: any) => s.name)

                    this.setData({
                        services,
                        serviceNames,
                        loading: false
                    })
                } else {
                    // 如果获取失败，使用默认数据
                    this.setDefaultServices()
                }
            },
            fail: () => {
                // 网络失败时使用默认数据
                this.setDefaultServices()
            }
        })
    },

    // 设置默认服务数据
    setDefaultServices() {
        const defaultServices = [
            { id: 1, name: '日常保洁', price: 80, originalPrice: 100, description: '日常家庭卫生清洁', icon: '', merchantId: 1 },
            { id: 2, name: '深度清洁', price: 150, originalPrice: 200, description: '全面深度清洁服务', icon: '', merchantId: 1 },
            { id: 3, name: '家电清洗', price: 100, originalPrice: 120, description: '各类家电清洗保养', icon: '', merchantId: 1 },
            { id: 4, name: '开荒保洁', price: 200, originalPrice: 250, description: '新房装修后开荒保洁', icon: '', merchantId: 1 },
            { id: 5, name: '家具维修', price: 120, originalPrice: 150, description: '家具维修与保养', icon: '', merchantId: 1 },
            { id: 6, name: '管道疏通', price: 80, originalPrice: 100, description: '各类管道疏通服务', icon: '', merchantId: 1 }
        ]
        this.setData({
            services: defaultServices,
            serviceNames: defaultServices.map(s => s.name),
            loading: false
        })
    },

    onServiceClick(e: any) {
        const id = e.currentTarget.dataset.id;
        const service = this.data.services.find(s => s.id === id);
        if (service) {
            this.setData({ 
                selectedService: service.name,
                selectedServiceId: service.id 
            });
        }
    },

    showServicePicker() { 
        this.setData({ showService: true }); 
    },

    closeServicePicker() { 
        this.setData({ showService: false }); 
    },

    onServiceConfirm(e: any) {
        const selectedName = e.detail.value
        const service = this.data.services.find(s => s.name === selectedName)
        this.setData({ 
            selectedService: selectedName, 
            selectedServiceId: service ? service.id : 0,
            showService: false 
        });
    },

    showTimePicker() { 
        this.setData({ showTime: true }); 
    },

    closeTimePicker() { 
        this.setData({ showTime: false }); 
    },

    onTimeConfirm(e: any) {
        const d = new Date(e.detail);
        this.setData({ 
            serviceTime: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, 
            showTime: false 
        });
    },

    onAddressChange(e: any) { 
        this.setData({ address: e.detail }); 
    },

    onPhoneChange(e: any) { 
        this.setData({ phone: e.detail }); 
    },

    onRemarkChange(e: any) { 
        this.setData({ remark: e.detail }); 
    },

    // 提交服务预约订单
    onSubmit() {
        const { selectedService, selectedServiceId, serviceTime, address, phone } = this.data;
        
        if (!selectedService || !serviceTime || !address || !phone || !selectedServiceId) {
            wx.showToast({ title: '请填写必填项', icon: 'none' });
            return;
        }

        this.setData({ submitting: true })

        // 获取当前选择的服务信息
        const selectedServiceInfo = this.data.services.find(s => s.id === selectedServiceId)
        if (!selectedServiceInfo) {
            wx.showToast({ title: '服务信息错误', icon: 'none' })
            return
        }

        const token = wx.getStorageSync('token')
        const userInfo = wx.getStorageSync('userInfo')

        // 构建订单数据
        const orderData = {
            merchant_id: selectedServiceInfo.merchantId,
            contact_name: userInfo?.display_name || userInfo?.nickname || '',
            contact_phone: phone,
            pickup_type: 'delivery',
            address: address,
            note: `服务时间: ${serviceTime}${this.data.remark ? `, 备注: ${this.data.remark}` : ''}`,
            order_items: [{
                product_id: selectedServiceId,
                product_name: selectedServiceInfo.name,
                price: selectedServiceInfo.price,
                quantity: 1
            }]
        }

        console.log('提交家政服务订单:', orderData)

        wx.request({
            url: `${API_BASE_URL}/merchant/orders/create/`,
            method: 'POST',
            data: orderData,
            header: {
                'Authorization': `Bearer ${token || ''}`,
                'content-type': 'application/json'
            },
            success: (res: any) => {
                console.log('订单提交响应:', res)
                if (res.statusCode >= 200 && res.statusCode < 300 && res.data.success) {
                    wx.showToast({ 
                        title: '预约成功', 
                        icon: 'success' 
                    });
                    setTimeout(() => {
                        wx.navigateBack()
                    }, 1500)
                } else {
                    wx.showToast({ 
                        title: res.data.message || '预约失败', 
                        icon: 'none' 
                    });
                }
            },
            fail: () => {
                wx.showToast({ title: '网络请求失败', icon: 'none' });
            },
            complete: () => {
                this.setData({ submitting: false });
            }
        })
    }
});
