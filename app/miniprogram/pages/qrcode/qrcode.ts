// @ts-ignore
const drawQrcode = require('../../miniprogram_npm/weapp-qrcode-canvas-2d/index.js')

const API_BASE_URL = 'http://127.0.0.1:8000/api'

Page({
    data: {
        type: 'identity',
        identityToken: '',
        title: '业主身份码',
        description: '请向门岗出示此码',
        userInfo: {
            name: '',
            room: '',
            phone: ''
        },
        // 访客相关
        visitorId: '',
        visitorInfo: {
            name: '',
            phone: '',
            visitTime: ''
        },
        // 倒计时相关
        countdown: 60,
        validTime: '',
        countdownTimer: null as any,
        loading: false,
        canvasId: 'qrcode-canvas'
    },

    onLoad(options: any) {
        if (options.type) {
            this.setData({ type: options.type });
            
            if (options.type === 'visitor') {
                // 访客二维码
                this.setData({ 
                    visitorId: options.id || '',
                    title: '访客通行码',
                    description: '请向门岗出示此码通行'
                });
                this.initVisitorInfo();
            } else {
                // 身份码
                this.initUserInfo();
            }
        } else {
            this.initUserInfo();
        }
    },

    onReady() {
        // 页面渲染完成后再生成二维码
        // 但对于访客二维码，需要等待获取访客信息后再生成
        if (this.data.type !== 'visitor') {
            setTimeout(() => {
                this.generateNewQRCode();
            }, 300); // 稍微延迟确保Canvas元素完全准备好
        }
        // 访客二维码会在 initVisitorInfo 完成后生成
    },

    onUnload() {
        // 清除定时器
        if (this.data.countdownTimer) {
            clearInterval(this.data.countdownTimer);
        }
    },

    // 初始化用户信息
    initUserInfo() {
        const userInfo = wx.getStorageSync('userInfo');
        if (!userInfo || !userInfo.user_id) {
            wx.showModal({
                title: '提示',
                content: '请先登录',
                showCancel: false,
                success: () => {
                    wx.reLaunch({
                        url: '/pages/login/login'
                    });
                }
            });
            return;
        }

        this.setData({
            userInfo: {
                name: userInfo.display_name || userInfo.nickname || '用户',
                phone: userInfo.phone || '',
                room: userInfo.full_address || '暂未绑定房屋'
            }
        });
    },

    // 初始化访客信息
    initVisitorInfo() {
        const userInfo = wx.getStorageSync('userInfo');
        if (!userInfo || !userInfo.user_id) {
            wx.showModal({
                title: '提示',
                content: '请先登录',
                showCancel: false,
                success: () => {
                    wx.reLaunch({
                        url: '/pages/login/login'
                    });
                }
            });
            return;
        }

        // 获取访客详情
        this.getVisitorDetail();
    },

    // 获取访客详情
    getVisitorDetail() {
        const userInfo = wx.getStorageSync('userInfo');
        
        wx.request({
            url: `${API_BASE_URL}/property/visitor/${this.data.visitorId}`,
            method: 'GET',
            data: {
                user_id: userInfo.user_id
            },
            header: {
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`,
                'content-type': 'application/json'
            },
            success: (res: any) => {
                console.log('获取访客详情响应:', res.data);
                if (res.statusCode === 200 && res.data.code === 200) {
                    const visitor = res.data.data;
                    this.setData({
                        visitorInfo: {
                            name: visitor.name,
                            phone: visitor.phone,
                            visitTime: visitor.visit_time
                        }
                    });
                    
                    // 获取访客信息成功后，生成二维码
                    setTimeout(() => {
                        this.generateNewQRCode();
                    }, 500);
                } else {
                    wx.showToast({ 
                        title: res.data.message || '获取访客信息失败', 
                        icon: 'none' 
                    });
                }
            },
            fail: (err) => {
                console.error('获取访客详情失败:', err);
                wx.showToast({ 
                    title: '网络请求失败', 
                    icon: 'none' 
                });
            }
        });
    },

    // 生成新的二维码
    generateNewQRCode() {
        if (this.data.type === 'visitor') {
            this.generateVisitorQRCode();
        } else {
            this.generateIdentityQRCode();
        }
    },

    // 生成身份码二维码
    generateIdentityQRCode() {
        this.setData({ loading: true });
        
        const userInfo = wx.getStorageSync('userInfo');
        if (!userInfo || !userInfo.user_id) {
            wx.showToast({ title: '用户信息获取失败', icon: 'none' });
            return;
        }

        // 调用后端API获取动态身份码
        wx.request({
            url: `${API_BASE_URL}/user/identity-code`,
            method: 'GET',
            data: {
                user_id: userInfo.user_id
            },
            header: {
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`,
                'content-type': 'application/json'
            },
            success: (res: any) => {
                console.log('获取身份码响应:', res.data);
                if (res.statusCode === 200 && res.data.code === 200) {
                    const { token, valid_seconds } = res.data.data;
                    
                    this.setData({
                        identityToken: token,
                        countdown: valid_seconds || 60,
                        loading: false
                    });
                    
                    // 绘制二维码
                    this.drawQRCode(token);
                    
                    // 启动倒计时
                    this.startCountdown();
                } else {
                    wx.showToast({ 
                        title: res.data.message || '获取身份码失败', 
                        icon: 'none' 
                    });
                    this.setData({ loading: false });
                }
            },
            fail: (err) => {
                console.error('获取身份码失败:', err);
                wx.showToast({ 
                    title: '网络请求失败', 
                    icon: 'none' 
                });
                this.setData({ loading: false });
            }
        });
    },

    // 生成访客二维码
    generateVisitorQRCode() {
        this.setData({ loading: true });
        
        const userInfo = wx.getStorageSync('userInfo');
        if (!userInfo || !userInfo.user_id) {
            wx.showToast({ title: '用户信息获取失败', icon: 'none' });
            return;
        }

        // 调用后端API获取访客二维码
        wx.request({
            url: `${API_BASE_URL}/property/visitor/${this.data.visitorId}/qrcode`,
            method: 'GET',
            data: {
                user_id: userInfo.user_id
            },
            header: {
                'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`,
                'content-type': 'application/json'
            },
            success: (res: any) => {
                console.log('获取访客二维码响应:', res.data);
                if (res.statusCode === 200 && res.data.code === 200) {
                    const { qr_code_text, expires_at, visitor_info } = res.data.data;
                    
                    // 计算剩余有效时间（秒）
                    const expiresTime = new Date(expires_at).getTime();
                    const currentTime = new Date().getTime();
                    const remainingSeconds = Math.max(0, Math.floor((expiresTime - currentTime) / 1000));
                    
                    this.setData({
                        identityToken: qr_code_text,
                        countdown: remainingSeconds,
                        loading: false,
                        visitorInfo: {
                            name: visitor_info.name,
                            phone: visitor_info.phone,
                            visitTime: visitor_info.visit_time
                        }
                    });
                    
                    // 绘制二维码
                    this.drawQRCode(qr_code_text);
                    
                    // 启动倒计时
                    if (remainingSeconds > 0) {
                        this.startCountdown();
                    } else {
                        this.setData({ validTime: '已过期' });
                    }
                } else {
                    wx.showToast({ 
                        title: res.data.message || '获取访客二维码失败', 
                        icon: 'none' 
                    });
                    this.setData({ loading: false });
                }
            },
            fail: (err) => {
                console.error('获取访客二维码失败:', err);
                wx.showToast({ 
                    title: '网络请求失败', 
                    icon: 'none' 
                });
                this.setData({ loading: false });
            }
        });
    },

    // 绘制二维码
    drawQRCode(text: string) {
        const canvasId = this.data.canvasId;
        
        // 使用 wx.createSelectorQuery 获取 Canvas 2D 实例
        const query = wx.createSelectorQuery();
        query.select(`#${canvasId}`)
            .fields({ node: true, size: true })
            .exec((res) => {
                if (res && res[0] && res[0].node) {
                    const canvas = res[0].node;
                    const ctx = canvas.getContext('2d');
                    
                    // 设置画布尺寸
                    const dpr = wx.getSystemInfoSync().pixelRatio;
                    canvas.width = 200 * dpr;
                    canvas.height = 200 * dpr;
                    ctx.scale(dpr, dpr);
                    
                    // 使用库绘制二维码
                    drawQrcode({
                        canvas: canvas,
                        text: text,
                        width: 200,
                        height: 200,
                        typeNumber: 4,
                        correctLevel: 1,
                        background: '#ffffff',
                        foreground: '#000000',
                        success: () => {
                            console.log('二维码绘制成功');
                        },
                        fail: (error: any) => {
                            console.error('二维码绘制失败:', error);
                            wx.showToast({ title: '二维码生成失败', icon: 'none' });
                        }
                    });
                } else {
                    console.error('Canvas 元素获取失败');
                    wx.showToast({ title: '画布初始化失败', icon: 'none' });
                }
            });
    },

    // 格式化倒计时显示
    formatCountdown(seconds: number): string {
        if (this.data.type === 'visitor') {
            // 访客二维码显示更友好的时间单位
            if (seconds > 86400) { // 超过1天
                const days = Math.floor(seconds / 86400);
                const hours = Math.floor((seconds % 86400) / 3600);
                return `${days}天${hours > 0 ? hours + '小时' : ''}`;
            } else if (seconds > 3600) { // 超过1小时
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`;
            } else if (seconds > 60) { // 超过1分钟
                const minutes = Math.floor(seconds / 60);
                return `${minutes}分钟`;
            } else {
                return `${seconds}秒`;
            }
        } else {
            // 身份码保持原来的秒显示
            return `${seconds}秒`;
        }
    },

    // 启动倒计时
    startCountdown() {
        // 清除之前的定时器
        if (this.data.countdownTimer) {
            clearInterval(this.data.countdownTimer);
        }

        // 初始显示
        this.setData({ 
            validTime: this.formatCountdown(this.data.countdown)
        });

        const timer = setInterval(() => {
            const countdown = this.data.countdown - 1;
            
            if (countdown <= 0) {
                // 倒计时结束
                clearInterval(this.data.countdownTimer);
                this.setData({ 
                    countdownTimer: null,
                    validTime: this.data.type === 'visitor' ? '已过期' : '已过期，正在重新生成...'
                });
                
                // 身份码自动重新生成，访客码不重新生成
                if (this.data.type !== 'visitor') {
                    setTimeout(() => {
                        this.generateNewQRCode();
                    }, 1000);
                }
            } else {
                this.setData({ 
                    countdown: countdown,
                    validTime: this.formatCountdown(countdown)
                });
            }
        }, 1000);

        this.setData({ countdownTimer: timer });
    },

    // 手动刷新
    onRefresh() {
        if (this.data.loading) return; // 防止重复点击
        
        // 清除当前倒计时
        if (this.data.countdownTimer) {
            clearInterval(this.data.countdownTimer);
            this.setData({ countdownTimer: null });
        }
        
        wx.showLoading({ title: '刷新中...' });
        this.generateNewQRCode();
        wx.hideLoading();
    }
});
