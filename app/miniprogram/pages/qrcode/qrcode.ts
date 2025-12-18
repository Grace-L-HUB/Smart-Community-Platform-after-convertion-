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
        // 倒计时相关
        countdown: 60,
        validTime: '60秒',
        countdownTimer: null as any,
        loading: false,
        canvasId: 'qrcode-canvas'
    },

    onLoad(options: any) {
        if (options.type) {
            this.setData({ type: options.type });
        }
        this.initUserInfo();
    },

    onReady() {
        // 页面渲染完成后再生成二维码
        setTimeout(() => {
            this.generateNewQRCode();
        }, 300); // 稍微延迟确保Canvas元素完全准备好
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

    // 生成新的二维码
    generateNewQRCode() {
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

    // 启动倒计时
    startCountdown() {
        // 清除之前的定时器
        if (this.data.countdownTimer) {
            clearInterval(this.data.countdownTimer);
        }

        const timer = setInterval(() => {
            const countdown = this.data.countdown - 1;
            
            if (countdown <= 0) {
                // 倒计时结束，自动重新生成
                clearInterval(this.data.countdownTimer);
                this.setData({ 
                    countdownTimer: null,
                    validTime: '已过期，正在重新生成...'
                });
                
                // 自动重新生成二维码
                setTimeout(() => {
                    this.generateNewQRCode();
                }, 1000);
            } else {
                this.setData({ 
                    countdown: countdown,
                    validTime: `${countdown}秒`
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
