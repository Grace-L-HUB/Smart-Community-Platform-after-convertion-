// pages/services/visitor/visitor.ts
import { API_BASE_URL } from '../../../config/api'

Page({
    data: {
        activeTab: 0,
        visitors: [],
        visitorName: '',
        visitorPhone: '',
        carNumber: '',
        visitTime: '',
        remark: '',
        showPicker: false,
        currentDate: new Date().getTime(),
        minDate: new Date().getTime(),
        formatter: null as any,
        loading: false
    },

    onLoad() {
        // 初始化时间设置
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0); // 设置为明天0点
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 设置为今天0点
        
        this.setData({
            currentDate: tomorrow.getTime(),
            minDate: today.getTime(),
            formatter: this.dateFormatter
        });
        
        // 加载访客列表
        this.loadVisitorList();
    },

    onShow() {
        // 页面显示时刷新访客列表
        this.loadVisitorList();
    },

    // 加载访客列表
    loadVisitorList() {
        const userInfo = wx.getStorageSync('userInfo');
        if (!userInfo || !userInfo.user_id) {
            console.warn('用户未登录，无法加载访客列表');
            return;
        }

        wx.request({
            url: `${API_BASE_URL}/property/visitor/list`,
            method: 'GET',
            data: {
                user_id: userInfo.user_id
            },
            header: {
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`,
                'content-type': 'application/json'
            },
            success: (res: any) => {
                console.log('访客列表响应:', res.data);
                if (res.statusCode === 200 && res.data.code === 200) {
                    const visitors = res.data.data.map((visitor: any) => ({
                        id: visitor.id,
                        name: visitor.name,
                        phone: visitor.phone,
                        visitTime: visitor.visit_time,
                        carNumber: visitor.car_number || '',
                        status: visitor.status,
                        statusText: visitor.status_text
                    }));
                    
                    this.setData({ visitors });
                } else {
                    console.error('获取访客列表失败:', res.data.message);
                    wx.showToast({ 
                        title: res.data.message || '获取访客列表失败', 
                        icon: 'none' 
                    });
                }
            },
            fail: (err) => {
                console.error('获取访客列表网络请求失败:', err);
                wx.showToast({ 
                    title: '网络请求失败', 
                    icon: 'none' 
                });
            }
        });
    },

    // 日期格式化函数，添加单位显示
    dateFormatter(type: string, value: string) {
        if (type === 'year') {
            return value + '年';
        } else if (type === 'month') {
            return value + '月';
        } else if (type === 'day') {
            return value + '日';
        }
        return value;
    },

    onTabChange(event: any) {
        this.setData({ activeTab: event.detail.index });
    },

    onNameChange(event: any) {
        this.setData({ visitorName: event.detail });
    },

    onPhoneChange(event: any) {
        this.setData({ visitorPhone: event.detail });
    },

    onCarChange(event: any) {
        this.setData({ carNumber: event.detail });
    },

    onRemarkChange(event: any) {
        this.setData({ remark: event.detail });
    },

    showTimePicker() {
        console.log('打开日期选择器');
        console.log('当前数据状态:', {
            currentDate: this.data.currentDate,
            minDate: this.data.minDate,
            visitTime: this.data.visitTime
        });
        
        // 如果还没有选择日期，使用明天作为默认值
        if (!this.data.visitTime) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            this.setData({
                currentDate: tomorrow.getTime()
            });
        } else {
            // 如果已有选择的日期，解析并设置为当前日期
            try {
                const existingDate = new Date(this.data.visitTime);
                if (!isNaN(existingDate.getTime())) {
                    existingDate.setHours(0, 0, 0, 0);
                    this.setData({
                        currentDate: existingDate.getTime()
                    });
                }
            } catch (error) {
                console.error('解析已有日期失败:', error);
            }
        }
        
        this.setData({ showPicker: true });
        
        // 延迟一下确保组件完全渲染
        setTimeout(() => {
            console.log('日期选择器已打开');
        }, 100);
    },

    closeTimePicker() {
        console.log('关闭时间选择器');
        this.setData({ showPicker: false });
    },

    onTimeConfirm(event: any) {
        console.log('日期选择确认:', event.detail);
        
        try {
            // Vant WeApp date-picker 返回的是时间戳
            let timestamp = event.detail;
            
            // 如果是对象，尝试获取时间戳
            if (typeof timestamp === 'object' && timestamp !== null) {
                timestamp = timestamp.getTime ? timestamp.getTime() : new Date(timestamp).getTime();
            }
            
            const date = new Date(timestamp);
            
            // 检查日期是否有效
            if (isNaN(date.getTime())) {
                wx.showToast({ title: '日期格式错误', icon: 'none' });
                return;
            }
            
            // 检查是否是今天或未来日期
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);
            
            if (date.getTime() < today.getTime()) {
                wx.showToast({ title: '请选择今天或未来日期', icon: 'none' });
                return;
            }
            
            // 格式化为 YYYY-MM-DD 格式
            const visitTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            
            console.log('格式化的访问日期:', visitTime);
            
            this.setData({ 
                visitTime, 
                showPicker: false,
                currentDate: timestamp  // 更新当前选择的日期
            });
            
        } catch (error) {
            console.error('日期处理错误:', error);
            wx.showToast({ title: '日期选择失败', icon: 'none' });
        }
    },

    onInvite() {
        const { visitorName, visitorPhone, visitTime, carNumber, remark, loading } = this.data;
        
        if (!visitorName || !visitorPhone || !visitTime) {
            wx.showToast({ title: '请填写访客姓名、手机号和访问日期', icon: 'none' });
            return;
        }

        if (loading) {
            return; // 防止重复提交
        }

        const userInfo = wx.getStorageSync('userInfo');
        if (!userInfo || !userInfo.user_id) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        this.setData({ loading: true });
        wx.showLoading({ title: '发送中...' });

        const requestData = {
            user_id: userInfo.user_id,
            name: visitorName,
            phone: visitorPhone,
            visit_time: visitTime,
            car_number: carNumber || '',
            remark: remark || ''
        };

        console.log('发送访客邀请请求:', requestData);

        wx.request({
            url: `${API_BASE_URL}/property/visitor/invite`,
            method: 'POST',
            data: requestData,
            header: {
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`,
                'content-type': 'application/json'
            },
            success: (res: any) => {
                console.log('创建访客邀请响应:', res.data);
                wx.hideLoading();
                
                if (res.statusCode === 200 && res.data.code === 200) {
                    wx.showToast({ title: '邀请创建成功', icon: 'success' });
                    
                    // 清空表单并切换到访客记录页面
                    this.setData({ 
                        visitorName: '', 
                        visitorPhone: '', 
                        carNumber: '', 
                        visitTime: '', 
                        remark: '', 
                        activeTab: 0 
                    });
                    
                    // 刷新访客列表
                    this.loadVisitorList();
                } else {
                    wx.showToast({ 
                        title: res.data.message || '创建邀请失败', 
                        icon: 'none' 
                    });
                }
            },
            fail: (err) => {
                console.error('创建访客邀请失败:', err);
                wx.hideLoading();
                wx.showToast({ 
                    title: '网络请求失败', 
                    icon: 'none' 
                });
            },
            complete: () => {
                this.setData({ loading: false });
            }
        });
    },

    onShowQR(event: any) {
        const id = event.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/qrcode/qrcode?type=visitor&id=${id}` });
    },

    onCancel(event: any) {
        const visitorId = event.currentTarget.dataset.id;
        const userInfo = wx.getStorageSync('userInfo');
        
        if (!userInfo || !userInfo.user_id) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        wx.showModal({
            title: '确认取消',
            content: '确定要取消这条访客邀请吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.showLoading({ title: '取消中...' });
                    
                    wx.request({
                        url: `${API_BASE_URL}/property/visitor/${visitorId}/status`,
                        method: 'PATCH',
                        data: {
                            action: 'cancel',
                            user_id: userInfo.user_id
                        },
                        header: {
                            'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`,
                            'content-type': 'application/json'
                        },
                        success: (res: any) => {
                            console.log('取消访客邀请响应:', res.data);
                            wx.hideLoading();
                            
                            if (res.statusCode === 200 && res.data.code === 200) {
                                wx.showToast({ title: '已取消', icon: 'success' });
                                // 刷新访客列表
                                this.loadVisitorList();
                            } else {
                                wx.showToast({ 
                                    title: res.data.message || '取消失败', 
                                    icon: 'none' 
                                });
                            }
                        },
                        fail: (err) => {
                            console.error('取消访客邀请失败:', err);
                            wx.hideLoading();
                            wx.showToast({ 
                                title: '网络请求失败', 
                                icon: 'none' 
                            });
                        }
                    });
                }
            }
        });
    }
});
