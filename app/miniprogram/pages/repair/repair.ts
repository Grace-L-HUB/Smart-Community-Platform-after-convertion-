// pages/repair/repair.ts
Page({
    data: {
        type: '1',
        message: '',
        fileList: [],
    },

    onTypeChange(event: any) {
        this.setData({ type: event.detail });
    },

    onMessageChange(event: any) {
        this.setData({ message: event.detail });
    },

    afterRead(event: any) {
        const { file } = event.detail;
        // When real API is ready, upload image here
        const { fileList = [] } = this.data;
        fileList.push({ ...file });
        this.setData({ fileList });
    },

    deleteFile(event: any) {
        const { index } = event.detail;
        const { fileList } = this.data;
        fileList.splice(index, 1);
        this.setData({ fileList });
    },

    onSubmit() {
        wx.showToast({ title: '提交成功' });
        setTimeout(() => wx.navigateBack(), 1500);
    }
});
