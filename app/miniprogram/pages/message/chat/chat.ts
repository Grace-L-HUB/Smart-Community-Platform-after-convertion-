// pages/message/chat/chat.ts
import { API_BASE_URL } from '../../../config/api'
const API_COMMUNITY_URL = 'http://139.224.17.154:8000/api/community'

Page({
    data: {
        messages: [] as any[],
        inputValue: '',
        targetName: '商家',
        targetId: '',
        itemId: '',
        conversationId: '',
        scrollToView: '',
        loading: false,
        pollTimer: null as any,
        lastMessageTime: ''
    },

    onLoad(options: any) {
        if (options.targetName) {
            wx.setNavigationBarTitle({ title: options.targetName });
            this.setData({ targetName: options.targetName });
        }
        if (options.targetId) {
            this.setData({ targetId: options.targetId });
        }
        if (options.itemId) {
            this.setData({ itemId: options.itemId });
            // Suggest "I want this" if coming from an item
            this.setData({
                inputValue: '你好，我对这个商品感兴趣'
            });
        }
        if (options.conversationId) {
            this.setData({ conversationId: options.conversationId });
            this.loadMessages();
            this.startPolling();
        }
    },

    onShow() {
        if (this.data.conversationId) {
            this.startPolling();
        }
    },

    onHide() {
        this.stopPolling();
    },

    onUnload() {
        this.stopPolling();
    },

    // 获取用户token
    getUserToken() {
        const userInfo = wx.getStorageSync('userInfo');
        return userInfo ? userInfo.token : null;
    },

    // 加载消息历史
    loadMessages() {
        const token = this.getUserToken();
        if (!token) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        wx.request({
            url: `${API_BASE_URL}/conversations/${this.data.conversationId}/messages/`,
            method: 'GET',
            header: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.results) {
                    const messages = res.data.results.map((msg: any) => ({
                        id: msg.id,
                        type: msg.message_type,
                        content: msg.content,
                        isMe: msg.sender.id === this.getCurrentUserId(),
                        time: this.formatTime(msg.created_at),
                        avatar: msg.sender.avatar || ''
                    }));

                    this.setData({ messages });
                    
                    // 更新最后消息时间
                    if (messages.length > 0) {
                        this.setData({ 
                            lastMessageTime: res.data.results[res.data.results.length - 1].created_at 
                        });
                    }

                    // 滚动到底部
                    this.scrollToBottom();
                }
            },
            fail: () => {
                wx.showToast({ title: '加载消息失败', icon: 'none' });
            }
        });
    },

    // 获取当前用户ID
    getCurrentUserId() {
        const userInfo = wx.getStorageSync('userInfo');
        return userInfo ? userInfo.user_id : null;
    },

    // 格式化时间
    formatTime(timeStr: string) {
        const date = new Date(timeStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    // 滚动到底部
    scrollToBottom() {
        if (this.data.messages.length > 0) {
            const lastMessage = this.data.messages[this.data.messages.length - 1];
            this.setData({ scrollToView: `msg-${lastMessage.id}` });
        }
    },

    // 开始轮询新消息
    startPolling() {
        this.stopPolling(); // 先停止之前的轮询
        
        this.data.pollTimer = setInterval(() => {
            this.pollNewMessages();
        }, 3000); // 每3秒轮询一次
    },

    // 停止轮询
    stopPolling() {
        if (this.data.pollTimer) {
            clearInterval(this.data.pollTimer);
            this.setData({ pollTimer: null });
        }
    },

    // 轮询新消息
    pollNewMessages() {
        if (!this.data.lastMessageTime) return;

        const token = this.getUserToken();
        if (!token) return;

        wx.request({
            url: `${API_BASE_URL}/conversations/${this.data.conversationId}/poll/`,
            method: 'GET',
            header: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: {
                since: this.data.lastMessageTime
            },
            success: (res: any) => {
                if (res.statusCode === 200 && res.data.length > 0) {
                    const newMessages = res.data.map((msg: any) => ({
                        id: msg.id,
                        type: msg.message_type,
                        content: msg.content,
                        isMe: msg.sender.id === this.getCurrentUserId(),
                        time: this.formatTime(msg.created_at),
                        avatar: msg.sender.avatar || ''
                    }));

                    this.setData({ 
                        messages: [...this.data.messages, ...newMessages],
                        lastMessageTime: res.data[res.data.length - 1].created_at
                    });

                    this.scrollToBottom();
                }
            }
        });
    },

    onInput(e: any) {
        this.setData({ inputValue: e.detail.value });
    },

    onSend() {
        const content = this.data.inputValue.trim();
        if (!content) return;

        const token = this.getUserToken();
        if (!token) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }

        // 先添加到本地消息列表（乐观更新）
        const tempMessage = {
            id: `temp-${Date.now()}`,
            type: 'text',
            content,
            isMe: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sending: true
        };

        this.setData({
            messages: [...this.data.messages, tempMessage],
            inputValue: ''
        });
        this.scrollToBottom();

        // 发送到服务器
        wx.request({
            url: `${API_BASE_URL}/conversations/${this.data.conversationId}/send/`,
            method: 'POST',
            header: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: {
                content: content,
                message_type: 'text'
            },
            success: (res: any) => {
                if (res.statusCode === 201) {
                    // 替换临时消息为真实消息
                    const messages = this.data.messages.map(msg => {
                        if (msg.id === tempMessage.id) {
                            return {
                                id: res.data.id,
                                type: res.data.message_type,
                                content: res.data.content,
                                isMe: true,
                                time: this.formatTime(res.data.created_at),
                                sending: false
                            };
                        }
                        return msg;
                    });

                    this.setData({ 
                        messages,
                        lastMessageTime: res.data.created_at
                    });
                    this.scrollToBottom();
                } else {
                    // 发送失败，移除临时消息
                    this.setData({
                        messages: this.data.messages.filter(msg => msg.id !== tempMessage.id)
                    });
                    wx.showToast({ title: '发送失败', icon: 'none' });
                }
            },
            fail: () => {
                // 发送失败，移除临时消息
                this.setData({
                    messages: this.data.messages.filter(msg => msg.id !== tempMessage.id)
                });
                wx.showToast({ title: '网络错误', icon: 'none' });
            }
        });
    }
});
