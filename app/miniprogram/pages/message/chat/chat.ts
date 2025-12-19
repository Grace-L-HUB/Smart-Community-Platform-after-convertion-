// pages/message/chat/chat.ts
Page({
    data: {
        messages: [] as any[],
        inputValue: '',
        targetName: '商家',
        targetId: '',
        itemId: '',
        scrollToView: ''
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

        // Mock initial messages
        this.setData({
            messages: [
                { id: 'msg1', type: 'text', content: '您好，有什么可以帮您的？', isMe: false, time: '10:00' }
            ]
        });
    },

    onInput(e: any) {
        this.setData({ inputValue: e.detail.value });
    },

    onSend() {
        const content = this.data.inputValue.trim();
        if (!content) return;

        const newMessage = {
            id: `msg${Date.now()}`,
            type: 'text',
            content,
            isMe: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const messages = [...this.data.messages, newMessage];

        this.setData({
            messages,
            inputValue: '',
            scrollToView: newMessage.id
        });

        // Mock reply
        setTimeout(() => {
            const reply = {
                id: `msg${Date.now() + 1}`,
                type: 'text',
                content: '好的，还在的，可以自提。',
                isMe: false,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            this.setData({
                messages: [...this.data.messages, reply],
                scrollToView: reply.id
            });
        }, 1000);
    }
});
